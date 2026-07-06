import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { contractSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateId, generateContractNumber, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (search) {
      whereClause += ' AND (c.title LIKE ? OR c.contract_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    // Suppliers can only see their own contracts
    if (user.role === 'SUPPLIER') {
      const supplier = await queryOne<{ id: string }>('SELECT id FROM suppliers WHERE user_id = ?', [user.userId]);
      if (supplier) {
        whereClause += ' AND c.supplier_id = ?';
        params.push(supplier.id);
      }
    } else if (user.organizationId && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      whereClause += ' AND c.organization_id = ?';
      params.push(user.organizationId);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM contracts c WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const contracts = await query(
      `SELECT c.*, s.company_name as supplier_name, t.title as tender_title,
              o.name as organization_name
       FROM contracts c
       JOIN suppliers s ON c.supplier_id = s.id
       JOIN tenders t ON c.tender_id = t.id
       JOIN organizations o ON c.organization_id = o.id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Contracts fetched',
      data: contracts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get contracts error:', error);
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
    const validation = contractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const data = validation.data;
    const contractId = generateId();
    const contractNumber = generateContractNumber();

    await execute(
      `INSERT INTO contracts (id, contract_number, tender_id, supplier_id, bid_id, title, description,
       contract_amount, currency, start_date, end_date, signing_date, status, terms_and_conditions,
       organization_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)`,
      [
        contractId, contractNumber, data.tender_id, data.supplier_id, data.bid_id || null,
        data.title, data.description || null, data.contract_amount, data.currency,
        data.start_date, data.end_date, data.signing_date || null,
        data.terms_and_conditions || null, user.organizationId, user.userId,
      ]
    );

    // Notify supplier about contract
    const supplier = await queryOne<{ user_id: string; email: string; contact_person: string }>(
      'SELECT user_id, email, contact_person FROM suppliers WHERE id = ?',
      [data.supplier_id]
    );

    if (supplier && supplier.user_id) {
      await createNotification({
        userId: supplier.user_id,
        title: 'Contract Created',
        message: `A contract "${data.title}" (${contractNumber}) has been created.${data.signing_date ? ` Signing scheduled for ${data.signing_date}.` : ''}`,
        type: 'INFO',
        category: 'contract_created',
        referenceId: contractId,
        referenceType: 'contract',
        sendEmail: true,
        emailTo: supplier.email,
        emailTemplate: 'contract_signing',
        emailVariables: {
          contact_person: supplier.contact_person,
          contract_title: data.title,
          signing_date: data.signing_date || 'TBD',
        },
      });
    }

    await createAuditLog({
      userId: user.userId,
      action: 'CONTRACT_CREATED',
      module: 'contracts',
      description: `Created contract ${contractNumber}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Contract created', data: { id: contractId, contract_number: contractNumber } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create contract error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update contract status
async function handlePatch(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { contractId, status, completion_date } = body;

    if (!contractId || !status) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Contract ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['DRAFT', 'ACTIVE', 'COMPLETED', 'TERMINATED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      );
    }

    let updateSql = 'UPDATE contracts SET status = ?';
    const updateParams: unknown[] = [status];

    if (completion_date) {
      updateSql += ', completion_date = ?';
      updateParams.push(completion_date);
    }

    updateSql += ' WHERE id = ?';
    updateParams.push(contractId);

    await execute(updateSql, updateParams);

    await createAuditLog({
      userId: user.userId,
      action: 'CONTRACT_STATUS_CHANGED',
      module: 'contracts',
      description: `Contract ${contractId} status changed to ${status}`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Contract updated successfully',
    });
  } catch (error) {
    console.error('Update contract error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost, ['PROCUREMENT_OFFICER']);
export const PATCH = withAuth(handlePatch, ['PROCUREMENT_OFFICER']);
