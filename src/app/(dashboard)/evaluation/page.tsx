"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, ClipboardList, Award } from 'lucide-react';
import { DashboardStats } from '@/types';

export default function EvaluationDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, bidsRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/bids?status=SUBMITTED&limit=20'),
      ]);
      setStats(statsRes.data.data);
      setBids(bidsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleEvaluation = async (bid: any) => {
    // Navigate to evaluation page for this bid
    window.location.href = `/procurement/evaluations?tenderId=${bid.tender_id}`;
  };

  const columns = [
    { key: 'bid_number', label: 'Bid #' },
    { key: 'tender_title', label: 'Tender' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'bid_amount', label: 'Amount', render: (item: Record<string, unknown>) => item.bid_amount ? `TZS ${Number(item.bid_amount).toLocaleString()}` : 'N/A' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => <Badge variant="outline">{item.status as string}</Badge> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Evaluation Officer Dashboard</h1>
          <p className="text-muted-foreground">Evaluate submitted bids and recommend award decisions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Pending Evaluations" value={bids.length} icon={<FileCheck size={24} />} />
          <StatsCard title="Total Tenders" value={stats.totalTenders || 0} icon={<ClipboardList size={24} />} />
          <StatsCard title="Total Awards" value={stats.totalContracts || 0} icon={<Award size={24} />} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Bids Pending Evaluation</h2>
          <DataTable
            columns={columns}
            data={bids as unknown as Record<string, unknown>[]}
            actions={(item) => (
              <Button size="sm" onClick={() => handleEvaluation(item)}>
                Evaluate
              </Button>
            )}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
