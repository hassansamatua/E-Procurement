"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import { Building2, Users, Truck, Gavel, FileSignature, DollarSign } from 'lucide-react';
import { DashboardStats } from '@/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#1B5E20', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9'];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [tenderData, setTenderData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, tenderRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/tenders?limit=100'),
      ]);
      setStats(statsRes.data.data);
      
      // Process tender data for chart
      const tenders = tenderRes.data.data || [];
      const statusCounts = tenders.reduce((acc: any, tender: any) => {
        acc[tender.status] = (acc[tender.status] || 0) + 1;
        return acc;
      }, {});
      
      const chartData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));
      setTenderData(chartData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Tender Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tenderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tenderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Tender Status Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tenderData}>
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
