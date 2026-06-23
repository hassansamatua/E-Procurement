import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { ApiResponse, UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Verify token matches stored token
    const user = await queryOne<{ id: string; refresh_token: string; is_active: boolean }>(
      'SELECT id, refresh_token, is_active FROM users WHERE id = ?',
      [payload.userId]
    );

    if (!user || user.refresh_token !== refreshToken || !user.is_active) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    const newPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
      organizationId: payload.organizationId,
    };

    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    // Update stored refresh token
    await execute(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [newRefreshToken, payload.userId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
