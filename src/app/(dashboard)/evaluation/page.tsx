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
import { FileCheck, ClipboardList, Award, Upload } from 'lucide-react';
import { DashboardStats } from '@/types';

export default function EvaluationDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [evaluationDocument, setEvaluationDocument] = useState<File | null>(null);
  const [winnerBidId, setWinnerBidId] = useState('');
  const [secondRunnerUpId, setSecondRunnerUpId] = useState('');
  const [thirdRunnerUpId, setThirdRunnerUpId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, tendersRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/tenders?status=UNDER_EVALUATION&limit=20'),
      ]);
      setStats(statsRes.data.data);
      setTenders(tendersRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleEvaluate = async (tender: any) => {
    setSelectedTender(tender);
    try {
      const bidsRes = await axios.get(`/api/bids?tender_id=${tender.id}`);
      console.log('Fetched bids:', bidsRes.data.data);
      setBids(bidsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!evaluationDocument || !winnerBidId) {
      setSubmitError('Please upload evaluation document and select a winner');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      // Upload evaluation document
      const formData = new FormData();
      formData.append('file', evaluationDocument);
      formData.append('category', 'evaluation');
      const uploadRes = await axios.post('/api/upload', formData);
      const documentUrl = uploadRes.data.data.url;

      // Submit evaluation results
      await axios.post('/api/evaluation-results', {
        tender_id: selectedTender.id,
        evaluation_document_url: documentUrl,
        winner_bid_id: winnerBidId,
        second_runner_up_bid_id: secondRunnerUpId || null,
        third_runner_up_bid_id: thirdRunnerUpId || null,
        remarks,
      });

      setSelectedTender(null);
      setEvaluationDocument(null);
      setWinnerBidId('');
      setSecondRunnerUpId('');
      setThirdRunnerUpId('');
      setRemarks('');
      fetchData();
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'Failed to submit evaluation');
    }
    setSubmitting(false);
  };

  const columns = [
    { key: 'tender_number', label: 'Tender #' },
    { key: 'title', label: 'Title' },
    { key: 'budget_estimate', label: 'Budget', render: (item: Record<string, unknown>) => item.budget_estimate ? `TZS ${Number(item.budget_estimate).toLocaleString()}` : 'N/A' },
    { key: 'submission_deadline', label: 'Deadline', render: (item: Record<string, unknown>) => new Date(item.submission_deadline as string).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => <Badge variant="outline">{item.status as string}</Badge> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Evaluation Officer Dashboard</h1>
          <p className="text-muted-foreground">Evaluate submitted bids and recommend award decisions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Pending Evaluations" value={tenders.length} icon={<FileCheck size={24} />} />
          <StatsCard title="Total Tenders" value={stats.totalTenders || 0} icon={<ClipboardList size={24} />} />
          <StatsCard title="Total Awards" value={stats.totalContracts || 0} icon={<Award size={24} />} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Tenders Under Evaluation</h2>
          {loading ? (
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          ) : (
            <DataTable
              columns={columns}
              data={tenders as unknown as Record<string, unknown>[]}
              actions={(item) => (
                <Button size="sm" onClick={() => handleEvaluate(item)}>
                  Evaluate
                </Button>
              )}
            />
          )}
        </div>

        <Dialog open={!!selectedTender} onOpenChange={() => setSelectedTender(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Evaluate Tender: {selectedTender?.title}</DialogTitle>
            </DialogHeader>
            {selectedTender && (
              <div className="space-y-4">
                {submitError && (
                  <div className="p-3 text-sm text-white bg-destructive rounded-md">{submitError}</div>
                )}
                <div>
                  <Label htmlFor="document">Evaluation Document (PDF) *</Label>
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setEvaluationDocument(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Upload the committee evaluation report (PDF format)</p>
                </div>
                <div>
                  <Label htmlFor="winner">Select Winner (1st Position) *</Label>
                  <select
                    id="winner"
                    value={winnerBidId}
                    onChange={(e) => setWinnerBidId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select winning bid</option>
                    {bids.map((bid) => (
                      <option key={bid.id} value={bid.id}>
                        {bid.supplier_name} - TZS {Number(bid.bid_amount).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Bid Documents</Label>
                  <div className="mt-2 space-y-2">
                    {bids.map((bid) => (
                      <div key={bid.id} className="p-3 border rounded-md">
                        <p className="font-medium">{bid.supplier_name}</p>
                        {bid.document_urls ? (
                          <div className="mt-1 space-y-1">
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
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="second">Select 2nd Runner-up (Optional)</Label>
                  <select
                    id="second"
                    value={secondRunnerUpId}
                    onChange={(e) => setSecondRunnerUpId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select 2nd position</option>
                    {bids.filter((b) => b.id !== winnerBidId).map((bid) => (
                      <option key={bid.id} value={bid.id}>
                        {bid.supplier_name} - TZS {Number(bid.bid_amount).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="third">Select 3rd Runner-up (Optional)</Label>
                  <select
                    id="third"
                    value={thirdRunnerUpId}
                    onChange={(e) => setThirdRunnerUpId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select 3rd position</option>
                    {bids.filter((b) => b.id !== winnerBidId && b.id !== secondRunnerUpId).map((bid) => (
                      <option key={bid.id} value={bid.id}>
                        {bid.supplier_name} - TZS {Number(bid.bid_amount).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Input
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Additional notes about the evaluation"
                  />
                </div>
                <Button
                  onClick={handleSubmitEvaluation}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? 'Submitting...' : 'Submit Evaluation Results'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
