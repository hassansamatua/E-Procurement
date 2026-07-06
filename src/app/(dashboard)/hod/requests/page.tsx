"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

export default function HodRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/procurement-requests?limit=100');
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      DRAFT: 'default',
      PENDING_HOD: 'warning',
      PENDING_PROCUREMENT: 'warning',
      PENDING_FINANCE: 'warning',
      HOD_APPROVED: 'success',
      HOD_REJECTED: 'destructive',
      PROCUREMENT_REJECTED: 'destructive',
      FINANCE_REJECTED: 'destructive',
      APPROVED: 'success',
      REJECTED: 'destructive',
      COMPLETED: 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'request_number', label: 'Request No.' },
    { key: 'title', label: 'Title' },
    { key: 'requester_name', label: 'Requester', render: (item: Record<string, unknown>) => (item.requester_name as string) || 'N/A' },
    { key: 'category_name', label: 'Category', render: (item: Record<string, unknown>) => (item.category_name as string) || 'N/A' },
    { key: 'estimated_budget', label: 'Amount', render: (item: Record<string, unknown>) => item.estimated_budget ? `TZS ${(item.estimated_budget as number).toLocaleString()}` : 'N/A' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
    { key: 'created_at', label: 'Created', render: (item: Record<string, unknown>) => item.created_at ? new Date(item.created_at as string).toLocaleDateString() : 'N/A' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">All Requests</h1>
          <p className="text-muted-foreground">View all procurement requests in your organization</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={requests}
            actions={(item) => (
              <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(item)}>
                <Eye size={16} />
              </Button>
            )}
          />
        )}

        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Request Number</p>
                    <p className="font-medium">{selectedRequest.request_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="font-medium">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedRequest.category_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">{selectedRequest.estimated_budget ? `TZS ${(selectedRequest.estimated_budget as number).toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <p className="font-medium">{selectedRequest.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{selectedRequest.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedRequest.description}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
