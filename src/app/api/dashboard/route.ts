import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { ApiResponse, DashboardStats } from '@/types';

async function handleGet(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    let stats: DashboardStats = {};

    switch (user.role) {
      case 'SUPER_ADMIN': {
        const orgs = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM organizations');
        const suppliers = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM suppliers');
        const users = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
        const tenders = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tenders');
        const contracts = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM contracts');
        const procValue = await queryOne<{ total: number }>('SELECT COALESCE(SUM(contract_amount), 0) as total FROM contracts WHERE status = ?', ['ACTIVE']);

        stats = {
          totalOrganizations: orgs?.count || 0,
          totalSuppliers: suppliers?.count || 0,
          totalUsers: users?.count || 0,
          totalTenders: tenders?.count || 0,
          totalContracts: contracts?.count || 0,
          totalProcurementValue: procValue?.total || 0,
        };
        break;
      }

      case 'ADMIN': {
        const pending = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM suppliers WHERE status = ?', ['PENDING']);
        const approved = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM suppliers WHERE status = ?', ['APPROVED']);
        const rejected = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM suppliers WHERE status = ?', ['REJECTED']);
        const activeTenders = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tenders WHERE status = ?', ['PUBLISHED']);

        stats = {
          pendingSuppliers: pending?.count || 0,
          approvedSuppliers: approved?.count || 0,
          rejectedSuppliers: rejected?.count || 0,
          activeTenders: activeTenders?.count || 0,
        };
        break;
      }

      case 'STAFF':
      case 'HOD':
      case 'PROCUREMENT_OFFICER':
      case 'ACCOUNTING_OFFICER': {
        const requests = await queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM procurement_requests WHERE organization_id = ?',
          [user.organizationId]
        );
        const activeTenders = await queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM tenders WHERE organization_id = ? AND status = ?',
          [user.organizationId, 'PUBLISHED']
        );
        const contractsData = await queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM contracts WHERE organization_id = ?',
          [user.organizationId]
        );

        stats = {
          procurementRequests: requests?.count || 0,
          activeTenders: activeTenders?.count || 0,
          totalContracts: contractsData?.count || 0,
        };
        break;
      }

      case 'SUPPLIER': {
        const supplier = await queryOne<{ id: string; performance_score: number }>(
          'SELECT id, performance_score FROM suppliers WHERE user_id = ?',
          [user.userId]
        );

        if (supplier) {
          const available = await queryOne<{ count: number }>(
            'SELECT COUNT(*) as count FROM tenders WHERE status = ?',
            ['PUBLISHED']
          );
          const submitted = await queryOne<{ count: number }>(
            'SELECT COUNT(*) as count FROM bids WHERE supplier_id = ?',
            [supplier.id]
          );
          const won = await queryOne<{ count: number }>(
            'SELECT COUNT(*) as count FROM bids WHERE supplier_id = ? AND status = ?',
            [supplier.id, 'AWARDED']
          );

          stats = {
            availableTenders: available?.count || 0,
            submittedBids: submitted?.count || 0,
            wonContracts: won?.count || 0,
            performanceRating: supplier.performance_score,
          };
        }
        break;
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Dashboard stats fetched',
      data: stats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
