"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import { Truck, CheckCircle, XCircle, Gavel } from 'lucide-react';
import { DashboardStats } from '@/types';

export default function AdminDashboard() {
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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Supplier management and monitoring</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Pending Suppliers"
              value={stats.pendingSuppliers || 0}
              icon={<Truck size={24} />}
              description="Awaiting review"
            />
            <StatsCard
              title="Approved Suppliers"
              value={stats.approvedSuppliers || 0}
              icon={<CheckCircle size={24} />}
            />
            <StatsCard
              title="Rejected Suppliers"
              value={stats.rejectedSuppliers || 0}
              icon={<XCircle size={24} />}
            />
            <StatsCard
              title="Active Tenders"
              value={stats.activeTenders || 0}
              icon={<Gavel size={24} />}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
