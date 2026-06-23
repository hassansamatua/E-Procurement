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
    const search = searchParams.get('search') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (search) {
      whereClause += ' AND (et.name LIKE ? OR et.subject LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM email_templates et WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const templates = await query(
      `SELECT et.* FROM email_templates et WHERE ${whereClause}
       ORDER BY et.name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Email templates fetched',
      data: templates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get email templates error:', error);
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
    const { name, subject, body: templateBody, variables, is_active } = body;

    if (!name || !subject || !templateBody) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Name, subject, and body are required' },
        { status: 400 }
      );
    }

    const templateId = generateId();

    await execute(
      `INSERT INTO email_templates (id, name, subject, body, variables, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        templateId, name, subject, templateBody,
        variables ? JSON.stringify(variables) : null,
        is_active !== undefined ? is_active : true,
      ]
    );

    await createAuditLog({
      userId: user.userId,
      action: 'EMAIL_TEMPLATE_CREATED',
      module: 'email_templates',
      description: `Created email template "${name}"`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Email template created', data: { id: templateId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create email template error:', error);
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
    const { templateId, name, subject, body: templateBody, variables, is_active } = body;

    if (!templateId) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Template ID is required' },
        { status: 400 }
      );
    }

    const template = await queryOne<{ id: string; name: string }>(
      'SELECT id, name FROM email_templates WHERE id = ?',
      [templateId]
    );

    if (!template) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (subject) {
      updates.push('subject = ?');
      params.push(subject);
    }
    if (templateBody) {
      updates.push('body = ?');
      params.push(templateBody);
    }
    if (variables !== undefined) {
      updates.push('variables = ?');
      params.push(JSON.stringify(variables));
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length > 0) {
      params.push(templateId);
      await execute(
        `UPDATE email_templates SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    await createAuditLog({
      userId: user.userId,
      action: 'EMAIL_TEMPLATE_UPDATED',
      module: 'email_templates',
      description: `Updated email template "${template.name}"`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Email template updated',
    });
  } catch (error) {
    console.error('Update email template error:', error);
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
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Template ID is required' },
        { status: 400 }
      );
    }

    const template = await queryOne<{ id: string; name: string }>(
      'SELECT id, name FROM email_templates WHERE id = ?',
      [templateId]
    );

    if (!template) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    await execute('DELETE FROM email_templates WHERE id = ?', [templateId]);

    await createAuditLog({
      userId: user.userId,
      action: 'EMAIL_TEMPLATE_DELETED',
      module: 'email_templates',
      description: `Deleted email template "${template.name}"`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Email template deleted',
    });
  } catch (error) {
    console.error('Delete email template error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const POST = withAuth(handlePost, ['SUPER_ADMIN']);
export const PATCH = withAuth(handlePatch, ['SUPER_ADMIN']);
export const DELETE = withAuth(handleDelete, ['SUPER_ADMIN']);
