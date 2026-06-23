"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import { Gavel, FileText, Trophy, Star } from 'lucide-react';
import { DashboardStats } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#1B5E20', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9'];

export default function SupplierDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [bidData, setBidData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, bidRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/bids?limit=100'),
      ]);
      setStats(statsRes.data.data);
      
      // Process bid data for chart
      const bids = bidRes.data.data || [];
      const statusCounts = bids.reduce((acc: any, bid: any) => {
        acc[bid.status] = (acc[bid.status] || 0) + 1;
        return acc;
      }, {});
      
      const chartData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));
      setBidData(chartData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Bid Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bidData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bidData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Bid Status Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bidData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#1B5E20" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
