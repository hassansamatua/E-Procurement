import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { createAuditLog } from '@/lib/audit';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const settings = await query(
      `SELECT setting_key, setting_value, description, updated_at FROM system_settings ORDER BY setting_key`
    );

    const settingsMap: Record<string, string> = {};
    (settings as any[]).forEach((setting) => {
      settingsMap[setting.setting_key] = setting.setting_value;
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'System settings fetched',
      data: { settings, settingsMap },
    });
  } catch (error) {
    console.error('Get system settings error:', error);
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
    const { setting_key, setting_value, description } = body;

    if (!setting_key || !setting_value) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Setting key and value are required' },
        { status: 400 }
      );
    }

    // Check if setting exists
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM system_settings WHERE setting_key = ?',
      [setting_key]
    );

    if (existing) {
      // Update existing
      await execute(
        'UPDATE system_settings SET setting_value = ?, description = ?, updated_at = NOW() WHERE setting_key = ?',
        [setting_value, description || null, setting_key]
      );
    } else {
      // Create new
      await execute(
        'INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
        [setting_key, setting_value, description || null]
      );
    }

    await createAuditLog({
      userId: user.userId,
      action: 'SYSTEM_SETTING_UPDATED',
      module: 'system_settings',
      description: `Updated system setting "${setting_key}"`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'System setting saved',
    });
  } catch (error) {
    console.error('Save system setting error:', error);
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
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Settings array is required' },
        { status: 400 }
      );
    }

    // Bulk update settings
    for (const setting of settings) {
      const { setting_key, setting_value } = setting;
      if (setting_key && setting_value !== undefined) {
        await execute(
          'UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
          [setting_value, setting_key]
        );
      }
    }

    await createAuditLog({
      userId: user.userId,
      action: 'SYSTEM_SETTINGS_BULK_UPDATED',
      module: 'system_settings',
      description: 'Bulk updated system settings',
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'System settings updated',
    });
  } catch (error) {
    console.error('Bulk update system settings error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['SUPER_ADMIN', 'ADMIN']);
export const POST = withAuth(handlePost, ['SUPER_ADMIN']);
export const PATCH = withAuth(handlePatch, ['SUPER_ADMIN']);
