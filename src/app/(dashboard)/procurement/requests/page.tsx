"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Eye, FilePlus } from 'lucide-react';

const emptyTender = {
  title: '',
  description: '',
  category_id: '',
  procurement_method: 'OPEN',
  budget_estimate: '',
  currency: 'TZS',
  submission_deadline: '',
  opening_date: '',
  closing_date: '',
  procurement_request_id: '',
};

export default function ProcurementRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tenderForm, setTenderForm] = useState({ ...emptyTender });
  const [isTenderOpen, setIsTenderOpen] = useState(false);
  const [tenderError, setTenderError] = useState('');
  const [tenderLoading, setTenderLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const [reqRes, catRes] = await Promise.all([
        axios.get('/api/procurement-requests?limit=100'),
        axios.get('/api/categories'),
      ]);
      setRequests(reqRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
    setLoading(false);
  };

  const openTenderDialog = (request: any) => {
    setTenderForm({
      ...emptyTender,
      title: request.title || '',
      description: request.description || '',
      budget_estimate: request.estimated_budget ? String(request.estimated_budget) : '',
      procurement_request_id: request.id,
    });
    setTenderError('');
    setIsTenderOpen(true);
  };

  const handleCreateTender = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTenderError('');
    setTenderLoading(true);
    try {
      await axios.post('/api/tenders', {
        title: tenderForm.title,
        description: tenderForm.description,
        category_id: tenderForm.category_id || undefined,
        procurement_method: tenderForm.procurement_method,
        budget_estimate: tenderForm.budget_estimate ? Number(tenderForm.budget_estimate) : undefined,
        currency: tenderForm.currency || 'TZS',
        submission_deadline: tenderForm.submission_deadline,
        opening_date: tenderForm.opening_date,
        closing_date: tenderForm.closing_date,
        procurement_request_id: tenderForm.procurement_request_id || undefined,
        evaluation_criteria: {},
      });
      setIsTenderOpen(false);
      fetchRequests();
    } catch (error: any) {
      console.error('Failed to create tender:', error);
      setTenderError(error.response?.data?.message || 'Failed to create tender');
    }
    setTenderLoading(false);
  };

  const handleAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;
    
    // Require comments for rejection
    if (action === 'REJECTED' && !comments.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setActionLoading(true);
    try {
      await axios.patch('/api/procurement-requests', {
        requestId: selectedRequest.id,
        action,
        comments,
      });
      setSelectedRequest(null);
      setComments('');
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

  const actionableRequests = requests.filter((r) => r.status === 'PENDING_PROCUREMENT' || r.status === 'HOD_APPROVED');
  const completedRequests = requests.filter((r) => r.status === 'PROCUREMENT_REJECTED');
  const approvedRequests = requests.filter((r) => r.status === 'APPROVED');

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
          <h1 className="text-2xl font-bold">Procurement Requests</h1>
          <p className="text-muted-foreground">Review and process approved procurement requests</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Requests Awaiting Your Review</h2>
              <DataTable
                columns={columns}
                data={actionableRequests}
                actions={(item) => (
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(item)}>
                    <Eye size={16} />
                  </Button>
                )}
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Approved &mdash; Ready for Tender</h2>
              <DataTable
                columns={columns}
                data={approvedRequests}
                actions={(item) => (
                  <Button size="sm" variant="outline" onClick={() => openTenderDialog(item)}>
                    <FilePlus size={16} className="mr-1" />
                    Create Tender
                  </Button>
                )}
              />
            </div>

            {completedRequests.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Approval History</h2>
                <DataTable
                  columns={columns}
                  data={completedRequests}
                  actions={(item) => (
                    <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(item)}>
                      <Eye size={16} />
                    </Button>
                  )}
                />
              </div>
            )}
          </>
        )}

        <Dialog open={isTenderOpen} onOpenChange={setIsTenderOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Tender from Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTender} className="space-y-4">
              {tenderError && (
                <div className="p-3 text-sm text-white bg-destructive rounded-md">{tenderError}</div>
              )}
              <div>
                <Label htmlFor="t_title">Title</Label>
                <Input id="t_title" value={tenderForm.title} onChange={(e) => setTenderForm({ ...tenderForm, title: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="t_description">Description</Label>
                <Textarea id="t_description" value={tenderForm.description} onChange={(e) => setTenderForm({ ...tenderForm, description: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="t_category">Category</Label>
                <Select value={tenderForm.category_id} onValueChange={(value) => setTenderForm({ ...tenderForm, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="t_method">Procurement Method</Label>
                <Select value={tenderForm.procurement_method} onValueChange={(value) => setTenderForm({ ...tenderForm, procurement_method: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open Tender</SelectItem>
                    <SelectItem value="RESTRICTED">Restricted</SelectItem>
                    <SelectItem value="DIRECT">Direct</SelectItem>
                    <SelectItem value="REQUEST_FOR_QUOTATION">Request for Quotation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="t_budget">Budget Estimate</Label>
                  <Input id="t_budget" type="number" value={tenderForm.budget_estimate} onChange={(e) => setTenderForm({ ...tenderForm, budget_estimate: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="t_currency">Currency</Label>
                  <Input id="t_currency" value={tenderForm.currency} onChange={(e) => setTenderForm({ ...tenderForm, currency: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="t_deadline">Submission Deadline</Label>
                  <Input id="t_deadline" type="datetime-local" value={tenderForm.submission_deadline} onChange={(e) => setTenderForm({ ...tenderForm, submission_deadline: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="t_opening">Opening Date</Label>
                  <Input id="t_opening" type="datetime-local" value={tenderForm.opening_date} onChange={(e) => setTenderForm({ ...tenderForm, opening_date: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label htmlFor="t_closing">Closing Date</Label>
                <Input id="t_closing" type="datetime-local" value={tenderForm.closing_date} onChange={(e) => setTenderForm({ ...tenderForm, closing_date: e.target.value })} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsTenderOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={tenderLoading}>{tenderLoading ? 'Creating...' : 'Create Tender'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRequest?.status === 'PENDING_PROCUREMENT' || selectedRequest?.status === 'HOD_APPROVED' ? 'Process Request' : 'Request Details'}</DialogTitle>
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
                {(selectedRequest.status === 'PENDING_PROCUREMENT' || selectedRequest.status === 'HOD_APPROVED') && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Rejection Reason <span className="text-red-500">*</span></p>
                      <Textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={3}
                        placeholder="Please provide a reason for rejection (required)"
                        className={comments.trim() === '' ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {comments.trim() === '' && (
                        <p className="text-xs text-red-500 mt-1">Reason is required for rejection</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
                        onClick={() => handleAction('APPROVED')}
                        disabled={actionLoading}
                      >
                        <Check size={16} className="mr-2" />
                        Approve & Forward to Finance
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
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
