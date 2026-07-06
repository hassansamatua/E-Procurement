"use client";

import React, { useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Download } from 'lucide-react';

export default function ProcurementReportsPage() {
  const [reportType, setReportType] = useState('tenders');
  const [format, setFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/reports?type=${reportType}&format=${format}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report. Please check the console.');
    }
    setLoading(false);
  };

  const reportTypes = [
    { value: 'tenders', label: 'Tenders Report' },
    { value: 'bids', label: 'Bids Report' },
    { value: 'evaluations', label: 'Evaluations Report' },
    { value: 'contracts', label: 'Contracts Report' },
    { value: 'suppliers', label: 'Supplier Performance Report' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Procurement Reports</h1>
          <p className="text-muted-foreground">Generate and download procurement reports</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((type) => (
            <Card key={type.value}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText size={18} />
                  {type.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a detailed {type.label.toLowerCase()} for your organization.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setReportType(type.value); handleDownload(); }}
                  disabled={loading}
                >
                  <Download size={16} className="mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Custom Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleDownload} disabled={loading}>
              <Download size={16} className="mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
