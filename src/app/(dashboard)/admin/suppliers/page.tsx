"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, FileText, Eye } from 'lucide-react';
import { Supplier, SupplierStatus } from '@/types';

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers?limit=50');
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
    setLoading(false);
  };

  const handleApprove = async (supplierId: string) => {
    try {
      await axios.patch('/api/suppliers', { supplierId, action: 'APPROVE' });
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to approve supplier:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedSupplier || !rejectionReason) return;
    
    try {
      await axios.patch('/api/suppliers', { 
        supplierId: selectedSupplier.id, 
        action: 'REJECT',
        rejection_reason: rejectionReason 
      });
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to reject supplier:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'destructive',
      SUSPENDED: 'destructive',
      BLACKLISTED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'categories', label: 'Categories', render: (item: Record<string, unknown>) => {
      const cats = item.categories as string | string[];
      if (Array.isArray(cats)) {
        return cats.join(', ') || 'N/A';
      }
      return cats || 'N/A';
    }},
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
    { key: 'created_at', label: 'Registered', render: (item: Record<string, unknown>) => new Date(item.created_at as string).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground">Review and manage supplier registrations</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={suppliers as unknown as Record<string, unknown>[]}
            actions={(item) => (
              <div className="flex gap-2">
                {item.status === 'PENDING' && (
                  <>
                    <Button size="sm" onClick={() => handleApprove(item.id as string)}>
                      <Check size={16} className="mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        setSelectedSupplier(item as unknown as Supplier);
                        setRejectDialogOpen(true);
                      }}
                    >
                      <X size={16} className="mr-1" />
                      Reject
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

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Supplier Registration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
