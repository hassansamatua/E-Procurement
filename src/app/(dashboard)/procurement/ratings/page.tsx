"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';

const emptyRating = {
  contract_id: '',
  quality_score: '5',
  delivery_score: '5',
  compliance_score: '5',
  communication_score: '5',
  comments: '',
};

export default function ProcurementRatingsPage() {
  const [ratings, setRatings] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [rating, setRating] = useState({ ...emptyRating });
  const [rateError, setRateError] = useState('');
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ratingsRes, contractsRes] = await Promise.all([
        axios.get('/api/supplier-ratings?limit=100'),
        axios.get('/api/contracts?limit=100'),
      ]);
      const data = ratingsRes.data.data;
      setRatings(Array.isArray(data) ? data : []);
      const contractData = contractsRes.data.data;
      const allContracts = Array.isArray(contractData) ? contractData : [];
      setContracts(allContracts.filter((c: any) => c.status === 'ACTIVE' || c.status === 'COMPLETED'));
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
      setRatings([]);
      setContracts([]);
    }
    setLoading(false);
  };

  const openRateDialog = () => {
    setRating({ ...emptyRating });
    setRateError('');
    setIsRateOpen(true);
  };

  const handleSubmitRating = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRateError('');
    setRateLoading(true);

    const contract = contracts.find((c) => c.id === rating.contract_id);
    if (!contract) {
      setRateError('Please select a contract');
      setRateLoading(false);
      return;
    }

    try {
      await axios.post('/api/supplier-ratings', {
        contract_id: rating.contract_id,
        supplier_id: contract.supplier_id,
        quality_score: Number(rating.quality_score),
        delivery_score: Number(rating.delivery_score),
        compliance_score: Number(rating.compliance_score),
        communication_score: Number(rating.communication_score),
        comments: rating.comments || undefined,
      });
      setIsRateOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      setRateError(error.response?.data?.message || 'Failed to submit rating');
    }
    setRateLoading(false);
  };

  const getOverallBadge = (score: number) => {
    let variant: 'default' | 'success' | 'warning' | 'destructive' | 'info' = 'destructive';
    if (score >= 4) variant = 'success';
    else if (score >= 3) variant = 'info';
    else if (score >= 2) variant = 'warning';
    return <Badge variant={variant}>{score.toFixed(1)}</Badge>;
  };

  const columns = [
    { key: 'supplier_name', label: 'Supplier', render: (item: Record<string, unknown>) => (item.supplier_name as string) || 'N/A' },
    { key: 'contract_title', label: 'Contract', render: (item: Record<string, unknown>) => (item.contract_title as string) || 'N/A' },
    { key: 'quality_score', label: 'Quality' },
    { key: 'delivery_score', label: 'Delivery' },
    { key: 'compliance_score', label: 'Compliance' },
    { key: 'communication_score', label: 'Communication' },
    { key: 'overall_score', label: 'Overall', render: (item: Record<string, unknown>) => getOverallBadge(Number(item.overall_score)) },
    { key: 'comments', label: 'Comments', render: (item: Record<string, unknown>) => (item.comments as string) || 'N/A' },
    { key: 'created_at', label: 'Rated', render: (item: Record<string, unknown>) => item.created_at ? new Date(item.created_at as string).toLocaleDateString() : 'N/A' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Supplier Ratings</h1>
            <p className="text-muted-foreground">Rate suppliers and view performance ratings</p>
          </div>
          <Button onClick={openRateDialog}>
            <Star size={20} className="mr-2" />
            Rate Supplier
          </Button>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable columns={columns} data={ratings} />
        )}

        <Dialog open={isRateOpen} onOpenChange={setIsRateOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rate Supplier</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitRating} className="space-y-4">
              {rateError && (
                <div className="p-3 text-sm text-white bg-destructive rounded-md">{rateError}</div>
              )}
              <div>
                <Label htmlFor="contract_id">Contract</Label>
                <Select value={rating.contract_id} onValueChange={(value) => setRating({ ...rating, contract_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contract" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.contract_number} - {c.supplier_name || c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contracts.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">No active or completed contracts available to rate.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quality_score">Quality (1-5)</Label>
                  <Input id="quality_score" type="number" min={1} max={5} value={rating.quality_score} onChange={(e) => setRating({ ...rating, quality_score: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="delivery_score">Delivery (1-5)</Label>
                  <Input id="delivery_score" type="number" min={1} max={5} value={rating.delivery_score} onChange={(e) => setRating({ ...rating, delivery_score: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="compliance_score">Compliance (1-5)</Label>
                  <Input id="compliance_score" type="number" min={1} max={5} value={rating.compliance_score} onChange={(e) => setRating({ ...rating, compliance_score: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="communication_score">Communication (1-5)</Label>
                  <Input id="communication_score" type="number" min={1} max={5} value={rating.communication_score} onChange={(e) => setRating({ ...rating, communication_score: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea id="comments" value={rating.comments} onChange={(e) => setRating({ ...rating, comments: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsRateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={rateLoading || contracts.length === 0}>{rateLoading ? 'Submitting...' : 'Submit Rating'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
