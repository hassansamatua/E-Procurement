"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, Eye } from 'lucide-react';

export default function AccountingApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [financialRemarks, setFinancialRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await axios.patch('/api/procurement-requests', {
        requestId: selectedRequest.id,
        action,
        comments,
        financial_remarks: financialRemarks,
      });
      setSelectedRequest(null);
      setComments('');
      setFinancialRemarks('');
      fetchRequests();
    } catch (error) {
      console.error('Failed to update request:', error);
      alert('Failed to update request. Please check the console.');
    }
    setActionLoading(false);
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

  const pendingRequests = requests.filter((r) => r.status === 'PENDING_FINANCE');

  const columns = [
    { key: 'request_number', label: 'Request No.' },
    { key: 'title', label: 'Title' },
    { key: 'requester_name', label: 'Requester', render: (item: Record<string, unknown>) => (item.requester_name as string) || 'N/A' },
    { key: 'estimated_budget', label: 'Amount', render: (item: Record<string, unknown>) => item.estimated_budget ? `TZS ${(item.estimated_budget as number).toLocaleString()}` : 'N/A' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pending Finance Approvals</h1>
          <p className="text-muted-foreground">Review and approve financial requests</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={pendingRequests}
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
              <DialogTitle>Finance Approval</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Request Number</p>
                    <p className="font-medium">{selectedRequest.request_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Requester</p>
                    <p className="font-medium">{selectedRequest.requester_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">{selectedRequest.estimated_budget ? `TZS ${(selectedRequest.estimated_budget as number).toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <p className="font-medium">{selectedRequest.priority}</p>
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
                <div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    placeholder="Add general comments"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Financial Remarks</p>
                  <Textarea
                    value={financialRemarks}
                    onChange={(e) => setFinancialRemarks(e.target.value)}
                    rows={2}
                    placeholder="Add financial remarks (required for rejection)"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => handleAction('APPROVED')}
                    disabled={actionLoading}
                  >
                    <Check size={16} className="mr-2" />
                    Approve
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => handleAction('REJECTED')}
                    disabled={actionLoading}
                  >
                    <X size={16} className="mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
