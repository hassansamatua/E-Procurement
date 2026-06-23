"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { FileText, Gavel, FileSignature } from 'lucide-react';
import { DashboardStats, ProcurementRequest } from '@/types';

export default function StaffDashboard() {
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
        axios.get('/api/procurement-requests?limit=5'),
      ]);
      setStats(statsRes.data.data);
      setRequests(reqRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      DRAFT: 'default',
      PENDING_HOD: 'warning',
      HOD_APPROVED: 'info',
      APPROVED: 'success',
      HOD_REJECTED: 'destructive',
      FINANCE_REJECTED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'request_number', label: 'Request #' },
    { key: 'title', label: 'Title' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
    { key: 'created_at', label: 'Date', render: (item: Record<string, unknown>) => new Date(item.created_at as string).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground">Manage your procurement requests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="My Requests" value={stats.procurementRequests || 0} icon={<FileText size={24} />} />
          <StatsCard title="Active Tenders" value={stats.activeTenders || 0} icon={<Gavel size={24} />} />
          <StatsCard title="Contracts" value={stats.totalContracts || 0} icon={<FileSignature size={24} />} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Requests</h2>
          <DataTable columns={columns} data={requests as unknown as Record<string, unknown>[]} />
        </div>
      </div>
    </DashboardLayout>
  );
}
