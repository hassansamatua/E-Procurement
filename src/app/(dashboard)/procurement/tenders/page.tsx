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
import { Plus, Eye, Edit, FileText } from 'lucide-react';
import { Tender, TenderStatus, ProcurementMethod } from '@/types';

export default function TenderManagement() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

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
    const formData = new FormData(e.currentTarget);
    
    try {
      await axios.post('/api/tenders', {
        title: formData.get('title'),
        description: formData.get('description'),
        category_id: formData.get('category_id'),
        procurement_method: formData.get('procurement_method'),
        budget_estimate: formData.get('budget_estimate'),
        currency: formData.get('currency') || 'TZS',
        submission_deadline: formData.get('submission_deadline'),
        opening_date: formData.get('opening_date'),
        closing_date: formData.get('closing_date'),
        evaluation_criteria: {},
      });
      setIsCreateOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create tender:', error);
    }
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
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" required />
                </div>
                <div>
                  <Label htmlFor="category_id">Category</Label>
                  <Select name="category_id">
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
                  <Select name="procurement_method" defaultValue="OPEN">
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
                    <Input id="budget_estimate" name="budget_estimate" type="number" />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" name="currency" defaultValue="TZS" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="submission_deadline">Submission Deadline</Label>
                    <Input id="submission_deadline" name="submission_deadline" type="datetime-local" required />
                  </div>
                  <div>
                    <Label htmlFor="opening_date">Opening Date</Label>
                    <Input id="opening_date" name="opening_date" type="datetime-local" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="closing_date">Closing Date</Label>
                  <Input id="closing_date" name="closing_date" type="datetime-local" required />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Tender</Button>
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
                <Button size="sm" variant="ghost">
                  <Eye size={16} />
                </Button>
              </div>
            )}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
