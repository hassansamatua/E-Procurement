"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, FileText, DollarSign } from 'lucide-react';
import { DashboardStats, ProcurementRequest } from '@/types';

export default function AccountingDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [pendingAwards, setPendingAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, reqRes, bidsRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/procurement-requests?status=PENDING_FINANCE&limit=10'),
        axios.get('/api/bids?limit=100'),
      ]);
      setStats(statsRes.data.data);
      setRequests(reqRes.data.data || []);
      // Filter bids that are ready for accounting officer final approval
      setPendingAwards((bidsRes.data.data || []).filter((b: any) => b.status === 'EVALUATED'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleApproval = async (requestId: string, action: string) => {
    try {
      await axios.patch('/api/procurement-requests', { requestId, action, financial_remarks: 'Budget verified' });
      fetchData();
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleFinalAwardApproval = async (bid: any) => {
    if (!confirm(`Approve final award to ${bid.supplier_name}? This will notify the procurement officer to proceed with contract negotiation.`)) return;
    try {
      await axios.patch('/api/evaluations', { 
        tenderId: bid.tender_id, 
        bidId: bid.id,
        action: 'FINAL_APPROVE'
      });
      fetchData();
    } catch (error) {
      console.error('Final approval failed:', error);
      alert('Failed to approve award');
    }
  };

  const columns = [
    { key: 'request_number', label: 'Request #' },
    { key: 'title', label: 'Title' },
    { key: 'requester_name', label: 'Requested By' },
    { key: 'estimated_budget', label: 'Budget', render: (item: Record<string, unknown>) => item.estimated_budget ? `TZS ${Number(item.estimated_budget).toLocaleString()}` : 'N/A' },
    { key: 'priority', label: 'Priority', render: (item: Record<string, unknown>) => <Badge variant="outline">{item.priority as string}</Badge> },
  ];

  const awardColumns = [
    { key: 'bid_number', label: 'Bid #' },
    { key: 'tender_title', label: 'Tender' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'bid_amount', label: 'Amount', render: (item: Record<string, unknown>) => item.bid_amount ? `TZS ${Number(item.bid_amount).toLocaleString()}` : 'N/A' },
    { key: 'total_score', label: 'Score', render: (item: Record<string, unknown>) => item.total_score ? Number(item.total_score).toFixed(2) : 'N/A' },
    { key: 'rank', label: 'Rank' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Accounting Officer Dashboard</h1>
          <p className="text-muted-foreground">Review financial compliance for procurement requests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Pending Financial Review" value={requests.length} icon={<ClipboardCheck size={24} />} />
          <StatsCard title="Total Requests" value={stats.procurementRequests || 0} icon={<FileText size={24} />} />
          <StatsCard title="Total Contracts" value={stats.totalContracts || 0} icon={<DollarSign size={24} />} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Pending Financial Approvals</h2>
          <DataTable
            columns={columns}
            data={requests as unknown as Record<string, unknown>[]}
            actions={(item) => (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApproval(item.id as string, 'APPROVED')}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleApproval(item.id as string, 'REJECTED')}>
                  Reject
                </Button>
              </div>
            )}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Pending Final Award Approvals</h2>
          <p className="text-sm text-muted-foreground mb-4">Review evaluated bids and provide final approval for tender awards</p>
          <DataTable
            columns={awardColumns}
            data={pendingAwards as unknown as Record<string, unknown>[]}
            actions={(item) => (
              <Button size="sm" onClick={() => handleFinalAwardApproval(item)}>
                Final Approve
              </Button>
            )}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
