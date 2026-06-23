"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import { Building2, Users, Truck, Gavel, FileSignature, DollarSign } from 'lucide-react';
import { DashboardStats } from '@/types';

export default function SuperAdminDashboard() {
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
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              title="Total Organizations"
              value={stats.totalOrganizations || 0}
              icon={<Building2 size={24} />}
            />
            <StatsCard
              title="Total Users"
              value={stats.totalUsers || 0}
              icon={<Users size={24} />}
            />
            <StatsCard
              title="Total Suppliers"
              value={stats.totalSuppliers || 0}
              icon={<Truck size={24} />}
            />
            <StatsCard
              title="Total Tenders"
              value={stats.totalTenders || 0}
              icon={<Gavel size={24} />}
            />
            <StatsCard
              title="Total Contracts"
              value={stats.totalContracts || 0}
              icon={<FileSignature size={24} />}
            />
            <StatsCard
              title="Total Procurement Value"
              value={`TZS ${(stats.totalProcurementValue || 0).toLocaleString()}`}
              icon={<DollarSign size={24} />}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
