"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import { Gavel, FileText, Trophy, Star } from 'lucide-react';
import { DashboardStats } from '@/types';

export default function SupplierDashboard() {
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
          <h1 className="text-2xl font-bold">Supplier Dashboard</h1>
          <p className="text-muted-foreground">View available tenders and manage your bids</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Available Tenders" value={stats.availableTenders || 0} icon={<Gavel size={24} />} />
          <StatsCard title="Submitted Bids" value={stats.submittedBids || 0} icon={<FileText size={24} />} />
          <StatsCard title="Won Contracts" value={stats.wonContracts || 0} icon={<Trophy size={24} />} />
          <StatsCard
            title="Performance Rating"
            value={`${stats.performanceRating || 0}/5`}
            icon={<Star size={24} />}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
