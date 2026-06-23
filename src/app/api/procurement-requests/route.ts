import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { procurementRequestSchema, approvalSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateId, generateRequestNumber, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (search) {
      whereClause += ' AND (pr.title LIKE ? OR pr.request_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND pr.status = ?';
      params.push(status);
    }

    if (priority) {
      whereClause += ' AND pr.priority = ?';
      params.push(priority);
    }

    // Role-based filtering
    switch (user.role) {
      case 'STAFF':
        whereClause += ' AND pr.requested_by = ?';
        params.push(user.userId);
        break;
      case 'HOD':
        whereClause += ' AND pr.organization_id = ? AND pr.status IN (?, ?, ?)';
        params.push(user.organizationId, 'PENDING_HOD', 'HOD_APPROVED', 'HOD_REJECTED');
        break;
      case 'PROCUREMENT_OFFICER':
        whereClause += ' AND pr.organization_id = ? AND pr.status NOT IN (?, ?)';
        params.push(user.organizationId, 'DRAFT', 'PENDING_HOD');
        break;
      case 'ACCOUNTING_OFFICER':
        whereClause += ' AND pr.organization_id = ? AND pr.status IN (?, ?, ?)';
        params.push(user.organizationId, 'PENDING_FINANCE', 'FINANCE_APPROVED', 'FINANCE_REJECTED');
        break;
      default:
        if (user.organizationId) {
          whereClause += ' AND pr.organization_id = ?';
          params.push(user.organizationId);
        }
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM procurement_requests pr WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const requests = await query(
      `SELECT pr.*, pc.name as category_name,
              CONCAT(u.first_name, ' ', u.last_name) as requester_name,
              o.name as organization_name
       FROM procurement_requests pr
       LEFT JOIN procurement_categories pc ON pr.category_id = pc.id
       JOIN users u ON pr.requested_by = u.id
       JOIN organizations o ON pr.organization_id = o.id
       WHERE ${whereClause}
       ORDER BY pr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Procurement requests fetched',
      data: requests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get requests error:', error);
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
    const validation = procurementRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const data = validation.data;
    const requestId = generateId();
    const requestNumber = generateRequestNumber();

    await execute(
      `INSERT INTO procurement_requests (id, request_number, title, description, category_id, estimated_budget, 
       currency, priority, status, requested_by, organization_id, department, justification, delivery_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_HOD', ?, ?, ?, ?, ?)`,
      [
        requestId, requestNumber, data.title, data.description, data.category_id || null,
        data.estimated_budget || null, data.currency, data.priority, user.userId,
        user.organizationId, body.department || null, data.justification || null,
        data.delivery_date || null,
      ]
    );

    // Notify HOD
    const hod = await queryOne<{ id: string }>(
      `SELECT u.id FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE r.name = 'HOD' AND u.organization_id = ? AND u.is_active = TRUE 
       LIMIT 1`,
      [user.organizationId]
    );

    if (hod) {
      await createNotification({
        userId: hod.id,
        title: 'New Procurement Request',
        message: `New request "${data.title}" (${requestNumber}) is pending your approval.`,
        type: 'INFO',
        category: 'procurement_request',
        referenceId: requestId,
        referenceType: 'procurement_request',
      });
    }

    await createAuditLog({
      userId: user.userId,
      action: 'REQUEST_CREATED',
      module: 'procurement',
      description: `Created procurement request ${requestNumber}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Procurement request created', data: { id: requestId, request_number: requestNumber } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create request error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Approve/Reject/Return request
async function handlePatch(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { requestId } = body;
    
    const validation = approvalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const { action, comments, financial_remarks } = validation.data;

    const request = await queryOne<{ id: string; request_number: string; title: string; status: string; requested_by: string; organization_id: string }>(
      'SELECT * FROM procurement_requests WHERE id = ?',
      [requestId]
    );

    if (!request) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Request not found' },
        { status: 404 }
      );
    }

    let newStatus: string;
    let notifyUserId: string = request.requested_by;
    let notificationTitle: string;
    let notificationMessage: string;

    // Determine new status based on role and action
    switch (user.role) {
      case 'HOD':
        if (action === 'APPROVED') {
          newStatus = 'PENDING_PROCUREMENT';
          notificationTitle = 'Request Approved by HOD';
          notificationMessage = `Your request "${request.title}" has been approved by HOD.`;
        } else if (action === 'REJECTED') {
          newStatus = 'HOD_REJECTED';
          notificationTitle = 'Request Rejected by HOD';
          notificationMessage = `Your request "${request.title}" has been rejected by HOD. Reason: ${comments || 'N/A'}`;
        } else {
          newStatus = 'DRAFT';
          notificationTitle = 'Request Returned for Correction';
          notificationMessage = `Your request "${request.title}" has been returned. Comments: ${comments || 'N/A'}`;
        }
        break;

      case 'PROCUREMENT_OFFICER':
        if (action === 'APPROVED') {
          newStatus = 'PENDING_FINANCE';
          notificationTitle = 'Request Approved by Procurement';
          notificationMessage = `Request "${request.title}" has been approved and forwarded to Finance.`;
        } else {
          newStatus = 'PROCUREMENT_REJECTED';
          notificationTitle = 'Request Rejected by Procurement';
          notificationMessage = `Your request "${request.title}" has been rejected by Procurement Officer.`;
        }
        break;

      case 'ACCOUNTING_OFFICER':
        if (action === 'APPROVED') {
          newStatus = 'APPROVED';
          notificationTitle = 'Request Financially Approved';
          notificationMessage = `Your request "${request.title}" has been approved for procurement.`;
        } else {
          newStatus = 'FINANCE_REJECTED';
          notificationTitle = 'Request Rejected by Finance';
          notificationMessage = `Your request "${request.title}" has been rejected by Finance. Remarks: ${financial_remarks || 'N/A'}`;
        }
        break;

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Unauthorized action' },
          { status: 403 }
        );
    }

    // Update request status
    await execute('UPDATE procurement_requests SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, requestId]);

    // Create approval record
    await execute(
      `INSERT INTO request_approvals (id, request_id, approver_id, role, action, comments, financial_remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), requestId, user.userId, user.role, action, comments || null, financial_remarks || null]
    );

    // Notify requester
    await createNotification({
      userId: notifyUserId,
      title: notificationTitle,
      message: notificationMessage,
      type: action === 'APPROVED' ? 'SUCCESS' : action === 'REJECTED' ? 'ERROR' : 'WARNING',
      category: 'request_approval',
      referenceId: requestId,
      referenceType: 'procurement_request',
    });

    // If approved by finance, also notify procurement officer
    if (user.role === 'ACCOUNTING_OFFICER' && action === 'APPROVED') {
      const procOfficer = await queryOne<{ id: string }>(
        `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id 
         WHERE r.name = 'PROCUREMENT_OFFICER' AND u.organization_id = ? AND u.is_active = TRUE LIMIT 1`,
        [request.organization_id]
      );
      if (procOfficer) {
        await createNotification({
          userId: procOfficer.id,
          title: 'Request Ready for Tender',
          message: `Request "${request.title}" (${request.request_number}) is approved and ready for tender creation.`,
          type: 'SUCCESS',
          category: 'request_approved',
          referenceId: requestId,
          referenceType: 'procurement_request',
        });
      }
    }

    await createAuditLog({
      userId: user.userId,
      action: `REQUEST_${action}`,
      module: 'procurement',
      description: `${action} request ${request.request_number}`,
      newValues: { status: newStatus, comments, financial_remarks },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Request ${action.toLowerCase()} successfully`,
      data: { status: newStatus },
    });
  } catch (error) {
    console.error('Request approval error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost, ['STAFF']);
export const PATCH = withAuth(handlePatch, ['HOD', 'PROCUREMENT_OFFICER', 'ACCOUNTING_OFFICER']);
