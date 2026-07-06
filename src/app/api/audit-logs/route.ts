import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/middleware/withAuth';
import { getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const action = searchParams.get('action') || '';
    const module = searchParams.get('module') || '';
    const userId = searchParams.get('user_id') || '';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (action) {
      whereClause += ' AND al.action = ?';
      params.push(action);
    }

    if (module) {
      whereClause += ' AND al.module = ?';
      params.push(module);
    }

    if (userId) {
      whereClause += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (dateFrom) {
      whereClause += ' AND al.created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND al.created_at <= ?';
      params.push(dateTo);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM audit_logs al WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const logs = await query(
      `SELECT al.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Audit logs fetched',
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['SUPER_ADMIN', 'ADMIN']);
