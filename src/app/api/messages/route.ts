import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { createAuditLog } from '@/lib/audit';
import { generateId, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const folder = searchParams.get('folder') || 'inbox';
    const search = searchParams.get('search') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (folder === 'inbox') {
      whereClause += ' AND m.receiver_id = ?';
      params.push(user.userId);
    } else if (folder === 'sent') {
      whereClause += ' AND m.sender_id = ?';
      params.push(user.userId);
    }

    if (search) {
      whereClause += ' AND (m.subject LIKE ? OR m.body LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM messages m WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const messages = await query(
      `SELECT m.*, 
              CONCAT(s.first_name, ' ', s.last_name) as sender_name, s.email as sender_email,
              CONCAT(r.first_name, ' ', r.last_name) as receiver_name, r.email as receiver_email
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Messages fetched',
      data: messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get messages error:', error);
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
    const { receiver_id, subject, body: messageBody, parent_id } = body;

    if (!receiver_id || !subject || !messageBody) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Receiver, subject, and body are required' },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const receiver = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE id = ?',
      [receiver_id]
    );

    if (!receiver) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Receiver not found' },
        { status: 404 }
      );
    }

    const messageId = generateId();

    await execute(
      `INSERT INTO messages (id, sender_id, receiver_id, subject, body, parent_id, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [messageId, user.userId, receiver_id, subject, messageBody, parent_id || null, false]
    );

    await createAuditLog({
      userId: user.userId,
      action: 'MESSAGE_SENT',
      module: 'messages',
      description: `Sent message to user ${receiver_id}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Message sent', data: { id: messageId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send message error:', error);
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
    const { messageId, action } = body;

    if (!messageId || !action) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Message ID and action are required' },
        { status: 400 }
      );
    }

    const message = await queryOne<{ id: string; receiver_id: string }>(
      'SELECT id, receiver_id FROM messages WHERE id = ?',
      [messageId]
    );

    if (!message) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Message not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'MARK_READ':
        if (message.receiver_id !== user.userId) {
          return NextResponse.json<ApiResponse>(
            { success: false, message: 'You can only mark your own messages as read' },
            { status: 403 }
          );
        }
        await execute('UPDATE messages SET is_read = ? WHERE id = ?', [true, messageId]);
        break;

      case 'MARK_UNREAD':
        if (message.receiver_id !== user.userId) {
          return NextResponse.json<ApiResponse>(
            { success: false, message: 'You can only mark your own messages as unread' },
            { status: 403 }
          );
        }
        await execute('UPDATE messages SET is_read = ? WHERE id = ?', [false, messageId]);
        break;

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Message ${action.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
export const PATCH = withAuth(handlePatch);
