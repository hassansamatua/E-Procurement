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
import { Eye, Gavel, Download } from 'lucide-react';

export default function SupplierTendersPage() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState<any>(null);
  const [bidTender, setBidTender] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidCurrency, setBidCurrency] = useState('TZS');
  const [bidNotes, setBidNotes] = useState('');
  const [bidDocument, setBidDocument] = useState<File | null>(null);
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const response = await axios.get('/api/tenders?limit=100');
      const data = response.data.data;
      setTenders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch tenders:', error);
      setTenders([]);
    }
    setLoading(false);
  };

  const openBidDialog = (tender: any) => {
    setBidTender(tender);
    setBidAmount('');
    setBidCurrency(tender.currency || 'TZS');
    setBidNotes('');
    setBidDocument(null);
    setBidError('');
    setBidSuccess('');
  };

  const handleSubmitBid = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bidTender) return;
    setBidError('');
    setBidSuccess('');
    setBidLoading(true);

    try {
      // Upload filled tender document first
      let documentUrl = '';
      if (bidDocument) {
        const formData = new FormData();
        formData.append('file', bidDocument);
        formData.append('category', 'bid');
        const uploadRes = await axios.post('/api/upload', formData);
        documentUrl = uploadRes.data.data.url;
      }

      await axios.post('/api/bids', {
        tender_id: bidTender.id,
        bid_amount: Number(bidAmount),
        currency: bidCurrency,
        notes: bidNotes,
        document_url: documentUrl,
      });
      setBidSuccess('Bid submitted successfully');
      setBidAmount('');
      setBidNotes('');
      setBidDocument(null);
      setTimeout(() => {
        setBidTender(null);
        setBidSuccess('');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to submit bid:', error);
      setBidError(error.response?.data?.message || 'Failed to submit bid');
    }
    setBidLoading(false);
  };

  const canBid = (tender: any) => {
    const deadline = tender.submission_deadline || tender.closing_date;
    return tender.status === 'PUBLISHED' && deadline && new Date(deadline) > new Date();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      DRAFT: 'default',
      PUBLISHED: 'success',
      CLOSED: 'warning',
      AWARDED: 'info',
      CANCELLED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'tender_number', label: 'Tender No.' },
    { key: 'title', label: 'Title' },
    { key: 'organization_name', label: 'Organization', render: (item: Record<string, unknown>) => (item.organization_name as string) || 'N/A' },
    { key: 'category_name', label: 'Category', render: (item: Record<string, unknown>) => (item.category_name as string) || 'N/A' },
    { key: 'budget_estimate', label: 'Budget', render: (item: Record<string, unknown>) => item.budget_estimate ? `TZS ${(item.budget_estimate as number).toLocaleString()}` : 'N/A' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => getStatusBadge(item.status as string) },
    { key: 'closing_date', label: 'Closing Date', render: (item: Record<string, unknown>) => item.closing_date ? new Date(item.closing_date as string).toLocaleDateString() : 'N/A' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Available Tenders</h1>
          <p className="text-muted-foreground">View and bid on published tenders</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={tenders}
            actions={(item) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSelectedTender(item)}>
                  <Eye size={16} />
                </Button>
                {(item.documents as any[]) && Array.isArray(item.documents) && (item.documents as any[]).length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open((item.documents as any[])[0].file_path, '_blank')}
                    title="Download Tender Document"
                  >
                    <Download size={16} />
                  </Button>
                )}
                {canBid(item) && (
                  <Button size="sm" variant="outline" onClick={() => openBidDialog(item)}>
                    <Gavel size={16} className="mr-1" />
                    Bid
                  </Button>
                )}
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
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <p className="font-medium">{selectedTender.organization_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedTender.category_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget Estimate</p>
                    <p className="font-medium">{selectedTender.budget_estimate ? `TZS ${(selectedTender.budget_estimate as number).toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Closing Date</p>
                    <p className="font-medium">{selectedTender.closing_date ? new Date(selectedTender.closing_date).toLocaleDateString() : 'N/A'}</p>
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
                {selectedTender.documents && Array.isArray(selectedTender.documents) && selectedTender.documents.length > 0 ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Tender Document</p>
                    <div className="space-y-2">
                      {selectedTender.documents.map((doc: any) => (
                        <a
                          key={doc.id}
                          href={doc.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={16} />
                          {doc.document_name}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">Tender Document</p>
                    <p className="text-sm text-gray-500">No document available</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!bidTender} onOpenChange={() => setBidTender(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Bid</DialogTitle>
            </DialogHeader>
            {bidTender && (
              <form onSubmit={handleSubmitBid} className="space-y-4">
                {bidError && (
                  <div className="p-3 text-sm text-white bg-destructive rounded-md">{bidError}</div>
                )}
                {bidSuccess && (
                  <div className="p-3 text-sm text-white bg-green-600 rounded-md">{bidSuccess}</div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Tender</p>
                  <p className="font-medium">{bidTender.title} ({bidTender.tender_number})</p>
                </div>
                <div>
                  <Label htmlFor="bid_document">Filled Tender Document (PDF) *</Label>
                  <Input
                    id="bid_document"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setBidDocument(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Download the tender document, fill it, and upload the filled version</p>
                </div>
                <div>
                  <Label htmlFor="bid_amount">Bid Amount</Label>
                  <Input
                    id="bid_amount"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                    min={1}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="bid_currency">Currency</Label>
                  <Input id="bid_currency" value={bidCurrency} onChange={(e) => setBidCurrency(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="bid_notes">Notes</Label>
                  <Input id="bid_notes" value={bidNotes} onChange={(e) => setBidNotes(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setBidTender(null)}>Cancel</Button>
                  <Button type="submit" disabled={bidLoading}>{bidLoading ? 'Submitting...' : 'Submit Bid'}</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
