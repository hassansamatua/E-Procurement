import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { ApiResponse } from '@/types';

async function handlePost(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { evaluation_result_id, contract_signing_date } = body;

    // Verify user is ACCOUNTING_OFFICER
    const userRole = await queryOne<{ name: string }>(
      `SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [user.userId]
    );

    if (!userRole || userRole.name !== 'ACCOUNTING_OFFICER') {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Only accounting officers can award tenders' },
        { status: 403 }
      );
    }

    // Get evaluation result
    const evaluationResult = await queryOne<{
      id: string;
      tender_id: string;
      winner_bid_id: string;
      organization_id: string;
    }>(
      'SELECT * FROM evaluation_results WHERE id = ?',
      [evaluation_result_id]
    );

    if (!evaluationResult) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Evaluation result not found' },
        { status: 404 }
      );
    }

    // Get tender details
    const tender = await queryOne<{ id: string; title: string; tender_number: string }>(
      'SELECT * FROM tenders WHERE id = ?',
      [evaluationResult.tender_id]
    );

    if (!tender) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Tender not found' },
        { status: 404 }
      );
    }

    // Get winner bid and supplier
    const winnerBid = await queryOne<{ id: string; supplier_id: string; bid_amount: number; currency: string }>(
      'SELECT * FROM bids WHERE id = ?',
      [evaluationResult.winner_bid_id]
    );

    if (!winnerBid) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Winner bid not found' },
        { status: 404 }
      );
    }

    const supplier = await queryOne<{ user_id: string; company_name: string; email: string }>(
      'SELECT * FROM suppliers WHERE id = ?',
      [winnerBid.supplier_id]
    );

    if (!supplier) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Update winner bid status and set signing date
    await execute(
      `UPDATE bids SET status = 'AWARDED', contract_signing_date = ? WHERE id = ?`,
      [contract_signing_date, winnerBid.id]
    );

    // Update other bids to REJECTED
    await execute(
      `UPDATE bids SET status = 'REJECTED' WHERE tender_id = ? AND id != ?`,
      [evaluationResult.tender_id, winnerBid.id]
    );

    // Update tender status to AWARD_APPROVED
    await execute(
      'UPDATE tenders SET status = ? WHERE id = ?',
      ['AWARD_APPROVED', evaluationResult.tender_id]
    );

    // Notify Procurement Officer to publish the award
    const procurementOfficer = await queryOne<{ id: string }>(
      `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'PROCUREMENT_OFFICER' AND u.organization_id = ? AND u.is_active = TRUE LIMIT 1`,
      [evaluationResult.organization_id]
    );

    if (procurementOfficer) {
      await createNotification({
        userId: procurementOfficer.id,
        title: 'Award Approved - Ready to Publish',
        message: `The award for tender "${tender.title}" (${tender.tender_number}) has been approved. Please publish the award announcement to notify suppliers.`,
        type: 'INFO',
        category: 'award_approved',
        referenceId: evaluationResult.tender_id,
        referenceType: 'tender',
      });
    }

    await createAuditLog({
      userId: user.userId,
      action: 'AWARD_APPROVED',
      module: 'awards',
      description: `Approved award for tender ${tender.tender_number}, winner: ${supplier.company_name}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Award approved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Award approval error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePost, ['ACCOUNTING_OFFICER']);
