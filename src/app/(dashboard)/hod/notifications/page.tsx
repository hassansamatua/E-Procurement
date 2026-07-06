"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Trash2, Check } from 'lucide-react';

export default function HodNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications?limit=100');
      const data = response.data.data;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      INFO: 'info',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'destructive',
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'message', label: 'Message' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type', render: (item: Record<string, unknown>) => getTypeBadge(item.type as string) },
    { key: 'is_read', label: 'Status', render: (item: Record<string, unknown>) => item.is_read ? <Badge variant="secondary">Read</Badge> : <Badge variant="default">Unread</Badge> },
    { key: 'created_at', label: 'Created', render: (item: Record<string, unknown>) => item.created_at ? new Date(item.created_at as string).toLocaleDateString() : 'N/A' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">View and manage your notifications</p>
          </div>
          <Button variant="outline" onClick={fetchNotifications}>
            <Bell size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={notifications}
            actions={(item) => (
              <div className="flex gap-1">
                {!item.is_read && (
                  <Button size="sm" variant="ghost" onClick={() => markAsRead(item.id as string)}>
                    <Check size={16} />
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteNotification(item.id as string)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
