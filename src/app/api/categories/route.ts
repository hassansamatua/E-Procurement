import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { generateId } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'procurement';

    let categories;
    if (type === 'tender') {
      categories = await query('SELECT * FROM tender_categories WHERE is_active = TRUE ORDER BY name');
    } else {
      categories = await query('SELECT * FROM procurement_categories WHERE is_active = TRUE ORDER BY name');
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Categories fetched',
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, type, parent_id } = body;

    if (!name) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    const id = generateId();

    if (type === 'tender') {
      await execute(
        'INSERT INTO tender_categories (id, name, description, is_active) VALUES (?, ?, ?, TRUE)',
        [id, name, description || null]
      );
    } else {
      await execute(
        'INSERT INTO procurement_categories (id, name, description, parent_id, is_active) VALUES (?, ?, ?, ?, TRUE)',
        [id, name, description || null, parent_id || null]
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Category created', data: { id } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost, ['SUPER_ADMIN', 'ADMIN']);
