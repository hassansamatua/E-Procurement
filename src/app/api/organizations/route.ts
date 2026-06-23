import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { organizationSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { generateId, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const search = searchParams.get('search') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR code LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM organizations WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const organizations = await query(
      `SELECT * FROM organizations WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Organizations fetched',
      data: organizations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get organizations error:', error);
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
    const validation = organizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const data = validation.data;
    const orgId = generateId();

    await execute(
      `INSERT INTO organizations (id, name, code, email, phone, address, city, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orgId, data.name, data.code || null, data.email || null, data.phone || null, data.address || null, data.city || null, data.country || null]
    );

    await createAuditLog({
      userId: user.userId,
      action: 'ORGANIZATION_CREATED',
      module: 'organizations',
      description: `Created organization ${data.name}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Organization created', data: { id: orgId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create organization error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['SUPER_ADMIN', 'ADMIN']);
export const POST = withAuth(handlePost, ['SUPER_ADMIN']);
