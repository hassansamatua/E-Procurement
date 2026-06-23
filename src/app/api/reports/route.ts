import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { ApiResponse } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'summary';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';
    const format = searchParams.get('format') || 'json';

    let reportData: unknown;

    switch (reportType) {
      case 'suppliers': {
        reportData = await query(
          `SELECT s.company_name, s.email, s.phone, s.status, s.categories, 
                  s.performance_score, s.created_at, s.approved_at
           FROM suppliers s 
           ORDER BY s.created_at DESC`
        );
        break;
      }

      case 'tenders': {
        let tenderWhere = '1=1';
        const tenderParams: unknown[] = [];
        if (dateFrom) { tenderWhere += ' AND t.created_at >= ?'; tenderParams.push(dateFrom); }
        if (dateTo) { tenderWhere += ' AND t.created_at <= ?'; tenderParams.push(dateTo); }

        reportData = await query(
          `SELECT t.tender_number, t.title, t.status, t.procurement_method, t.budget_estimate,
                  t.submission_deadline, t.opening_date, t.closing_date, o.name as organization,
                  (SELECT COUNT(*) FROM bids WHERE tender_id = t.id) as bid_count
           FROM tenders t
           JOIN organizations o ON t.organization_id = o.id
           WHERE ${tenderWhere}
           ORDER BY t.created_at DESC`,
          tenderParams
        );
        break;
      }

      case 'procurement': {
        let procWhere = '1=1';
        const procParams: unknown[] = [];
        if (user.organizationId && user.role !== 'SUPER_ADMIN') {
          procWhere += ' AND pr.organization_id = ?';
          procParams.push(user.organizationId);
        }

        reportData = await query(
          `SELECT pr.request_number, pr.title, pr.status, pr.priority, pr.estimated_budget,
                  pr.currency, pr.created_at, CONCAT(u.first_name, ' ', u.last_name) as requester,
                  o.name as organization
           FROM procurement_requests pr
           JOIN users u ON pr.requested_by = u.id
           JOIN organizations o ON pr.organization_id = o.id
           WHERE ${procWhere}
           ORDER BY pr.created_at DESC`,
          procParams
        );
        break;
      }

      case 'contracts': {
        reportData = await query(
          `SELECT c.contract_number, c.title, c.status, c.contract_amount, c.currency,
                  c.start_date, c.end_date, s.company_name as supplier, o.name as organization
           FROM contracts c
           JOIN suppliers s ON c.supplier_id = s.id
           JOIN organizations o ON c.organization_id = o.id
           ORDER BY c.created_at DESC`
        );
        break;
      }

      case 'evaluations': {
        reportData = await query(
          `SELECT b.bid_number, s.company_name, t.tender_number, t.title as tender_title,
                  b.technical_score, b.financial_score, b.experience_score, b.compliance_score,
                  b.total_score, b.rank, b.status
           FROM bids b
           JOIN suppliers s ON b.supplier_id = s.id
           JOIN tenders t ON b.tender_id = t.id
           WHERE b.status = 'EVALUATED' OR b.status = 'AWARDED'
           ORDER BY b.total_score DESC`
        );
        break;
      }

      case 'performance': {
        reportData = await query(
          `SELECT s.company_name, s.performance_score,
                  AVG(sr.quality_score) as avg_quality,
                  AVG(sr.delivery_score) as avg_delivery,
                  AVG(sr.compliance_score) as avg_compliance,
                  AVG(sr.communication_score) as avg_communication,
                  COUNT(sr.id) as total_ratings
           FROM suppliers s
           LEFT JOIN supplier_ratings sr ON s.id = sr.supplier_id
           WHERE s.status = 'APPROVED'
           GROUP BY s.id, s.company_name, s.performance_score
           ORDER BY s.performance_score DESC`
        );
        break;
      }

      case 'audit': {
        let auditWhere = '1=1';
        const auditParams: unknown[] = [];
        if (dateFrom) { auditWhere += ' AND al.created_at >= ?'; auditParams.push(dateFrom); }
        if (dateTo) { auditWhere += ' AND al.created_at <= ?'; auditParams.push(dateTo); }

        reportData = await query(
          `SELECT al.action, al.module, al.description, al.ip_address, al.created_at,
                  CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email
           FROM audit_logs al
           LEFT JOIN users u ON al.user_id = u.id
           WHERE ${auditWhere}
           ORDER BY al.created_at DESC
           LIMIT 1000`,
          auditParams
        );
        break;
      }

      default:
        reportData = { message: 'Invalid report type' };
    }

    // For JSON format, return directly
    if (format === 'json') {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: `${reportType} report generated`,
        data: reportData,
      });
    }

    // For PDF/Excel, return the data with format indicator
    return NextResponse.json<ApiResponse>({
      success: true,
      message: `${reportType} report data ready for ${format} generation`,
      data: { reportType, format, records: reportData },
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, ['SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'ACCOUNTING_OFFICER']);
