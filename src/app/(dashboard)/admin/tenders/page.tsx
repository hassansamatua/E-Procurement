"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gavel, Eye } from 'lucide-react';

export default function AdminTendersPage() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const response = await axios.get('/api/tenders?limit=100');
      setTenders(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch tenders:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      DRAFT: 'default',
      PUBLISHED: 'success',
      CLOSED: 'warning',
      AWARDED: 'success',
      CANCELLED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { key: 'tender_number', label: 'Tender No.' },
    { key: 'title', label: 'Title' },
    { key: 'organization_name', label: 'Organization' },
    { key: 'budget', label: 'Budget', render: (item: Record<string, unknown>) => item.budget ? `TZS ${(item.budget as number).toLocaleString()}` : 'N/A' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
    { key: 'closing_date', label: 'Closing Date', render: (item: Record<string, unknown>) => item.closing_date ? new Date(item.closing_date as string).toLocaleDateString() : 'N/A' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tenders</h1>
          <p className="text-muted-foreground">View and manage all tenders</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={tenders}
            actions={(item) => (
              <Button size="sm" variant="ghost">
                <Eye size={16} />
              </Button>
            )}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
