import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateId, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const status = searchParams.get('status') || '';
    const contract_id = searchParams.get('contract_id') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    if (contract_id) {
      whereClause += ' AND p.contract_id = ?';
      params.push(contract_id);
    }

    // Finance officers can see all payments
    // Suppliers can only see their own payments
    if (user.role === 'SUPPLIER') {
      const supplier = await queryOne<{ id: string }>('SELECT id FROM suppliers WHERE user_id = ?', [user.userId]);
      if (supplier) {
        whereClause += ' AND p.supplier_id = ?';
        params.push(supplier.id);
      }
    }

    const [countResult] = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM payments p WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }).total;

    const payments = await query(
      `SELECT p.*, s.company_name as supplier_name, c.title as contract_title, t.title as tender_title,
              u.first_name || ' ' || u.last_name as processed_by_name
       FROM payments p
       JOIN suppliers s ON p.supplier_id = s.id
       JOIN contracts c ON p.contract_id = c.id
       JOIN tenders t ON c.tender_id = t.id
       LEFT JOIN users u ON p.processed_by = u.id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Payments fetched successfully',
      data: payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get payments error:', error);
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

    const { contract_id, bid_id, amount, currency = 'TZS', payment_method = 'BANK_TRANSFER', notes } = body;

    if (!contract_id || !bid_id || !amount) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Contract ID, bid ID, and amount are required' },
        { status: 400 }
      );
    }

    // Get contract and bid details
    const contract = await queryOne<{ id: string; supplier_id: string; tender_id: string }>(
      'SELECT id, supplier_id, tender_id FROM contracts WHERE id = ?',
      [contract_id]
    );

    if (!contract) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Contract not found' },
        { status: 404 }
      );
    }

    const bid = await queryOne<{ id: string; supplier_id: string; bid_amount: number }>(
      'SELECT id, supplier_id, bid_amount FROM bids WHERE id = ?',
      [bid_id]
    );

    if (!bid) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Bid not found' },
        { status: 404 }
      );
    }

    // Verify bid belongs to contract supplier
    if (bid.supplier_id !== contract.supplier_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Bid does not belong to contract supplier' },
        { status: 400 }
      );
    }

    const paymentId = generateId();
    const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment record (test mode)
    await execute(
      `INSERT INTO payments (id, contract_id, bid_id, supplier_id, amount, currency, payment_method, payment_reference, status, processed_by, notes, is_test_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PROCESSING', ?, ?, TRUE)`,
      [paymentId, contract_id, bid_id, contract.supplier_id, amount, currency, payment_method, paymentReference, user.userId, notes || null]
    );

    console.log('Payment created (test mode):', { paymentId, paymentReference, amount, currency });

    // Simulate payment processing (2 second delay)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update payment to COMPLETED (test mode simulation)
    await execute(
      `UPDATE payments SET status = 'COMPLETED', payment_date = CURRENT_TIMESTAMP WHERE id = ?`,
      [paymentId]
    );

    // Get supplier user_id for notification
    const supplier = await queryOne<{ user_id: string; company_name: string }>(
      'SELECT user_id, company_name FROM suppliers WHERE id = ?',
      [contract.supplier_id]
    );

    if (supplier && supplier.user_id) {
      await createNotification({
        userId: supplier.user_id,
        title: 'Payment Received',
        message: `Payment of ${currency} ${Number(amount).toLocaleString()} has been processed for your contract. Reference: ${paymentReference}. (Test Mode - No actual payment made)`,
        type: 'SUCCESS',
        category: 'payment_received',
        referenceId: paymentId,
        referenceType: 'payment',
      });
    }

    await createAuditLog({
      userId: user.userId,
      action: 'PAYMENT_PROCESSED',
      module: 'payments',
      description: `Processed payment ${paymentReference} for contract ${contract_id}`,
      newValues: { paymentId, amount, currency, paymentReference, is_test_mode: true },
    });

    return NextResponse.json<ApiResponse>(
      { 
        success: true, 
        message: 'Payment processed successfully (Test Mode)', 
        data: { 
          id: paymentId, 
          payment_reference: paymentReference, 
          status: 'COMPLETED',
          is_test_mode: true 
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['FINANCE_OFFICER', 'SUPPLIER']);
export const POST = withAuth(handlePost, ['FINANCE_OFFICER']);
