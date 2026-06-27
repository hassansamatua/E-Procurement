import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateId } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenderId = searchParams.get('tender_id') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (tenderId) {
      whereClause += ' AND er.tender_id = ?';
      params.push(tenderId);
    }

    const results = await query(
      `SELECT er.*, t.title as tender_title, t.tender_number, 
              s.company_name as winner_supplier_name, b.bid_amount
       FROM evaluation_results er
       JOIN tenders t ON er.tender_id = t.id
       LEFT JOIN bids b ON er.winner_bid_id = b.id
       LEFT JOIN suppliers s ON b.supplier_id = s.id
       WHERE ${whereClause}
       ORDER BY er.evaluated_at DESC`,
      params
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Evaluation results fetched',
      data: results,
    });
  } catch (error) {
    console.error('Get evaluation results error:', error);
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
    const { tender_id, evaluation_document_url, winner_bid_id, second_runner_up_bid_id, third_runner_up_bid_id, remarks } = body;

    // Verify user is EVALUATION_OFFICER
    const userRole = await queryOne<{ name: string }>(
      `SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [user.userId]
    );

    if (!userRole || userRole.name !== 'EVALUATION_OFFICER') {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Only evaluation officers can submit evaluation results' },
        { status: 403 }
      );
    }

    // Verify tender exists and is under evaluation
    const tender = await queryOne<{ id: string; title: string; tender_number: string; status: string; organization_id: string }>(
      'SELECT * FROM tenders WHERE id = ?',
      [tender_id]
    );

    if (!tender || tender.status !== 'UNDER_EVALUATION') {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Tender not found or not under evaluation' },
        { status: 400 }
      );
    }

    // Verify winner bid exists
    const winnerBid = await queryOne<{ id: string; supplier_id: string }>(
      'SELECT * FROM bids WHERE id = ? AND tender_id = ?',
      [winner_bid_id, tender_id]
    );

    if (!winnerBid) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Winner bid not found' },
        { status: 404 }
      );
    }

    // Create evaluation result
    const resultId = generateId();
    await execute(
      `INSERT INTO evaluation_results (id, tender_id, evaluation_document_url, winner_bid_id, second_runner_up_bid_id, third_runner_up_bid_id, remarks, evaluated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [resultId, tender_id, evaluation_document_url, winner_bid_id, second_runner_up_bid_id, third_runner_up_bid_id, remarks, user.userId]
    );

    // Update tender status
    await execute(
      'UPDATE tenders SET status = ? WHERE id = ?',
      ['EVALUATION_COMPLETE', tender_id]
    );

    // Update all bids status
    await execute(
      `UPDATE bids SET status = 'EVALUATED' WHERE tender_id = ?`,
      [tender_id]
    );

    // Notify Procurement Officer to forward to Accounting
    const procurementOfficer = await queryOne<{ id: string }>(
      `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'PROCUREMENT_OFFICER' AND u.organization_id = ? AND u.is_active = TRUE LIMIT 1`,
      [tender.organization_id]
    );

    if (procurementOfficer) {
      await createNotification({
        userId: procurementOfficer.id,
        title: 'Evaluation Complete - Forward to Accounting',
        message: `Evaluation for tender "${tender.title}" (${tender.tender_number}) is complete. Please forward to Accounting Officer for award approval.`,
        type: 'INFO',
        category: 'evaluation_complete',
        referenceId: resultId,
        referenceType: 'evaluation_result',
      });
    }

    await createAuditLog({
      userId: user.userId,
      action: 'EVALUATION_SUBMITTED',
      module: 'evaluations',
      description: `Submitted evaluation for tender ${tender.tender_number}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Evaluation results submitted successfully', data: { id: resultId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit evaluation error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost, ['EVALUATION_OFFICER']);
