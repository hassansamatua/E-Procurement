"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import { Truck, CheckCircle, XCircle, Gavel } from 'lucide-react';
import { DashboardStats } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#1B5E20', '#4CAF50', '#81C784', '#C8E6C9'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [supplierData, setSupplierData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, supplierRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/suppliers?limit=100'),
      ]);
      setStats(statsRes.data.data);
      
      // Process supplier data for chart
      const suppliers = supplierRes.data.data || [];
      const statusCounts = suppliers.reduce((acc: any, supplier: any) => {
        acc[supplier.status] = (acc[supplier.status] || 0) + 1;
        return acc;
      }, {});
      
      const chartData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));
      setSupplierData(chartData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
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

            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Supplier Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={supplierData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {supplierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
