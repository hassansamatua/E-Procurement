import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { bidSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateId, generateBidNumber, getPaginationParams } from '@/lib/utils';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const tenderId = searchParams.get('tender_id') || '';
    const status = searchParams.get('status') || '';

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (tenderId) {
      whereClause += ' AND b.tender_id = ?';
      params.push(tenderId);
    }

    if (status) {
      whereClause += ' AND b.status = ?';
      params.push(status);
    }

    // Suppliers can only see their own bids
    if (user.role === 'SUPPLIER') {
      const supplier = await queryOne<{ id: string }>('SELECT id FROM suppliers WHERE user_id = ?', [user.userId]);
      console.log('Get bids - User ID:', user.userId, 'Supplier:', supplier);
      if (supplier) {
        whereClause += ' AND b.supplier_id = ?';
        params.push(supplier.id);
      }
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM bids b WHERE ${whereClause}`,
      params
    );
    const total = (countResult as unknown as { total: number }[])[0].total;

    const bids = await query(
      `SELECT b.*, s.company_name as supplier_name, t.title as tender_title, t.tender_number,
              STRING_AGG(DISTINCT bd.file_path, ',') as document_urls
       FROM bids b
       JOIN suppliers s ON b.supplier_id = s.id
       JOIN tenders t ON b.tender_id = t.id
       LEFT JOIN bid_documents bd ON b.id = bd.bid_id
       WHERE ${whereClause}
       GROUP BY b.id, s.company_name, t.title, t.tender_number
       ORDER BY b.total_score DESC, b.submitted_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Bids fetched',
      data: bids,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get bids error:', error);
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
    const validation = bidSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Validation failed', errors: validation.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get supplier ID
    const supplier = await queryOne<{ id: string }>(
      'SELECT id FROM suppliers WHERE user_id = ? AND status = ?',
      [user.userId, 'APPROVED']
    );

    console.log('Submit bid - User ID:', user.userId, 'Supplier:', supplier);

    if (!supplier) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Supplier profile not found or not approved' },
        { status: 403 }
      );
    }

    // Check tender is published and deadline not passed
    const tender = await queryOne<{ id: string; status: string; submission_deadline: string }>(
      'SELECT id, status, submission_deadline FROM tenders WHERE id = ?',
      [data.tender_id]
    );

    if (!tender || tender.status !== 'PUBLISHED') {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Tender is not available for bidding' },
        { status: 400 }
      );
    }

    if (new Date(tender.submission_deadline) < new Date()) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Submission deadline has passed. Late submissions are not accepted.' },
        { status: 400 }
      );
    }

    // Check if already submitted
    const existingBid = await queryOne<{ id: string }>(
      'SELECT id FROM bids WHERE tender_id = ? AND supplier_id = ?',
      [data.tender_id, supplier.id]
    );

    console.log('Submit bid - Existing bid check:', { tender_id: data.tender_id, supplier_id: supplier.id, existingBid });

    if (existingBid) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'You have already submitted a bid for this tender' },
        { status: 409 }
      );
    }

    const bidId = generateId();
    const bidNumber = generateBidNumber();

    await execute(
      `INSERT INTO bids (id, bid_number, tender_id, supplier_id, bid_amount, currency, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)`,
      [bidId, bidNumber, data.tender_id, supplier.id, data.bid_amount, data.currency, data.notes || null]
    );

    // Save bid document if provided
    if (data.document_url) {
      await execute(
        `INSERT INTO bid_documents (id, bid_id, document_type, document_name, file_path, file_size, mime_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(),
          bidId,
          'TECHNICAL_PROPOSAL',
          'Filled Tender Document',
          data.document_url,
          0, // File size not available from Cloudinary
          'application/pdf',
        ]
      );
    }

    await createAuditLog({
      userId: user.userId,
      action: 'BID_SUBMITTED',
      module: 'bids',
      description: `Submitted bid ${bidNumber} for tender ${data.tender_id}`,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Bid submitted successfully', data: { id: bidId, bid_number: bidNumber } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit bid error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost, ['SUPPLIER']);
