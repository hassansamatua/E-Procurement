import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateId, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const supplierId = searchParams.get('supplier_id') || '';
    const contractId = searchParams.get('contract_id') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (supplierId) {
      whereClause += ' AND sr.supplier_id = ?';
      params.push(supplierId);
    }

    if (contractId) {
      whereClause += ' AND sr.contract_id = ?';
      params.push(contractId);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM supplier_ratings sr WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const ratings = await query(
      `SELECT sr.*, s.company_name as supplier_name, c.contract_number, c.title as contract_title,
              CONCAT(u.first_name, ' ', u.last_name) as rated_by_name
       FROM supplier_ratings sr
       JOIN suppliers s ON sr.supplier_id = s.id
       JOIN contracts c ON sr.contract_id = c.id
       JOIN users u ON sr.rated_by = u.id
       WHERE ${whereClause}
       ORDER BY sr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Supplier ratings fetched',
      data: ratings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get supplier ratings error:', error);
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
    const { supplier_id, contract_id, quality_score, delivery_score, compliance_score, communication_score, comments } = body;

    // Validate scores (1-5)
    const scores = { quality_score, delivery_score, compliance_score, communication_score };
    for (const [key, value] of Object.entries(scores)) {
      if (value < 1 || value > 5) {
        return NextResponse.json<ApiResponse>(
          { success: false, message: `${key} must be between 1 and 5` },
          { status: 400 }
        );
      }
    }

    // Verify contract exists and belongs to organization
    const contract = await queryOne<{ id: string; supplier_id: string; title: string; organization_id: string }>(
      'SELECT id, supplier_id, title, organization_id FROM contracts WHERE id = ?',
      [contract_id]
    );

    if (!contract) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.supplier_id !== supplier_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Contract does not belong to this supplier' },
        { status: 400 }
      );
    }

    // Check if already rated
    const existingRating = await queryOne<{ id: string }>(
      'SELECT id FROM supplier_ratings WHERE contract_id = ? AND rated_by = ?',
      [contract_id, user.userId]
    );

    if (existingRating) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Contract already rated by this user' },
        { status: 409 }
      );
    }

    const ratingId = generateId();
    const overallScore = Math.round((quality_score + delivery_score + compliance_score + communication_score) / 4);
    const averageScore = (quality_score + delivery_score + compliance_score + communication_score) / 4;

    await execute(
      `INSERT INTO supplier_ratings (id, supplier_id, contract_id, rated_by, quality_score, delivery_score, 
       compliance_score, communication_score, overall_score, average_score, comments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ratingId, supplier_id, contract_id, user.userId, quality_score, delivery_score,
        compliance_score, communication_score, overallScore, averageScore, comments || null,
      ]
    );

    // Update supplier performance score (average of all ratings)
    const avgResult = await queryOne<{ avg_score: number }>(
      `SELECT AVG(average_score) as avg_score FROM supplier_ratings WHERE supplier_id = ?`,
      [supplier_id]
    );
    
    const newPerformanceScore = avgResult ? Math.round(avgResult.avg_score * 100) / 100 : 0;
    await execute(
      'UPDATE suppliers SET performance_score = ? WHERE id = ?',
      [newPerformanceScore, supplier_id]
    );

    await createAuditLog({
      userId: user.userId,
      action: 'SUPPLIER_RATED',
      module: 'supplier_ratings',
      description: `Rated supplier ${supplier_id} with score ${overallScore}/5`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Supplier rating submitted', data: { id: ratingId, performanceScore: newPerformanceScore } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create supplier rating error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER']);
export const POST = withAuth(handlePost, ['PROCUREMENT_OFFICER']);
