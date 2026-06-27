"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, FileText, CheckCircle, CreditCard } from 'lucide-react';
import { DashboardStats, ProcurementRequest } from '@/types';

export default function FinanceDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, reqRes, contractRes, paymentRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/procurement-requests?status=PENDING_FINANCE&limit=10'),
        axios.get('/api/contracts?status=ACTIVE&limit=20'),
        axios.get('/api/payments?limit=20'),
      ]);
      setStats(statsRes.data.data);
      setRequests(reqRes.data.data || []);
      setContracts(contractRes.data.data || []);
      setPayments(paymentRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleApproval = async (requestId: string, action: string) => {
    try {
      await axios.patch('/api/procurement-requests', { 
        requestId, 
        action, 
        financial_remarks: action === 'APPROVED' ? 'Budget approved' : 'Budget rejected - insufficient funds' 
      });
      fetchData();
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Failed to process approval');
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedContract || !paymentAmount) {
      alert('Please enter payment amount');
      return;
    }

    setProcessingPayment(true);
    try {
      // Get the winning bid for this contract
      const bidsRes = await axios.get(`/api/bids?tender_id=${selectedContract.tender_id}&status=AWARDED`);
      const winningBid = bidsRes.data.data?.[0];

      if (!winningBid) {
        alert('No awarded bid found for this contract');
        setProcessingPayment(false);
        return;
      }

      await axios.post('/api/payments', {
        contract_id: selectedContract.id,
        bid_id: winningBid.id,
        amount: Number(paymentAmount),
        currency: 'TZS',
        payment_method: 'BANK_TRANSFER',
        notes: paymentNotes,
      });

      alert('Payment processed successfully (Test Mode - No actual payment made)');
      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentNotes('');
      setSelectedContract(null);
      fetchData();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Failed to process payment');
    }
    setProcessingPayment(false);
  };

  const requestColumns = [
    { key: 'request_number', label: 'Request #' },
    { key: 'title', label: 'Title' },
    { key: 'requester_name', label: 'Requested By' },
    { key: 'department', label: 'Department' },
    { key: 'estimated_budget', label: 'Budget', render: (item: Record<string, unknown>) => item.estimated_budget ? `TZS ${Number(item.estimated_budget).toLocaleString()}` : 'N/A' },
    { key: 'priority', label: 'Priority', render: (item: Record<string, unknown>) => <Badge variant="outline">{item.priority as string}</Badge> },
  ];

  const contractColumns = [
    { key: 'contract_number', label: 'Contract #' },
    { key: 'title', label: 'Title' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'contract_amount', label: 'Amount', render: (item: Record<string, unknown>) => item.contract_amount ? `TZS ${Number(item.contract_amount).toLocaleString()}` : 'N/A' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => <Badge variant="outline">{item.status as string}</Badge> },
  ];

  const paymentColumns = [
    { key: 'payment_reference', label: 'Reference' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'contract_title', label: 'Contract' },
    { key: 'amount', label: 'Amount', render: (item: Record<string, unknown>) => item.amount ? `TZS ${Number(item.amount).toLocaleString()}` : 'N/A' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => {
      const status = item.status as string;
      const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
        PENDING: 'default',
        PROCESSING: 'warning',
        COMPLETED: 'success',
        FAILED: 'destructive',
        CANCELLED: 'destructive',
      };
      return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    }},
    { key: 'payment_date', label: 'Date', render: (item: Record<string, unknown>) => item.payment_date ? new Date(item.payment_date as string).toLocaleDateString() : 'N/A' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Finance Officer Dashboard</h1>
          <p className="text-muted-foreground">Review budgets and process supplier payments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Pending Budget Approvals" value={requests.length} icon={<DollarSign size={24} />} />
          <StatsCard title="Active Contracts" value={contracts.length} icon={<FileText size={24} />} />
          <StatsCard title="Total Payments" value={payments.length} icon={<CreditCard size={24} />} />
          <StatsCard title="Total Tenders" value={stats.totalTenders || 0} icon={<CheckCircle size={24} />} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Pending Budget Approvals</h2>
          <DataTable
            columns={requestColumns}
            data={requests as unknown as Record<string, unknown>[]}
            actions={(item) => (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApproval(item.id as string, 'APPROVED')}>
                  Approve Budget
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleApproval(item.id as string, 'REJECTED')}>
                  Reject
                </Button>
              </div>
            )}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Active Contracts (Ready for Payment)</h2>
          <DataTable
            columns={contractColumns}
            data={contracts as unknown as Record<string, unknown>[]}
            actions={(item) => (
              <Button size="sm" onClick={() => {
                setSelectedContract(item);
                setPaymentAmount(item.contract_amount?.toString() || '');
                setShowPaymentDialog(true);
              }}>
                Process Payment
              </Button>
            )}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Payment History</h2>
          <DataTable
            columns={paymentColumns}
            data={payments as unknown as Record<string, unknown>[]}
          />
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={() => setShowPaymentDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment (Test Mode)</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div>
                <Label>Contract</Label>
                <p className="text-sm font-medium">{selectedContract.title}</p>
                <p className="text-xs text-muted-foreground">{selectedContract.contract_number}</p>
              </div>
              <div>
                <Label>Supplier</Label>
                <p className="text-sm font-medium">{selectedContract.supplier_name}</p>
              </div>
              <div>
                <Label htmlFor="amount">Payment Amount (TZS)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Payment notes"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Test Mode:</strong> This is a simulation. No actual payment will be processed.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleProcessPayment} disabled={processingPayment} className="flex-1">
                  {processingPayment ? 'Processing...' : 'Process Payment'}
                </Button>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={processingPayment}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
