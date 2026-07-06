import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { createUserSchema, updateUserSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { generateId, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (search) {
      whereClause += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND r.name = ?';
      params.push(role);
    }

    if (status === 'active') {
      whereClause += ' AND u.is_active = TRUE AND u.is_suspended = FALSE';
    } else if (status === 'suspended') {
      whereClause += ' AND u.is_suspended = TRUE';
    } else if (status === 'inactive') {
      whereClause += ' AND u.is_active = FALSE';
    }

    // Non-super admins can only see users from their organization
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.organizationId) {
      whereClause += ' AND u.organization_id = ?';
      params.push(user.organizationId);
    }

    const [countResult] = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM users u JOIN roles r ON u.role_id = r.id WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }).total;

    const users = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar, u.department,
              u.is_active, u.is_suspended, u.email_verified, u.last_login, u.created_at,
              u.role_id, u.organization_id,
              r.name as role_name, o.name as organization_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Users fetched successfully',
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get users error:', error);
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
    console.log('Create user request body:', body);
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      console.log('Validation failed:', validation.error.flatten().fieldErrors);
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const data = validation.data;
    const hashedPassword = await hashPassword(data.password);
    const userId = generateId();

    await execute(
      `INSERT INTO users (id, email, password, first_name, last_name, phone, role_id, organization_id, department, is_active, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE)`,
      [userId, data.email, hashedPassword, data.first_name, data.last_name, data.phone || null, data.role_id, data.organization_id || null, data.department || null]
    );

    await createAuditLog({
      userId: user.userId,
      action: 'USER_CREATED',
      module: 'users',
      description: `Created user ${data.email}`,
      newValues: { email: data.email, role_id: data.role_id },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'User created successfully', data: { id: userId } },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Email already exists' },
        { status: 409 }
      );
    }
    console.error('Create user error:', error);
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const validation = updateUserSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const data = validation.data;

    if (id === user.userId && data.role_id !== undefined) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.first_name !== undefined) { fields.push('first_name = ?'); values.push(data.first_name); }
    if (data.last_name !== undefined) { fields.push('last_name = ?'); values.push(data.last_name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.department !== undefined) { fields.push('department = ?'); values.push(data.department); }
    if (data.role_id !== undefined) { fields.push('role_id = ?'); values.push(data.role_id); }
    if (data.organization_id !== undefined) { fields.push('organization_id = ?'); values.push(data.organization_id); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }
    if (data.is_suspended !== undefined) { fields.push('is_suspended = ?'); values.push(data.is_suspended); }

    if (fields.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);
    await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    await createAuditLog({
      userId: user.userId,
      action: 'USER_UPDATED',
      module: 'users',
      description: `Updated user ${id}`,
      newValues: data,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'User updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDelete(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (id === user.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await execute('DELETE FROM users WHERE id = ?', [id]);

    await createAuditLog({
      userId: user.userId,
      action: 'USER_DELETED',
      module: 'users',
      description: `Deleted user ${id}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['SUPER_ADMIN', 'ADMIN', 'HOD', 'PROCUREMENT_OFFICER']);
export const POST = withAuth(handlePost, ['SUPER_ADMIN', 'ADMIN']);
export const PATCH = withAuth(handlePatch, ['SUPER_ADMIN', 'ADMIN']);
export const DELETE = withAuth(handleDelete, ['SUPER_ADMIN', 'ADMIN']);
