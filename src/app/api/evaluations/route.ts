import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { evaluationSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateId, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const tenderId = searchParams.get('tender_id') || '';
    const bidId = searchParams.get('bid_id') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (tenderId) {
      whereClause += ' AND b.tender_id = ?';
      params.push(tenderId);
    }

    if (bidId) {
      whereClause += ' AND e.bid_id = ?';
      params.push(bidId);
    }

    const evaluations = await query(
      `SELECT e.*, b.bid_number, s.company_name as supplier_name,
              CONCAT(u.first_name, ' ', u.last_name) as evaluator_name
       FROM evaluations e
       JOIN bids b ON e.bid_id = b.id
       JOIN suppliers s ON b.supplier_id = s.id
       JOIN users u ON e.evaluator_id = u.id
       WHERE ${whereClause}
       ORDER BY e.total_score DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Evaluations fetched',
      data: evaluations,
    });
  } catch (error) {
    console.error('Get evaluations error:', error);
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
    const validation = evaluationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const data = validation.data;
    const totalScore = (data.technical_score + data.financial_score + data.experience_score + data.compliance_score) / 4;

    const evaluationId = generateId();

    await execute(
      `INSERT INTO evaluations (id, bid_id, evaluator_id, committee_id, technical_score, financial_score, 
       experience_score, compliance_score, total_score, comments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evaluationId, data.bid_id, user.userId, body.committee_id || null,
        data.technical_score, data.financial_score, data.experience_score,
        data.compliance_score, totalScore, data.comments || null,
      ]
    );

    // Update bid scores
    await execute(
      `UPDATE bids SET technical_score = ?, financial_score = ?, experience_score = ?, 
       compliance_score = ?, total_score = ?, status = 'EVALUATED', evaluated_at = NOW()
       WHERE id = ?`,
      [data.technical_score, data.financial_score, data.experience_score, data.compliance_score, totalScore, data.bid_id]
    );

    // Re-rank bids for this tender
    const bid = await queryOne<{ tender_id: string }>('SELECT tender_id FROM bids WHERE id = ?', [data.bid_id]);
    if (bid) {
      const rankedBids = await query<{ id: string }[]>(
        'SELECT id FROM bids WHERE tender_id = ? AND status = ? ORDER BY total_score DESC',
        [bid.tender_id, 'EVALUATED']
      );

      for (let i = 0; i < rankedBids.length; i++) {
        await execute('UPDATE bids SET `rank` = ? WHERE id = ?', [i + 1, rankedBids[i].id]);
      }
    }

    await createAuditLog({
      userId: user.userId,
      action: 'BID_EVALUATED',
      module: 'evaluations',
      description: `Evaluated bid ${data.bid_id} with score ${totalScore}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Evaluation submitted', data: { id: evaluationId, totalScore } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create evaluation error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Award tender to a bid
async function handlePatch(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { tenderId, bidId } = body;

    if (!tenderId || !bidId) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Tender ID and Bid ID are required' },
        { status: 400 }
      );
    }

    const tender = await queryOne<{ id: string; title: string; tender_number: string }>(
      'SELECT id, title, tender_number FROM tenders WHERE id = ?',
      [tenderId]
    );

    if (!tender) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Tender not found' },
        { status: 404 }
      );
    }

    // Award the winning bid
    await execute('UPDATE bids SET status = ? WHERE id = ?', ['AWARDED', bidId]);
    await execute('UPDATE tenders SET status = ? WHERE id = ?', ['AWARDED', tenderId]);

    // Reject other bids
    await execute(
      'UPDATE bids SET status = ? WHERE tender_id = ? AND id != ? AND status != ?',
      ['REJECTED', tenderId, bidId, 'DISQUALIFIED']
    );

    // Get winner supplier info
    const winningBid = await queryOne<{ supplier_id: string }>(
      'SELECT supplier_id FROM bids WHERE id = ?',
      [bidId]
    );

    if (winningBid) {
      const winner = await queryOne<{ user_id: string; email: string; contact_person: string }>(
        'SELECT user_id, email, contact_person FROM suppliers WHERE id = ?',
        [winningBid.supplier_id]
      );

      if (winner && winner.user_id) {
        await createNotification({
          userId: winner.user_id,
          title: 'Congratulations! Bid Awarded',
          message: `Congratulations, your bid for "${tender.title}" has been awarded.`,
          type: 'SUCCESS',
          category: 'bid_awarded',
          referenceId: bidId,
          referenceType: 'bid',
          sendEmail: true,
          emailTo: winner.email,
          emailTemplate: 'bid_awarded',
          emailVariables: { contact_person: winner.contact_person, tender_title: tender.title },
        });
      }
    }

    // Notify losing suppliers
    const losingBids = await query<{ supplier_id: string }[]>(
      'SELECT supplier_id FROM bids WHERE tender_id = ? AND id != ? AND status = ?',
      [tenderId, bidId, 'REJECTED']
    );

    for (const loser of losingBids) {
      const loserSupplier = await queryOne<{ user_id: string; email: string; contact_person: string }>(
        'SELECT user_id, email, contact_person FROM suppliers WHERE id = ?',
        [loser.supplier_id]
      );

      if (loserSupplier && loserSupplier.user_id) {
        await createNotification({
          userId: loserSupplier.user_id,
          title: 'Bid Result',
          message: `Your bid for "${tender.title}" was unsuccessful. Thank you for your participation.`,
          type: 'WARNING',
          category: 'bid_unsuccessful',
          referenceId: tenderId,
          referenceType: 'tender',
          sendEmail: true,
          emailTo: loserSupplier.email,
          emailTemplate: 'bid_unsuccessful',
          emailVariables: { contact_person: loserSupplier.contact_person, tender_title: tender.title },
        });
      }
    }

    await createAuditLog({
      userId: user.userId,
      action: 'TENDER_AWARDED',
      module: 'tenders',
      description: `Awarded tender ${tender.tender_number} to bid ${bidId}`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Tender awarded successfully',
    });
  } catch (error) {
    console.error('Award tender error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER']);
export const POST = withAuth(handlePost, ['PROCUREMENT_OFFICER']);
export const PATCH = withAuth(handlePatch, ['PROCUREMENT_OFFICER']);
