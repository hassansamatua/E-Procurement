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
        tenderId, tenderNumber, data.title, data.description, data.category_id || null,
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

        // Notify Evaluation Officer
        const evalOfficer = await queryOne<{ id: string }>(
          `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id
           WHERE r.name = 'EVALUATION_OFFICER' AND u.organization_id = ? AND u.is_active = TRUE LIMIT 1`,
          [tender.organization_id]
        );
        if (evalOfficer) {
          await createNotification({
            userId: evalOfficer.id,
            title: 'Tender Ready for Evaluation',
            message: `Tender "${tender.title}" (${tender.tender_number}) is ready for evaluation.`,
            type: 'INFO',
            category: 'tender_evaluation',
            referenceId: tenderId,
            referenceType: 'tender',
          });
        }
        break;

      case 'FORWARD_TO_ACCOUNTING':
        await execute('UPDATE tenders SET status = ? WHERE id = ?', ['PENDING_AWARD_APPROVAL', tenderId]);

        // Notify Accounting Officer
        const accountingOfficer = await queryOne<{ id: string }>(
          `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id
           WHERE r.name = 'ACCOUNTING_OFFICER' AND u.organization_id = ? AND u.is_active = TRUE LIMIT 1`,
          [tender.organization_id]
        );
        if (accountingOfficer) {
          await createNotification({
            userId: accountingOfficer.id,
            title: 'Award Approval Required',
            message: `Tender "${tender.title}" (${tender.tender_number}) is ready for award approval. Please review and approve.`,
            type: 'INFO',
            category: 'award_approval',
            referenceId: tenderId,
            referenceType: 'tender',
          });
        }
        break;

      case 'PUBLISH_AWARD':
        await execute('UPDATE tenders SET status = ? WHERE id = ?', ['AWARDED', tenderId]);

        console.log('PUBLISH_AWARD: Tender updated to AWARDED');

        // Update all bid statuses: winner to AWARDED, others to REJECTED
        const evaluationResult = await queryOne<{
          id: string;
          winner_bid_id: string;
          second_runner_up_bid_id: string;
          third_runner_up_bid_id: string;
        }>(
          'SELECT * FROM evaluation_results WHERE tender_id = ?',
          [tenderId]
        );

        console.log('PUBLISH_AWARD: Evaluation result:', evaluationResult);

        if (evaluationResult) {
          // Update winner bid to AWARDED
          await execute(
            'UPDATE bids SET status = ? WHERE id = ?',
            ['AWARDED', evaluationResult.winner_bid_id]
          );

          // Update all other bids to REJECTED
          await execute(
            `UPDATE bids SET status = 'REJECTED' WHERE tender_id = ? AND id != ?`,
            [tenderId, evaluationResult.winner_bid_id]
          );

          console.log('PUBLISH_AWARD: Bid statuses updated');

          // Get all bids for this tender with supplier info
          const allBids = await query(
            `SELECT b.id, b.supplier_id, s.user_id, s.company_name 
             FROM bids b 
             JOIN suppliers s ON b.supplier_id = s.id 
             WHERE b.tender_id = ?`,
            [tenderId]
          ) as any[];

          console.log('PUBLISH_AWARD: All bids with suppliers:', allBids);

          // Notify each supplier based on their position
          for (const bid of allBids) {
            if (!bid.user_id) {
              console.log('PUBLISH_AWARD: Skipping supplier without user_id:', bid.company_name);
              continue;
            }

            let title = '';
            let message = '';
            let type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO';

            if (bid.id === evaluationResult.winner_bid_id) {
              // Winner
              const awardedBid = await queryOne<{ contract_signing_date: string }>(
                'SELECT contract_signing_date FROM bids WHERE id = ?',
                [bid.id]
              );
              title = 'Congratulations! Your Bid Has Been Awarded';
              message = `Your bid for tender "${tender.title}" (${tender.tender_number}) has been awarded (1st Position). Contract signing date: ${awardedBid?.contract_signing_date ? new Date(awardedBid.contract_signing_date).toLocaleDateString() : 'To be scheduled'}. Please contact the procurement office.`;
              type = 'SUCCESS';
            } else if (bid.id === evaluationResult.second_runner_up_bid_id) {
              // 2nd runner-up
              title = 'Bid Result - 2nd Position';
              message = `Your bid for tender "${tender.title}" (${tender.tender_number}) was successful. You achieved 2nd position. Thank you for your participation.`;
              type = 'INFO';
            } else if (bid.id === evaluationResult.third_runner_up_bid_id) {
              // 3rd runner-up
              title = 'Bid Result - 3rd Position';
              message = `Your bid for tender "${tender.title}" (${tender.tender_number}) was successful. You achieved 3rd position. Thank you for your participation.`;
              type = 'INFO';
            } else {
              // Rejected
              title = 'Bid Result - Not Selected';
              message = `Your bid for tender "${tender.title}" (${tender.tender_number}) was not selected. Thank you for your participation.`;
              type = 'WARNING';
            }

            await createNotification({
              userId: bid.user_id,
              title,
              message,
              type,
              category: bid.id === evaluationResult.winner_bid_id ? 'bid_awarded' : 'bid_rejected',
              referenceId: bid.id,
              referenceType: 'bid',
            });

            console.log('PUBLISH_AWARD: Notification sent to:', bid.company_name, title);
          }
        }
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
