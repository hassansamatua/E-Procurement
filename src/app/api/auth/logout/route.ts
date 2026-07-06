import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { verifyAccessToken, extractToken } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractToken(authHeader);

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        await execute('UPDATE users SET refresh_token = NULL WHERE id = ?', [payload.userId]);

        await createAuditLog({
          userId: payload.userId,
          action: 'LOGOUT',
          module: 'auth',
          description: `User ${payload.email} logged out`,
        });
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
