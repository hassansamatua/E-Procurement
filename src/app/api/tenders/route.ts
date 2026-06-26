import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { tenderSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateId, generateTenderNumber, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (search) {
      whereClause += ' AND (t.title LIKE ? OR t.tender_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    if (category) {
      whereClause += ' AND t.category_id = ?';
      params.push(category);
    }

    // Suppliers can only see published tenders
    if (user.role === 'SUPPLIER') {
      whereClause += ' AND t.status IN (?, ?, ?)';
      params.push('PUBLISHED', 'CLOSED', 'AWARDED');
    } else if (user.organizationId && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      whereClause += ' AND t.organization_id = ?';
      params.push(user.organizationId);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM tenders t WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const tenders = await query(
      `SELECT t.*, tc.name as category_name, o.name as organization_name,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
              (SELECT json_agg(json_build_object('id', td.id, 'document_name', td.document_name, 'file_path', td.file_path))
               FROM tender_documents td WHERE td.tender_id = t.id AND td.is_public = true) as documents
       FROM tenders t
       LEFT JOIN tender_categories tc ON t.category_id = tc.id
       JOIN organizations o ON t.organization_id = o.id
       JOIN users u ON t.created_by = u.id
       WHERE ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Tenders fetched',
      data: tenders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get tenders error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePost(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    console.log('Tender creation request body:', body);
    const validation = tenderSchema.safeParse(body);

    if (!validation.success) {
      console.log('Tender validation errors:', validation.error.flatten().fieldErrors);
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const data = validation.data;
    const tenderId = generateId();
    const tenderNumber = generateTenderNumber();

    await execute(
      `INSERT INTO tenders (id, tender_number, title, description, category_id, procurement_request_id,
       procurement_method, budget_estimate, currency, submission_deadline, opening_date, closing_date,
       status, evaluation_criteria, organization_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)`,
      [
        tenderId, tenderNumber, data.title, data.description, null, // Set category_id to null for now
        data.procurement_request_id || null, data.procurement_method, data.budget_estimate || null,
        data.currency, data.submission_deadline, data.opening_date, data.closing_date,
        data.evaluation_criteria ? JSON.stringify(data.evaluation_criteria) : null,
        user.organizationId, user.userId,
      ]
    );

    // Save tender document if provided
    if (data.document_url) {
      await execute(
        `INSERT INTO tender_documents (id, tender_id, document_name, file_path, file_size, mime_type, is_public)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(),
          tenderId,
          'Tender Document',
          data.document_url,
          0, // File size not available from Cloudinary
          'application/pdf',
          true,
        ]
      );
    }

    // Update procurement request status if linked
    if (data.procurement_request_id) {
      await execute(
        'UPDATE procurement_requests SET status = ? WHERE id = ?',
        ['TENDER_CREATED', data.procurement_request_id]
      );
    }

    await createAuditLog({
      userId: user.userId,
      action: 'TENDER_CREATED',
      module: 'tenders',
      description: `Created tender ${tenderNumber}: ${data.title}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Tender created', data: { id: tenderId, tender_number: tenderNumber } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create tender error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Publish/Close/Cancel tender
async function handlePatch(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    console.log('Tender PATCH request body:', body);
    const { tenderId, action } = body;

    const tender = await queryOne<{ id: string; tender_number: string; title: string; status: string; organization_id: string }>(
      'SELECT * FROM tenders WHERE id = ?',
      [tenderId]
    );

    if (!tender) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Tender not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'PUBLISH':
        if (tender.status !== 'DRAFT') {
          return NextResponse.json<ApiResponse>(
            { success: false, message: 'Only draft tenders can be published' },
            { status: 400 }
          );
        }
        await execute(
          'UPDATE tenders SET status = ?, published_at = NOW() WHERE id = ?',
          ['PUBLISHED', tenderId]
        );

        // Notify all approved suppliers
        const suppliers = await query<{ user_id: string; email: string; contact_person: string }[]>(
          'SELECT user_id, email, contact_person FROM suppliers WHERE status = ?',
          ['APPROVED']
        );

        for (const supplier of suppliers) {
          if (supplier.user_id) {
            await createNotification({
              userId: supplier.user_id,
              title: 'New Tender Published',
              message: `A new tender "${tender.title}" (${tender.tender_number}) has been published.`,
              type: 'INFO',
              category: 'tender_published',
              referenceId: tenderId,
              referenceType: 'tender',
              sendEmail: true,
              emailTo: supplier.email,
              emailTemplate: 'tender_published',
              emailVariables: { tender_title: tender.title, submission_deadline: '' },
            });
          }
        }
        break;

      case 'CLOSE':
        await execute('UPDATE tenders SET status = ? WHERE id = ?', ['CLOSED', tenderId]);
        break;

      case 'CANCEL':
        await execute('UPDATE tenders SET status = ? WHERE id = ?', ['CANCELLED', tenderId]);
        break;

      case 'EVALUATE':
        await execute('UPDATE tenders SET status = ? WHERE id = ?', ['UNDER_EVALUATION', tenderId]);
        break;

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    await createAuditLog({
      userId: user.userId,
      action: `TENDER_${action}`,
      module: 'tenders',
      description: `${action} tender ${tender.tender_number}`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Tender ${action.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Tender action error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost, ['PROCUREMENT_OFFICER']);
export const PATCH = withAuth(handlePatch, ['PROCUREMENT_OFFICER']);
