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

export default function ContractsManagement() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tenders, setTenders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

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
    const formData = new FormData(e.currentTarget);
    
    try {
      await axios.post('/api/contracts', {
        tender_id: formData.get('tender_id'),
        supplier_id: formData.get('supplier_id'),
        bid_id: formData.get('bid_id') || null,
        title: formData.get('title'),
        description: formData.get('description'),
        contract_amount: formData.get('contract_amount'),
        currency: formData.get('currency') || 'TZS',
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        signing_date: formData.get('signing_date') || null,
        terms_and_conditions: formData.get('terms_and_conditions'),
      });
      setIsCreateOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create contract:', error);
    }
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
                <div>
                  <Label htmlFor="title">Contract Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>
                <div>
                  <Label htmlFor="tender_id">Tender</Label>
                  <Select name="tender_id" required>
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
                  <Select name="supplier_id" required>
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
                    <Input id="contract_amount" name="contract_amount" type="number" required />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" name="currency" defaultValue="TZS" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input id="start_date" name="start_date" type="date" required />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input id="end_date" name="end_date" type="date" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signing_date">Signing Date</Label>
                  <Input id="signing_date" name="signing_date" type="date" />
                </div>
                <div>
                  <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
                  <Textarea id="terms_and_conditions" name="terms_and_conditions" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Contract</Button>
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
