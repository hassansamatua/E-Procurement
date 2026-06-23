"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText } from 'lucide-react';

export default function BidsManagement() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const response = await axios.get('/api/bids?limit=100');
      setBids(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      SUBMITTED: 'default',
      UNDER_REVIEW: 'info',
      EVALUATED: 'warning',
      AWARDED: 'success',
      REJECTED: 'destructive',
      DISQUALIFIED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'bid_number', label: 'Bid #' },
    { key: 'tender_title', label: 'Tender' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'bid_amount', label: 'Amount', render: (item: Record<string, unknown>) => `TZS ${Number(item.bid_amount).toLocaleString()}` },
    { key: 'total_score', label: 'Score' },
    { key: 'rank', label: 'Rank' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
    { key: 'submitted_at', label: 'Submitted', render: (item: Record<string, unknown>) => new Date(item.submitted_at as string).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bids Management</h1>
          <p className="text-muted-foreground">View and manage submitted bids</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={bids}
            actions={(item) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost">
                  <Eye size={16} />
                </Button>
                <Button size="sm" variant="ghost">
                  <FileText size={16} />
                </Button>
              </div>
            )}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
