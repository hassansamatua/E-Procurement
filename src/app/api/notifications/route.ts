import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { markAsRead, markAllAsRead, createNotification } from '@/lib/notifications';
import { getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const unreadOnly = searchParams.get('unread') === 'true';

    let whereClause = 'user_id = ?';
    const params: unknown[] = [user.userId];

    if (unreadOnly) {
      whereClause += ' AND is_read = FALSE';
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const notifications = await query(
      `SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get unread count
    const unreadResult = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [user.userId]
    );
    const unreadCount = (unreadResult as unknown as { count: number }[])[0].count;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Notifications fetched',
      data: { notifications, unreadCount },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
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
    const { notificationId, markAll } = body;

    if (markAll) {
      await markAllAsRead(user.userId);
    } else if (notificationId) {
      await markAsRead(notificationId, user.userId);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Notifications updated',
    });
  } catch (error) {
    console.error('Update notifications error:', error);
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
    const { title, message, type, category } = body;

    if (!title || !message) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Title and message are required' },
        { status: 400 }
      );
    }

    await createNotification({
      userId: user.userId,
      title,
      message,
      type: type || 'INFO',
      category: category || 'test',
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Test notification created',
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
export const POST = withAuth(handlePost);
