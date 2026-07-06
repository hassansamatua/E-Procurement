import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { createAuditLog } from '@/lib/audit';
import { generateId, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const tenderId = searchParams.get('tender_id') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (tenderId) {
      whereClause += ' AND ec.tender_id = ?';
      params.push(tenderId);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM evaluation_committees ec WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const committees = await query(
      `SELECT ec.*, t.tender_number, t.title as tender_title,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
              (SELECT COUNT(*) FROM evaluation_committee_members ecm WHERE ecm.committee_id = ec.id) as member_count
       FROM evaluation_committees ec
       JOIN tenders t ON ec.tender_id = t.id
       JOIN users u ON ec.created_by = u.id
       WHERE ${whereClause}
       ORDER BY ec.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Evaluation committees fetched',
      data: committees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get evaluation committees error:', error);
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
    const { tender_id, name, members } = body;

    if (!tender_id || !name) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Tender ID and name are required' },
        { status: 400 }
      );
    }

    // Verify tender exists
    const tender = await queryOne<{ id: string }>('SELECT id FROM tenders WHERE id = ?', [tender_id]);
    if (!tender) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Tender not found' },
        { status: 404 }
      );
    }

    const committeeId = generateId();

    await execute(
      `INSERT INTO evaluation_committees (id, tender_id, name, created_by)
       VALUES (?, ?, ?, ?)`,
      [committeeId, tender_id, name, user.userId]
    );

    // Add committee members if provided
    if (members && Array.isArray(members)) {
      for (const member of members) {
        const memberId = generateId();
        await execute(
          `INSERT INTO evaluation_committee_members (id, committee_id, user_id, role)
           VALUES (?, ?, ?, ?)`,
          [memberId, committeeId, member.user_id, member.role || 'MEMBER']
        );
      }
    }

    await createAuditLog({
      userId: user.userId,
      action: 'EVALUATION_COMMITTEE_CREATED',
      module: 'evaluation_committees',
      description: `Created evaluation committee "${name}" for tender ${tender_id}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Evaluation committee created', data: { id: committeeId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create evaluation committee error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePatch(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { committeeId, action, members } = body;

    if (!committeeId || !action) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Committee ID and action are required' },
        { status: 400 }
      );
    }

    const committee = await queryOne<{ id: string; name: string }>(
      'SELECT id, name FROM evaluation_committees WHERE id = ?',
      [committeeId]
    );

    if (!committee) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Committee not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'ADD_MEMBERS':
        if (members && Array.isArray(members)) {
          for (const member of members) {
            const memberId = generateId();
            await execute(
              `INSERT INTO evaluation_committee_members (id, committee_id, user_id, role)
               VALUES (?, ?, ?, ?)`,
              [memberId, committeeId, member.user_id, member.role || 'MEMBER']
            );
          }
        }
        break;

      case 'REMOVE_MEMBER':
        if (body.memberId) {
          await execute(
            'DELETE FROM evaluation_committee_members WHERE id = ? AND committee_id = ?',
            [body.memberId, committeeId]
          );
        }
        break;

      case 'DELETE':
        await execute('DELETE FROM evaluation_committee_members WHERE committee_id = ?', [committeeId]);
        await execute('DELETE FROM evaluation_committees WHERE id = ?', [committeeId]);
        break;

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    await createAuditLog({
      userId: user.userId,
      action: `EVALUATION_COMMITTEE_${action}`,
      module: 'evaluation_committees',
      description: `${action} on committee "${committee.name}"`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Committee ${action.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Update evaluation committee error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER']);
export const POST = withAuth(handlePost, ['PROCUREMENT_OFFICER']);
export const PATCH = withAuth(handlePatch, ['PROCUREMENT_OFFICER']);
