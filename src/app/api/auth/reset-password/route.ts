import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    const user = await queryOne<{ id: string; email: string; password_reset_expires: string }>(
      'SELECT id, email, password_reset_expires FROM users WHERE password_reset_token = ?',
      [token]
    );

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    if (new Date(user.password_reset_expires) < new Date()) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Reset token has expired' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await execute(
      'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    await createAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET',
      module: 'auth',
      description: `Password reset for ${user.email}`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
