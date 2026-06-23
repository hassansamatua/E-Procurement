import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (search) {
      whereClause += ' AND (s.company_name LIKE ? OR s.email LIKE ? OR s.contact_person LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    if (category) {
      whereClause += ' AND JSON_CONTAINS(s.categories, ?)';
      params.push(JSON.stringify(category));
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM suppliers s WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const suppliers = await query(
      `SELECT s.*, u.first_name as approver_first_name, u.last_name as approver_last_name
       FROM suppliers s
       LEFT JOIN users u ON s.approved_by = u.id
       WHERE ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Suppliers fetched',
      data: suppliers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER']);

// Approve/Reject/Blacklist supplier
export const PATCH = withAuth(async (req: NextRequest) => {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { supplierId, action, reason } = body;

    if (!supplierId || !action) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Supplier ID and action are required' },
        { status: 400 }
      );
    }

    const supplier = await queryOne<{ id: string; user_id: string; company_name: string; email: string; contact_person: string }>(
      'SELECT id, user_id, company_name, email, contact_person FROM suppliers WHERE id = ?',
      [supplierId]
    );

    if (!supplier) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Supplier not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'APPROVE':
        await execute(
          'UPDATE suppliers SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
          ['APPROVED', user.userId, supplierId]
        );
        await execute('UPDATE users SET is_active = TRUE WHERE id = ?', [supplier.user_id]);

        await createNotification({
          userId: supplier.user_id,
          title: 'Registration Approved',
          message: `Your supplier registration for ${supplier.company_name} has been approved.`,
          type: 'SUCCESS',
          category: 'supplier_approval',
          referenceId: supplierId,
          referenceType: 'supplier',
          sendEmail: true,
          emailTo: supplier.email,
          emailTemplate: 'supplier_approved',
          emailVariables: { contact_person: supplier.contact_person, company_name: supplier.company_name },
        });
        break;

      case 'REJECT':
        await execute(
          'UPDATE suppliers SET status = ?, rejection_reason = ? WHERE id = ?',
          ['REJECTED', reason || null, supplierId]
        );

        await createNotification({
          userId: supplier.user_id,
          title: 'Registration Rejected',
          message: `Your supplier registration has been rejected. Reason: ${reason || 'Not specified'}`,
          type: 'ERROR',
          category: 'supplier_rejection',
          referenceId: supplierId,
          referenceType: 'supplier',
          sendEmail: true,
          emailTo: supplier.email,
          emailTemplate: 'supplier_rejected',
          emailVariables: { contact_person: supplier.contact_person, company_name: supplier.company_name, reason: reason || 'Not specified' },
        });
        break;

      case 'BLACKLIST':
        await execute(
          'UPDATE suppliers SET status = ?, is_blacklisted = TRUE, blacklist_reason = ? WHERE id = ?',
          ['BLACKLISTED', reason || null, supplierId]
        );
        await execute('UPDATE users SET is_suspended = TRUE WHERE id = ?', [supplier.user_id]);
        break;

      case 'REQUEST_INFO':
        await createNotification({
          userId: supplier.user_id,
          title: 'Additional Information Required',
          message: reason || 'Please provide additional documents for your registration.',
          type: 'WARNING',
          category: 'supplier_info_request',
          referenceId: supplierId,
          referenceType: 'supplier',
        });
        break;

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    await createAuditLog({
      userId: user.userId,
      action: `SUPPLIER_${action}`,
      module: 'suppliers',
      description: `${action} supplier ${supplier.company_name}`,
      newValues: { action, reason },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Supplier ${action.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Supplier action error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['SUPER_ADMIN', 'ADMIN']);
