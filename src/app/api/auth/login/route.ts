import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { comparePassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { ApiResponse, UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const user = await queryOne<{
      id: string;
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      role_id: string;
      organization_id: string;
      is_active: boolean;
      is_suspended: boolean;
    }>(
      `SELECT u.id, u.email, u.password, u.first_name, u.last_name, u.role_id, 
              u.organization_id, u.is_active, u.is_suspended, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Account is deactivated. Contact administrator.' },
        { status: 403 }
      );
    }

    if (user.is_suspended) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Account is suspended. Contact administrator.' },
        { status: 403 }
      );
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get role name
    const roleData = await queryOne<{ name: string }>('SELECT name FROM roles WHERE id = ?', [user.role_id]);
    const roleName = (roleData?.name || 'STAFF') as UserRole;

    // Check if supplier and not approved
    if (roleName === 'SUPPLIER') {
      const supplier = await queryOne<{ status: string }>(
        'SELECT status FROM suppliers WHERE user_id = ?',
        [user.id]
      );
      if (supplier && supplier.status !== 'APPROVED') {
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Your supplier account is pending approval.' },
          { status: 403 }
        );
      }
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: roleName,
      organizationId: user.organization_id || undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Update refresh token and last login
    await execute(
      'UPDATE users SET refresh_token = ?, last_login = NOW() WHERE id = ?',
      [refreshToken, user.id]
    );

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      module: 'auth',
      description: `User ${user.email} logged in`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: roleName,
          organization_id: user.organization_id,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
