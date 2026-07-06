import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { supplierRegistrationSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateId } from '@/lib/utils';
import { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = supplierRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if email already exists
    const existingUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = ?',
      [data.email]
    );

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    const existingSupplier = await queryOne<{ id: string }>(
      'SELECT id FROM suppliers WHERE email = ?',
      [data.email]
    );

    if (existingSupplier) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Supplier with this email already exists' },
        { status: 409 }
      );
    }

    // Get supplier role
    const supplierRole = await queryOne<{ id: string }>(
      'SELECT id FROM roles WHERE name = ?',
      ['SUPPLIER']
    );

    if (!supplierRole) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'System configuration error' },
        { status: 500 }
      );
    }

    const hashedPassword = await hashPassword(data.password);
    const userId = generateId();
    const supplierId = generateId();

    // Create user account
    await execute(
      `INSERT INTO users (id, email, password, first_name, last_name, phone, role_id, is_active, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.email, hashedPassword, data.contact_person.split(' ')[0], data.contact_person.split(' ').slice(1).join(' ') || data.contact_person, data.phone, supplierRole.id, false, false]
    );

    // Create supplier profile
    await execute(
      `INSERT INTO suppliers (id, user_id, company_name, registration_number, tin_number, vat_number, 
       business_license_number, contact_person, phone, email, physical_address, postal_address, 
       country, region, district, bank_name, account_number, account_name, categories, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        supplierId, userId, data.company_name, data.registration_number || null,
        data.tin_number || null, data.vat_number || null, data.business_license_number || null,
        data.contact_person, data.phone, data.email, data.physical_address || null,
        data.postal_address || null, data.country || null, data.region || null,
        data.district || null, data.bank_name || null, data.account_number || null,
        data.account_name || null, JSON.stringify(data.categories),
      ]
    );

    // Notify admins about new supplier registration
    const admins = await queryOne<{ id: string }>(
      `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'ADMIN' AND u.is_active = TRUE LIMIT 1`
    );

    if (admins) {
      await createNotification({
        userId: admins.id,
        title: 'New Supplier Registration',
        message: `${data.company_name} has registered as a supplier and is pending approval.`,
        type: 'INFO',
        category: 'supplier_registration',
        referenceId: supplierId,
        referenceType: 'supplier',
      });
    }

    // Audit log
    await createAuditLog({
      userId,
      action: 'SUPPLIER_REGISTRATION',
      module: 'suppliers',
      description: `Supplier ${data.company_name} registered`,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Registration successful. Your account is pending admin approval.',
        data: { supplierId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
