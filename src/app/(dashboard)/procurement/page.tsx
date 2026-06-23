"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import { FileText, Gavel, ClipboardCheck, FileSignature } from 'lucide-react';
import { DashboardStats } from '@/types';

export default function ProcurementDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Procurement Officer Dashboard</h1>
          <p className="text-muted-foreground">Manage procurement processes and tenders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Procurement Requests" value={stats.procurementRequests || 0} icon={<FileText size={24} />} />
          <StatsCard title="Active Tenders" value={stats.activeTenders || 0} icon={<Gavel size={24} />} />
          <StatsCard title="Evaluations" value={stats.evaluationReports || 0} icon={<ClipboardCheck size={24} />} />
          <StatsCard title="Contracts" value={stats.totalContracts || 0} icon={<FileSignature size={24} />} />
        </div>
      </div>
    </DashboardLayout>
  );
}
