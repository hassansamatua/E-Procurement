"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldAlert } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (moduleFilter) params.append('module', moduleFilter);
      
      const response = await axios.get(`/api/audit-logs?${params}`);
      setLogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
    setLoading(false);
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      CREATE: 'success',
      UPDATE: 'info',
      DELETE: 'destructive',
      LOGIN: 'default',
      LOGOUT: 'default',
      APPROVE: 'success',
      REJECT: 'destructive',
    };
    return <Badge variant={variants[action] || 'default'}>{action}</Badge>;
  };

  const columns = [
    { key: 'action', label: 'Action', render: (item: Record<string, unknown>) => getActionBadge(item.action as string) },
    { key: 'module', label: 'Module' },
    { key: 'description', label: 'Description' },
    { key: 'user_email', label: 'User' },
    { key: 'ip_address', label: 'IP Address' },
    { key: 'created_at', label: 'Date', render: (item: Record<string, unknown>) => new Date(item.created_at as string).toLocaleString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">View system activity and audit trail</p>
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Modules</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="tenders">Tenders</SelectItem>
              <SelectItem value="bids">Bids</SelectItem>
              <SelectItem value="contracts">Contracts</SelectItem>
              <SelectItem value="suppliers">Suppliers</SelectItem>
              <SelectItem value="auth">Authentication</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable columns={columns} data={logs} />
        )}
      </div>
    </DashboardLayout>
  );
}
