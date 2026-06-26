"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, FileText, CheckCircle } from 'lucide-react';
import { DashboardStats, ProcurementRequest } from '@/types';

export default function FinanceDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, reqRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/procurement-requests?status=PENDING_FINANCE&limit=10'),
      ]);
      setStats(statsRes.data.data);
      setRequests(reqRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleApproval = async (requestId: string, action: string) => {
    try {
      await axios.patch('/api/procurement-requests', { 
        requestId, 
        action, 
        financial_remarks: action === 'APPROVED' ? 'Budget approved' : 'Budget rejected - insufficient funds' 
      });
      fetchData();
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Failed to process approval');
    }
  };

  const columns = [
    { key: 'request_number', label: 'Request #' },
    { key: 'title', label: 'Title' },
    { key: 'requester_name', label: 'Requested By' },
    { key: 'department', label: 'Department' },
    { key: 'estimated_budget', label: 'Budget', render: (item: Record<string, unknown>) => item.estimated_budget ? `TZS ${Number(item.estimated_budget).toLocaleString()}` : 'N/A' },
    { key: 'priority', label: 'Priority', render: (item: Record<string, unknown>) => <Badge variant="outline">{item.priority as string}</Badge> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Finance Officer Dashboard</h1>
          <p className="text-muted-foreground">Review and approve budgets for procurement requests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Pending Budget Approvals" value={requests.length} icon={<DollarSign size={24} />} />
          <StatsCard title="Total Requests" value={stats.procurementRequests || 0} icon={<FileText size={24} />} />
          <StatsCard title="Total Tenders" value={stats.totalTenders || 0} icon={<CheckCircle size={24} />} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Pending Budget Approvals</h2>
          <DataTable
            columns={columns}
            data={requests as unknown as Record<string, unknown>[]}
            actions={(item) => (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApproval(item.id as string, 'APPROVED')}>
                  Approve Budget
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleApproval(item.id as string, 'REJECTED')}>
                  Reject
                </Button>
              </div>
            )}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
