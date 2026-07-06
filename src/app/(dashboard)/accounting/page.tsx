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
import { ClipboardCheck, FileText, DollarSign } from 'lucide-react';
import { DashboardStats, ProcurementRequest } from '@/types';

export default function AccountingDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [pendingAwards, setPendingAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAward, setSelectedAward] = useState<any>(null);
  const [contractSigningDate, setContractSigningDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bidDocuments, setBidDocuments] = useState<any[]>([]);
  const [showBidDocuments, setShowBidDocuments] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, reqRes, tendersRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/procurement-requests?status=PENDING_FINANCE&limit=10'),
        axios.get('/api/tenders?status=PENDING_AWARD_APPROVAL&limit=20'),
      ]);
      setStats(statsRes.data.data);
      setRequests(reqRes.data.data || []);
      setPendingAwards(tendersRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleApproval = async (requestId: string, action: string) => {
    try {
      await axios.patch('/api/procurement-requests', { requestId, action, financial_remarks: 'Budget verified' });
      fetchData();
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleAwardApproval = async () => {
    if (!contractSigningDate) {
      alert('Please select a contract signing date');
      return;
    }

    setSubmitting(true);
    try {
      // Get evaluation result for this tender
      const evalRes = await axios.get(`/api/evaluation-results?tender_id=${selectedAward.id}`);
      const evaluationResult = evalRes.data.data?.[0];

      if (!evaluationResult) {
        alert('Evaluation result not found');
        setSubmitting(false);
        return;
      }

      await axios.post('/api/awards', {
        evaluation_result_id: evaluationResult.id,
        contract_signing_date: contractSigningDate,
      });

      setSelectedAward(null);
      setContractSigningDate('');
      fetchData();
    } catch (error: any) {
      console.error('Award approval failed:', error);
      alert(error.response?.data?.message || 'Failed to approve award');
    }
    setSubmitting(false);
  };

  const handleViewBidDocuments = async (tenderId: string) => {
    try {
      const res = await axios.get(`/api/bids?tender_id=${tenderId}`);
      setBidDocuments(res.data.data || []);
      setShowBidDocuments(true);
    } catch (error) {
      console.error('Failed to fetch bid documents:', error);
    }
  };

  const columns = [
    { key: 'request_number', label: 'Request #' },
    { key: 'title', label: 'Title' },
    { key: 'requester_name', label: 'Requested By' },
    { key: 'estimated_budget', label: 'Budget', render: (item: Record<string, unknown>) => item.estimated_budget ? `TZS ${Number(item.estimated_budget).toLocaleString()}` : 'N/A' },
    { key: 'priority', label: 'Priority', render: (item: Record<string, unknown>) => <Badge variant="outline">{item.priority as string}</Badge> },
  ];

  const awardColumns = [
    { key: 'tender_number', label: 'Tender #' },
    { key: 'title', label: 'Title' },
    { key: 'budget_estimate', label: 'Budget', render: (item: Record<string, unknown>) => item.budget_estimate ? `TZS ${Number(item.budget_estimate).toLocaleString()}` : 'N/A' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => <Badge variant="outline">{item.status as string}</Badge> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Accounting Officer Dashboard</h1>
          <p className="text-muted-foreground">Review financial compliance and approve tender awards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Pending Financial Review" value={requests.length} icon={<ClipboardCheck size={24} />} />
          <StatsCard title="Total Requests" value={stats.procurementRequests || 0} icon={<FileText size={24} />} />
          <StatsCard title="Total Contracts" value={stats.totalContracts || 0} icon={<DollarSign size={24} />} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Pending Financial Approvals</h2>
          <DataTable
            columns={columns}
            data={requests as unknown as Record<string, unknown>[]}
            actions={(item) => (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApproval(item.id as string, 'APPROVED')}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleApproval(item.id as string, 'REJECTED')}>
                  Reject
                </Button>
              </div>
            )}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Pending Award Approvals</h2>
          <p className="text-sm text-muted-foreground mb-4">Review evaluation results and approve tender awards</p>
          {loading ? (
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          ) : (
            <DataTable
              columns={awardColumns}
              data={pendingAwards as unknown as Record<string, unknown>[]}
              actions={(item) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewBidDocuments(item.id as string)}>
                    View Bids
                  </Button>
                  <Button size="sm" onClick={() => setSelectedAward(item)}>
                    Review & Award
                  </Button>
                </div>
              )}
            />
          )}
        </div>

        <Dialog open={!!selectedAward} onOpenChange={() => setSelectedAward(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Approve Award: {selectedAward?.title}</DialogTitle>
            </DialogHeader>
            {selectedAward && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signingDate">Contract Signing Date *</Label>
                  <Input
                    id="signingDate"
                    type="date"
                    value={contractSigningDate}
                    onChange={(e) => setContractSigningDate(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Date when the winner should come to sign the contract</p>
                </div>
                <Button
                  onClick={handleAwardApproval}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? 'Approving...' : 'Approve Award'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showBidDocuments} onOpenChange={() => setShowBidDocuments(false)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bid Documents</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {bidDocuments.length === 0 ? (
                <p className="text-muted-foreground">No bids found</p>
              ) : (
                bidDocuments.map((bid) => (
                  <div key={bid.id} className="p-4 border rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{bid.supplier_name}</p>
                        <p className="text-sm text-muted-foreground">Bid Amount: TZS {Number(bid.bid_amount).toLocaleString()}</p>
                      </div>
                      <Badge variant="outline">{bid.status}</Badge>
                    </div>
                    {bid.document_urls ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium">Documents:</p>
                        {bid.document_urls.split(',').map((url: string, index: number) => (
                          <a
                            key={index}
                            href={url.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            View Document {index + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No documents uploaded</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
