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
import { Building2, Check, X, Star } from 'lucide-react';

export default function SuppliersManagement() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers?limit=100');
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
        rejectionReason 
      });
      setIsRejectOpen(false);
      setSelectedSupplier(null);
      setRejectionReason('');
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to reject supplier:', error);
    }
  };

  const handleSuspend = async (supplierId: string) => {
    try {
      await axios.patch('/api/suppliers', { supplierId, action: 'SUSPEND' });
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to suspend supplier:', error);
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
    { key: 'performance_score', label: 'Rating', render: (item: Record<string, unknown>) => (
      <div className="flex items-center gap-1">
        <Star size={16} className="text-yellow-500 fill-yellow-500" />
        {item.performance_score as string}
      </div>
    )},
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Suppliers Management</h1>
          <p className="text-muted-foreground">Manage supplier registrations and approvals</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={suppliers}
            actions={(item) => (
              <div className="flex gap-2">
                {item.status === 'PENDING' && (
                  <>
                    <Button size="sm" onClick={() => handleApprove(item.id as string)}>
                      <Check size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      setSelectedSupplier(item);
                      setIsRejectOpen(true);
                    }}>
                      <X size={16} />
                    </Button>
                  </>
                )}
                {item.status === 'APPROVED' && (
                  <Button size="sm" variant="outline" onClick={() => handleSuspend(item.id as string)}>
                    Suspend
                  </Button>
                )}
              </div>
            )}
          />
        )}

        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject}>Reject</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
