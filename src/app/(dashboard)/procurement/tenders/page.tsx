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
};

export default function TenderManagement() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedTender, setSelectedTender] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tenderRes, catRes] = await Promise.all([
        axios.get('/api/tenders?limit=50'),
        axios.get('/api/categories'),
      ]);
      setTenders(tenderRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleCreateTender = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      await axios.post('/api/tenders', {
        title: form.title,
        description: form.description,
        category_id: form.category_id || undefined,
        procurement_method: form.procurement_method,
        budget_estimate: form.budget_estimate ? Number(form.budget_estimate) : undefined,
        currency: form.currency || 'TZS',
        submission_deadline: form.submission_deadline,
        opening_date: form.opening_date,
        closing_date: form.closing_date,
        procurement_request_id: form.procurement_request_id || undefined,
        evaluation_criteria: {},
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
    try {
      await axios.patch('/api/tenders', { tenderId, action });
      fetchData();
    } catch (error) {
      console.error('Failed to update tender:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      DRAFT: 'default',
      PUBLISHED: 'success',
      CLOSED: 'warning',
      UNDER_EVALUATION: 'info',
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
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="category_id">Category</Label>
                  <Select value={form.category_id} onValueChange={(value) => setForm({ ...form, category_id: value })}>
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
                  <Select value={form.procurement_method} onValueChange={(value) => setForm({ ...form, procurement_method: value })}>
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
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleTenderAction(item.id as string, 'CLOSE')}>
                      Close
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleTenderAction(item.id as string, 'EVALUATE')}>
                      Evaluate
                    </Button>
                  </>
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
      </div>
    </DashboardLayout>
  );
}
