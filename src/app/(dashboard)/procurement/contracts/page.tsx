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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, FileSignature } from 'lucide-react';

const emptyContract = {
  tender_id: '',
  supplier_id: '',
  bid_id: '',
  title: '',
  description: '',
  contract_amount: '',
  currency: 'TZS',
  start_date: '',
  end_date: '',
  signing_date: '',
  terms_and_conditions: '',
  document: null as File | null,
};

export default function ContractsManagement() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tenders, setTenders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState({ ...emptyContract });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contractsRes, tendersRes, suppliersRes] = await Promise.all([
        axios.get('/api/contracts?limit=100'),
        axios.get('/api/tenders?limit=100'),
        axios.get('/api/suppliers?limit=100'),
      ]);
      setContracts(contractsRes.data.data || []);
      setTenders(tendersRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleCreateContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      // Upload document first
      let documentUrl = '';
      if (form.document) {
        const formData = new FormData();
        formData.append('file', form.document);
        formData.append('category', 'contract');
        const uploadRes = await axios.post('/api/upload', formData);
        documentUrl = uploadRes.data.data.url;
      }

      await axios.post('/api/contracts', {
        tender_id: form.tender_id,
        supplier_id: form.supplier_id,
        bid_id: form.bid_id || undefined,
        title: form.title,
        description: form.description || 'Contract document uploaded',
        contract_amount: form.contract_amount ? Number(form.contract_amount) : undefined,
        currency: form.currency || 'TZS',
        start_date: form.start_date,
        end_date: form.end_date,
        signing_date: form.signing_date || undefined,
        terms_and_conditions: form.terms_and_conditions || undefined,
      });
      setForm({ ...emptyContract });
      setIsCreateOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to create contract:', error);
      setCreateError(error.response?.data?.message || 'Failed to create contract');
    }
    setCreateLoading(false);
  };

  const handleUpdateStatus = async (contractId: string, status: string) => {
    try {
      await axios.patch('/api/contracts', { contractId, action: status });
      fetchData();
    } catch (error) {
      console.error('Failed to update contract:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      DRAFT: 'default',
      ACTIVE: 'success',
      COMPLETED: 'info',
      TERMINATED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'contract_number', label: 'Contract #' },
    { key: 'title', label: 'Title' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'contract_amount', label: 'Amount', render: (item: Record<string, unknown>) => `TZS ${Number(item.contract_amount).toLocaleString()}` },
    { key: 'start_date', label: 'Start Date', render: (item: Record<string, unknown>) => new Date(item.start_date as string).toLocaleDateString() },
    { key: 'end_date', label: 'End Date', render: (item: Record<string, unknown>) => new Date(item.end_date as string).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contracts Management</h1>
            <p className="text-muted-foreground">Manage procurement contracts</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={20} className="mr-2" />
                Create Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Contract</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateContract} className="space-y-4">
                {createError && (
                  <div className="p-3 text-sm text-white bg-destructive rounded-md">{createError}</div>
                )}
                <div>
                  <Label htmlFor="title">Contract Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="document">Signed Contract Document (PDF) *</Label>
                  <Input id="document" type="file" accept=".pdf" onChange={(e) => setForm({ ...form, document: e.target.files?.[0] || null })} required />
                  <p className="text-xs text-muted-foreground mt-1">Upload the manually negotiated and signed contract document (PDF format)</p>
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the contract" />
                </div>
                <div>
                  <Label htmlFor="tender_id">Tender</Label>
                  <Select value={form.tender_id} onValueChange={(value) => setForm({ ...form, tender_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tender" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenders.map((tender) => (
                        <SelectItem key={tender.id} value={tender.id}>{tender.tender_number} - {tender.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supplier_id">Supplier</Label>
                  <Select value={form.supplier_id} onValueChange={(value) => setForm({ ...form, supplier_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contract_amount">Contract Amount</Label>
                    <Input id="contract_amount" type="number" value={form.contract_amount} onChange={(e) => setForm({ ...form, contract_amount: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input id="start_date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input id="end_date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signing_date">Signing Date</Label>
                  <Input id="signing_date" type="date" value={form.signing_date} onChange={(e) => setForm({ ...form, signing_date: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
                  <Textarea id="terms_and_conditions" value={form.terms_and_conditions} onChange={(e) => setForm({ ...form, terms_and_conditions: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createLoading}>{createLoading ? 'Creating...' : 'Create Contract'}</Button>
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
            data={contracts}
            actions={(item) => (
              <div className="flex gap-2">
                {item.status === 'DRAFT' && (
                  <Button size="sm" onClick={() => handleUpdateStatus(item.id as string, 'ACTIVATE')}>
                    Activate
                  </Button>
                )}
                {item.status === 'ACTIVE' && (
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id as string, 'COMPLETE')}>
                    Complete
                  </Button>
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
