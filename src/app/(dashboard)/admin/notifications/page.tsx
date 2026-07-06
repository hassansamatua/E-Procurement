"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2 } from 'lucide-react';

export default function AdminNotificationsPage() {
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

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.patch('/api/notifications', { notificationId: id, action: 'MARK_READ' });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await axios.delete(`/api/notifications?id=${id}`);
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
    { key: 'type', label: 'Type', render: (item: Record<string, unknown>) => getTypeBadge(item.type as string) },
    { key: 'title', label: 'Title' },
    { key: 'message', label: 'Message', render: (item: Record<string, unknown>) => (item.message as string).substring(0, 50) + '...' },
    { key: 'is_read', label: 'Status', render: (item: Record<string, unknown>) => 
      item.is_read ? <Badge variant="default">Read</Badge> : <Badge variant="success">Unread</Badge>
    },
    { key: 'created_at', label: 'Date', render: (item: Record<string, unknown>) => new Date(item.created_at as string).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">View and manage system notifications</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={notifications}
            actions={(item) => (
              <div className="flex gap-2">
                {!item.is_read && (
                  <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(item.id as string)}>
                    <Check size={16} />
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id as string)}>
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
