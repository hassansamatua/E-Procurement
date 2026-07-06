"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Award } from 'lucide-react';

export default function BidsManagement() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [awarding, setAwarding] = useState<string | null>(null);
  const [negotiationDate, setNegotiationDate] = useState('');
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [awardBid, setAwardBid] = useState<any>(null);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const response = await axios.get('/api/bids?limit=100');
      setBids(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    }
    setLoading(false);
  };

  const handleAward = async (bid: any) => {
    setAwardBid(bid);
    setNegotiationDate('');
    setIsAwardDialogOpen(true);
  };

  const confirmAward = async () => {
    if (!awardBid) return;
    setAwarding(awardBid.id);
    try {
      await axios.patch('/api/evaluations', { 
        tenderId: awardBid.tender_id, 
        bidId: awardBid.id,
        negotiationDate: negotiationDate 
      });
      await fetchBids();
      setIsAwardDialogOpen(false);
      setAwardBid(null);
    } catch (error: any) {
      console.error('Failed to award tender:', error);
      alert(error.response?.data?.message || 'Failed to award tender');
    }
    setAwarding(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      SUBMITTED: 'default',
      UNDER_REVIEW: 'info',
      EVALUATED: 'warning',
      AWARDED: 'success',
      REJECTED: 'destructive',
      DISQUALIFIED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'bid_number', label: 'Bid #' },
    { key: 'tender_title', label: 'Tender' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'bid_amount', label: 'Amount', render: (item: Record<string, unknown>) => `TZS ${Number(item.bid_amount).toLocaleString()}` },
    { key: 'total_score', label: 'Score' },
    { key: 'rank', label: 'Rank' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
    { key: 'submitted_at', label: 'Submitted', render: (item: Record<string, unknown>) => new Date(item.submitted_at as string).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bids Management</h1>
          <p className="text-muted-foreground">View and manage submitted bids</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={bids}
            actions={(item) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSelectedBid(item)}>
                  <Eye size={16} />
                </Button>
                {item.status === 'EVALUATED' && (
                  <Button size="sm" variant="outline" disabled={awarding === item.id} onClick={() => handleAward(item)}>
                    <Award size={16} className="mr-1" />
                    {awarding === item.id ? 'Awarding...' : 'Award'}
                  </Button>
                )}
              </div>
            )}
          />
        )}

        <Dialog open={!!selectedBid} onOpenChange={() => setSelectedBid(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bid Details</DialogTitle>
            </DialogHeader>
            {selectedBid && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bid Number</p>
                    <p className="font-medium">{selectedBid.bid_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="font-medium">{getStatusBadge(selectedBid.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium">{selectedBid.supplier_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tender</p>
                    <p className="font-medium">{selectedBid.tender_title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bid Amount</p>
                    <p className="font-medium">{selectedBid.bid_amount ? `TZS ${Number(selectedBid.bid_amount).toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Score</p>
                    <p className="font-medium">{selectedBid.total_score ? Number(selectedBid.total_score).toFixed(2) : 'Not evaluated'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rank</p>
                    <p className="font-medium">{selectedBid.rank ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">{selectedBid.submitted_at ? new Date(selectedBid.submitted_at).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
                {selectedBid.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{selectedBid.notes}</p>
                  </div>
                )}
                {selectedBid.document_urls && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Bid Documents</p>
                    <div className="space-y-2">
                      {selectedBid.document_urls.split(',').map((url: string, index: number) => (
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
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Award Tender</DialogTitle>
            </DialogHeader>
            {awardBid && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{awardBid.supplier_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bid Amount</p>
                  <p className="font-medium">{awardBid.bid_amount ? `TZS ${Number(awardBid.bid_amount).toLocaleString()}` : 'N/A'}</p>
                </div>
                <div>
                  <Label htmlFor="negotiation_date">Contract Negotiation Date</Label>
                  <Input
                    id="negotiation_date"
                    type="date"
                    value={negotiationDate}
                    onChange={(e) => setNegotiationDate(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Date for the winner to come for contract negotiation</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAwardDialogOpen(false)}>Cancel</Button>
                  <Button type="button" disabled={awarding === awardBid.id} onClick={confirmAward}>
                    {awarding === awardBid.id ? 'Awarding...' : 'Confirm Award'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
