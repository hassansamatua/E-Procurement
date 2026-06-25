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
import { ClipboardCheck } from 'lucide-react';

const emptyScores = {
  technical_score: '',
  financial_score: '',
  experience_score: '',
  compliance_score: '',
  comments: '',
};

export default function ProcurementEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [pendingBids, setPendingBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreBid, setScoreBid] = useState<any>(null);
  const [scores, setScores] = useState({ ...emptyScores });
  const [scoreError, setScoreError] = useState('');
  const [scoreSuccess, setScoreSuccess] = useState('');
  const [scoreLoading, setScoreLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [evalRes, bidsRes] = await Promise.all([
        axios.get('/api/evaluations?limit=100'),
        axios.get('/api/bids?limit=100'),
      ]);
      const evalData = evalRes.data.data;
      setEvaluations(Array.isArray(evalData) ? evalData : []);
      const bidsData = bidsRes.data.data;
      const bids = Array.isArray(bidsData) ? bidsData : [];
      setPendingBids(bids.filter((b: any) => b.status === 'SUBMITTED' || b.status === 'UNDER_REVIEW'));
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
      setEvaluations([]);
      setPendingBids([]);
    }
    setLoading(false);
  };

  const openScoreDialog = (bid: any) => {
    setScoreBid(bid);
    setScores({ ...emptyScores });
    setScoreError('');
    setScoreSuccess('');
  };

  const handleSubmitScore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!scoreBid) return;
    setScoreError('');
    setScoreSuccess('');
    setScoreLoading(true);

    try {
      await axios.post('/api/evaluations', {
        bid_id: scoreBid.id,
        technical_score: Number(scores.technical_score),
        financial_score: Number(scores.financial_score),
        experience_score: Number(scores.experience_score),
        compliance_score: Number(scores.compliance_score),
        comments: scores.comments || undefined,
      });
      setScoreSuccess('Evaluation submitted successfully');
      setTimeout(() => {
        setScoreBid(null);
        fetchData();
      }, 1200);
    } catch (error: any) {
      console.error('Failed to submit evaluation:', error);
      setScoreError(error.response?.data?.message || 'Failed to submit evaluation');
    }
    setScoreLoading(false);
  };

  const pendingColumns = [
    { key: 'bid_number', label: 'Bid No.', render: (item: Record<string, unknown>) => (item.bid_number as string) || 'N/A' },
    { key: 'supplier_name', label: 'Supplier', render: (item: Record<string, unknown>) => (item.supplier_name as string) || 'N/A' },
    { key: 'tender_title', label: 'Tender', render: (item: Record<string, unknown>) => (item.tender_title as string) || 'N/A' },
    { key: 'bid_amount', label: 'Amount', render: (item: Record<string, unknown>) => item.bid_amount ? `TZS ${Number(item.bid_amount).toLocaleString()}` : 'N/A' },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => <Badge variant="info">{String(item.status).replace(/_/g, ' ')}</Badge> },
  ];

  const columns = [
    { key: 'bid_number', label: 'Bid No.', render: (item: Record<string, unknown>) => (item.bid_number as string) || 'N/A' },
    { key: 'supplier_name', label: 'Supplier', render: (item: Record<string, unknown>) => (item.supplier_name as string) || 'N/A' },
    { key: 'technical_score', label: 'Technical' },
    { key: 'financial_score', label: 'Financial' },
    { key: 'experience_score', label: 'Experience' },
    { key: 'compliance_score', label: 'Compliance' },
    { key: 'total_score', label: 'Total', render: (item: Record<string, unknown>) => item.total_score ? Number(item.total_score).toFixed(2) : 'N/A' },
    { key: 'evaluator_name', label: 'Evaluator', render: (item: Record<string, unknown>) => (item.evaluator_name as string) || 'N/A' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bid Evaluations</h1>
          <p className="text-muted-foreground">Score submitted bids and review completed evaluations</p>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Bids Awaiting Evaluation</h2>
              <DataTable
                columns={pendingColumns}
                data={pendingBids}
                actions={(item) => (
                  <Button size="sm" variant="outline" onClick={() => openScoreDialog(item)}>
                    <ClipboardCheck size={16} className="mr-1" />
                    Evaluate
                  </Button>
                )}
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Completed Evaluations</h2>
              <DataTable columns={columns} data={evaluations} />
            </div>
          </>
        )}

        <Dialog open={!!scoreBid} onOpenChange={() => setScoreBid(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Evaluate Bid</DialogTitle>
            </DialogHeader>
            {scoreBid && (
              <form onSubmit={handleSubmitScore} className="space-y-4">
                {scoreError && (
                  <div className="p-3 text-sm text-white bg-destructive rounded-md">{scoreError}</div>
                )}
                {scoreSuccess && (
                  <div className="p-3 text-sm text-white bg-green-600 rounded-md">{scoreSuccess}</div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Bid</p>
                  <p className="font-medium">{scoreBid.bid_number} - {scoreBid.supplier_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="technical_score">Technical (0-100)</Label>
                    <Input id="technical_score" type="number" min={0} max={100} value={scores.technical_score} onChange={(e) => setScores({ ...scores, technical_score: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="financial_score">Financial (0-100)</Label>
                    <Input id="financial_score" type="number" min={0} max={100} value={scores.financial_score} onChange={(e) => setScores({ ...scores, financial_score: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="experience_score">Experience (0-100)</Label>
                    <Input id="experience_score" type="number" min={0} max={100} value={scores.experience_score} onChange={(e) => setScores({ ...scores, experience_score: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="compliance_score">Compliance (0-100)</Label>
                    <Input id="compliance_score" type="number" min={0} max={100} value={scores.compliance_score} onChange={(e) => setScores({ ...scores, compliance_score: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea id="comments" value={scores.comments} onChange={(e) => setScores({ ...scores, comments: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setScoreBid(null)}>Cancel</Button>
                  <Button type="submit" disabled={scoreLoading}>{scoreLoading ? 'Submitting...' : 'Submit Evaluation'}</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
