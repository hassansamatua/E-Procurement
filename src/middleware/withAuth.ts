import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractToken } from '@/lib/auth';
import { UserRole, ApiResponse, JWTPayload } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function withAuth(
  handler: (req: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>,
  allowedRoles?: UserRole[]
) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const authHeader = req.headers.get('authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Attach user to headers for downstream use
    const headers = new Headers(req.headers);
    headers.set('x-user-id', payload.userId);
    headers.set('x-user-email', payload.email);
    headers.set('x-user-role', payload.role);
    if (payload.organizationId) {
      headers.set('x-organization-id', payload.organizationId);
    }

    const newReq = new NextRequest(req.url, {
      method: req.method,
      headers,
      body: req.body,
    });

    return handler(newReq, context);
  };
}

export function getUserFromRequest(req: NextRequest): JWTPayload {
  return {
    userId: req.headers.get('x-user-id') || '',
    email: req.headers.get('x-user-email') || '',
    role: (req.headers.get('x-user-role') || 'STAFF') as UserRole,
    organizationId: req.headers.get('x-organization-id') || undefined,
  };
}
