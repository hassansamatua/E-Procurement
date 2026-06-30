"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye } from 'lucide-react';
import { Tender } from '@/types';

const emptyForm = {
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
  document: null as File | null,
  selectedRequests: [] as string[],
  selectedSuppliers: [] as string[],
};

export default function TenderManagement() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedTender, setSelectedTender] = useState<any>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tenderRes, catRes, reqRes, supRes] = await Promise.all([
        axios.get('/api/tenders?limit=50'),
        axios.get('/api/categories'),
        axios.get('/api/procurement-requests?limit=100'),
        axios.get('/api/suppliers?limit=100'),
      ]);
      setTenders(tenderRes.data.data || []);
      setCategories(catRes.data.data || []);
      setApprovedRequests((reqRes.data.data || []).filter((r: any) => r.status === 'APPROVED'));
      setSuppliers((supRes.data.data || []).filter((s: any) => s.status === 'APPROVED'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleCreateTender = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    // Validate quotation method requires minimum 3 suppliers
    if (form.procurement_method === 'REQUEST_FOR_QUOTATION' && form.selectedSuppliers.length < 3) {
      setCreateError('Minimum 3 suppliers required for Request for Quotation');
      setCreateLoading(false);
      return;
    }

    try {
      // Upload document first
      let documentUrl = '';
      if (form.document) {
        const formData = new FormData();
        formData.append('file', form.document);
        formData.append('category', 'tender');
        const uploadRes = await axios.post('/api/upload', formData);
        documentUrl = uploadRes.data.data.url;
      }

      await axios.post('/api/tenders', {
        title: form.title,
        description: form.description || 'Tender document uploaded',
        category_id: form.category_id || undefined,
        procurement_method: form.procurement_method,
        budget_estimate: form.budget_estimate ? Number(form.budget_estimate) : undefined,
        currency: form.currency || 'TZS',
        submission_deadline: form.submission_deadline,
        opening_date: form.opening_date,
        closing_date: form.closing_date,
        procurement_request_id: form.procurement_request_id || undefined,
        evaluation_criteria: {},
        selected_suppliers: form.selectedSuppliers,
        document_url: documentUrl,
      });
      setForm({ ...emptyForm });
      setIsCreateOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to create tender:', error);
      setCreateError(error.response?.data?.message || 'Failed to create tender');
    }
    setCreateLoading(false);
  };

  const handleTenderAction = async (tenderId: string, action: string) => {
    if (action === 'PUBLISH_AWARD') {
      // Prompt for contract signing date
      const signingDate = prompt('Enter contract signing date (YYYY-MM-DD):', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      if (!signingDate) {
        return; // User cancelled
      }
      try {
        await axios.patch('/api/tenders', { tenderId, action, contract_signing_date: signingDate });
        fetchData();
      } catch (error) {
        console.error('Failed to update tender:', error);
      }
    } else {
      try {
        await axios.patch('/api/tenders', { tenderId, action });
        fetchData();
      } catch (error) {
        console.error('Failed to update tender:', error);
      }
    }
  };

  const handleViewEvaluation = async (tenderId: string) => {
    try {
      const res = await axios.get(`/api/evaluation-results?tender_id=${tenderId}`);
      setEvaluationResult(res.data.data?.[0] || null);
      setShowEvaluationDialog(true);
    } catch (error) {
      console.error('Failed to fetch evaluation result:', error);
      alert('Failed to load evaluation result');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      DRAFT: 'default',
      PUBLISHED: 'success',
      CLOSED: 'warning',
      UNDER_EVALUATION: 'info',
      EVALUATION_COMPLETE: 'warning',
      PENDING_AWARD_APPROVAL: 'info',
      AWARD_APPROVED: 'warning',
      AWARDED: 'success',
      CANCELLED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'tender_number', label: 'Tender #' },
    { key: 'title', label: 'Title' },
    { key: 'procurement_method', label: 'Method' },
    { key: 'budget_estimate', label: 'Budget', render: (item: Record<string, unknown>) => item.budget_estimate ? `TZS ${Number(item.budget_estimate).toLocaleString()}` : 'N/A' },
    { key: 'submission_deadline', label: 'Deadline', render: (item: Record<string, unknown>) => new Date(item.submission_deadline as string).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tender Management</h1>
            <p className="text-muted-foreground">Create and manage tender opportunities</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={20} className="mr-2" />
                Create Tender
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Tender</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTender} className="space-y-4">
                {createError && (
                  <div className="p-3 text-sm text-white bg-destructive rounded-md">{createError}</div>
                )}
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="document">Tender Document (PDF) *</Label>
                  <Input id="document" type="file" accept=".pdf" onChange={(e) => setForm({ ...form, document: e.target.files?.[0] || null })} required />
                  <p className="text-xs text-muted-foreground mt-1">Upload the tender document (PDF format)</p>
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the tender" />
                </div>
                <div>
                  <Label htmlFor="category_id">Category</Label>
                  <Select value={form.category_id} onValueChange={(value) => setForm({ ...form, category_id: value })} onOpenChange={(open) => {
                    if (open) setIsCreateOpen(true);
                  }}>
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
                  <Label htmlFor="procurement_method">Procurement Method</Label>
                  <Select value={form.procurement_method} onValueChange={(value) => setForm({ ...form, procurement_method: value })} onOpenChange={(open) => {
                    if (open) setIsCreateOpen(true);
                  }}>
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
                {form.procurement_method === 'REQUEST_FOR_QUOTATION' && (
                  <div>
                    <Label>Select Suppliers (Minimum 3 required) *</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                      {suppliers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No approved suppliers available</p>
                      ) : (
                        suppliers.map((sup) => (
                          <div key={sup.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`sup-${sup.id}`}
                              checked={form.selectedSuppliers.includes(sup.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setForm({ ...form, selectedSuppliers: [...form.selectedSuppliers, sup.id] });
                                } else {
                                  setForm({ ...form, selectedSuppliers: form.selectedSuppliers.filter((id) => id !== sup.id) });
                                }
                              }}
                            />
                            <label htmlFor={`sup-${sup.id}`} className="text-sm cursor-pointer">
                              {sup.company_name} - {sup.contact_person || 'N/A'}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {form.selectedSuppliers.length > 0 && form.selectedSuppliers.length < 3 && (
                      <p className="text-xs text-destructive mt-1">Minimum 3 suppliers required for quotation</p>
                    )}
                  </div>
                )}
                <div>
                  <Label>Link to Approved Requests (Optional)</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {approvedRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No approved requests available</p>
                    ) : (
                      approvedRequests.map((req) => (
                        <div key={req.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`req-${req.id}`}
                            checked={form.selectedRequests.includes(req.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, selectedRequests: [...form.selectedRequests, req.id] });
                              } else {
                                setForm({ ...form, selectedRequests: form.selectedRequests.filter((id) => id !== req.id) });
                              }
                            }}
                          />
                          <label htmlFor={`req-${req.id}`} className="text-sm cursor-pointer">
                            {req.request_number} - {req.title} (TZS {Number(req.estimated_budget).toLocaleString()})
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget_estimate">Budget Estimate</Label>
                    <Input id="budget_estimate" type="number" value={form.budget_estimate} onChange={(e) => setForm({ ...form, budget_estimate: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="submission_deadline">Submission Deadline</Label>
                    <Input id="submission_deadline" type="datetime-local" value={form.submission_deadline} onChange={(e) => setForm({ ...form, submission_deadline: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="opening_date">Opening Date</Label>
                    <Input id="opening_date" type="datetime-local" value={form.opening_date} onChange={(e) => setForm({ ...form, opening_date: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="closing_date">Closing Date</Label>
                  <Input id="closing_date" type="datetime-local" value={form.closing_date} onChange={(e) => setForm({ ...form, closing_date: e.target.value })} required />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createLoading}>{createLoading ? 'Creating...' : 'Create Tender'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={tenders as unknown as Record<string, unknown>[]}
            actions={(item) => (
              <div className="flex gap-2">
                {item.status === 'DRAFT' && (
                  <Button size="sm" onClick={() => handleTenderAction(item.id as string, 'PUBLISH')}>
                    Publish
                  </Button>
                )}
                {item.status === 'PUBLISHED' && (
                  <Button size="sm" variant="outline" onClick={() => handleTenderAction(item.id as string, 'CLOSE')}>
                    Close
                  </Button>
                )}
                {(item.status === 'PUBLISHED' || item.status === 'CLOSED') && (
                  <Button size="sm" variant="outline" onClick={() => handleTenderAction(item.id as string, 'EVALUATE')}>
                    Forward to Evaluation
                  </Button>
                )}
                {item.status === 'EVALUATION_COMPLETE' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleViewEvaluation(item.id as string)}>
                      View Evaluation
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleTenderAction(item.id as string, 'FORWARD_TO_ACCOUNTING')}>
                      Forward to Accounting
                    </Button>
                  </>
                )}
                {item.status === 'AWARD_APPROVED' && (
                  <Button size="sm" onClick={() => handleTenderAction(item.id as string, 'PUBLISH_AWARD')}>
                    Publish Award
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setSelectedTender(item)}>
                  <Eye size={16} />
                </Button>
              </div>
            )}
          />
        )}

        <Dialog open={!!selectedTender} onOpenChange={() => setSelectedTender(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tender Details</DialogTitle>
            </DialogHeader>
            {selectedTender && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tender Number</p>
                    <p className="font-medium">{selectedTender.tender_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="font-medium">{getStatusBadge(selectedTender.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Method</p>
                    <p className="font-medium">{selectedTender.procurement_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget Estimate</p>
                    <p className="font-medium">{selectedTender.budget_estimate ? `TZS ${Number(selectedTender.budget_estimate).toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submission Deadline</p>
                    <p className="font-medium">{selectedTender.submission_deadline ? new Date(selectedTender.submission_deadline).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Closing Date</p>
                    <p className="font-medium">{selectedTender.closing_date ? new Date(selectedTender.closing_date).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{selectedTender.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedTender.description}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showEvaluationDialog} onOpenChange={() => setShowEvaluationDialog(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Evaluation Results</DialogTitle>
            </DialogHeader>
            {evaluationResult ? (
              <div className="space-y-4">
                {evaluationResult.evaluation_document_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Evaluation Document</p>
                    <a
                      href={evaluationResult.evaluation_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Download Evaluation Document
                    </a>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-3 border rounded-md bg-green-50">
                    <p className="font-medium text-green-800">1st Position (Winner)</p>
                    <p className="text-sm text-green-700">Bid ID: {evaluationResult.winner_bid_id}</p>
                  </div>
                  {evaluationResult.second_runner_up_bid_id && (
                    <div className="p-3 border rounded-md bg-blue-50">
                      <p className="font-medium text-blue-800">2nd Position</p>
                      <p className="text-sm text-blue-700">Bid ID: {evaluationResult.second_runner_up_bid_id}</p>
                    </div>
                  )}
                  {evaluationResult.third_runner_up_bid_id && (
                    <div className="p-3 border rounded-md bg-purple-50">
                      <p className="font-medium text-purple-800">3rd Position</p>
                      <p className="text-sm text-purple-700">Bid ID: {evaluationResult.third_runner_up_bid_id}</p>
                    </div>
                  )}
                </div>
                {evaluationResult.remarks && (
                  <div>
                    <p className="text-sm text-muted-foreground">Remarks</p>
                    <p className="font-medium">{evaluationResult.remarks}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No evaluation result found</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
