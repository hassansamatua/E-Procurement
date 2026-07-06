"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';

export default function SupplierBidsPage() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const response = await axios.get('/api/bids?limit=100');
      const data = response.data.data;
      setBids(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
      setBids([]);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      DRAFT: 'default',
      SUBMITTED: 'info',
      UNDER_REVIEW: 'warning',
      ACCEPTED: 'success',
      REJECTED: 'destructive',
      AWARDED: 'success',
      CANCELLED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'bid_number', label: 'Bid No.' },
    { key: 'tender_title', label: 'Tender', render: (item: Record<string, unknown>) => (item.tender_title as string) || 'N/A' },
    { key: 'tender_number', label: 'Tender No.', render: (item: Record<string, unknown>) => (item.tender_number as string) || 'N/A' },
    { key: 'bid_amount', label: 'Amount', render: (item: Record<string, unknown>) => item.bid_amount ? `TZS ${(item.bid_amount as number).toLocaleString()}` : 'N/A' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
    { key: 'submitted_at', label: 'Submitted', render: (item: Record<string, unknown>) => item.submitted_at ? new Date(item.submitted_at as string).toLocaleDateString() : 'N/A' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Bids</h1>
          <p className="text-muted-foreground">Track your submitted bids</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable columns={columns} data={bids} />
        )}
      </div>
    </DashboardLayout>
  );
}
