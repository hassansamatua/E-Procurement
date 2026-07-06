"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';

export default function SupplierContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await axios.get('/api/contracts?limit=100');
      const data = response.data.data;
      setContracts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      setContracts([]);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      DRAFT: 'default',
      PENDING: 'warning',
      ACTIVE: 'success',
      COMPLETED: 'success',
      TERMINATED: 'destructive',
      CANCELLED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'contract_number', label: 'Contract No.', render: (item: Record<string, unknown>) => (item.contract_number as string) || 'N/A' },
    { key: 'title', label: 'Title' },
    { key: 'tender_title', label: 'Tender', render: (item: Record<string, unknown>) => (item.tender_title as string) || 'N/A' },
    { key: 'contract_amount', label: 'Amount', render: (item: Record<string, unknown>) => item.contract_amount ? `TZS ${(item.contract_amount as number).toLocaleString()}` : 'N/A' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
    { key: 'start_date', label: 'Start Date', render: (item: Record<string, unknown>) => item.start_date ? new Date(item.start_date as string).toLocaleDateString() : 'N/A' },
    { key: 'end_date', label: 'End Date', render: (item: Record<string, unknown>) => item.end_date ? new Date(item.end_date as string).toLocaleDateString() : 'N/A' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Contracts</h1>
          <p className="text-muted-foreground">View your awarded contracts</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable columns={columns} data={contracts} />
        )}
      </div>
    </DashboardLayout>
  );
}
