"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import { FileText, Gavel, ClipboardCheck, FileSignature } from 'lucide-react';
import { DashboardStats } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#1B5E20', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9'];

export default function ProcurementDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [contractData, setContractData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, contractRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/contracts?limit=100'),
      ]);
      setStats(statsRes.data.data);
      
      // Process contract data for chart
      const contracts = contractRes.data.data || [];
      const statusCounts = contracts.reduce((acc: any, contract: any) => {
        acc[contract.status] = (acc[contract.status] || 0) + 1;
        return acc;
      }, {});
      
      const chartData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));
      setContractData(chartData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Procurement Requests" value={stats.procurementRequests || 0} icon={<FileText size={24} />} />
              <StatsCard title="Active Tenders" value={stats.activeTenders || 0} icon={<Gavel size={24} />} />
              <StatsCard title="Evaluations" value={stats.evaluationReports || 0} icon={<ClipboardCheck size={24} />} />
              <StatsCard title="Contracts" value={stats.totalContracts || 0} icon={<FileSignature size={24} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Contract Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={contractData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {contractData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Contract Status Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contractData}>
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
