import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/middleware/withAuth';
import { ApiResponse } from '@/types';

async function handleGet() {
  try {
    const roles = await query('SELECT * FROM roles ORDER BY name');
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Roles fetched',
      data: roles,
    });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
