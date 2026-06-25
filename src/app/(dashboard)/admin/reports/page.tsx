"use client";

import React, { useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText } from 'lucide-react';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'suppliers', label: 'Suppliers Report' },
    { value: 'tenders', label: 'Tenders Report' },
    { value: 'bids', label: 'Bids Report' },
    { value: 'contracts', label: 'Contracts Report' },
    { value: 'organizations', label: 'Organizations Report' },
  ];

  const handleGenerateReport = async () => {
    if (!reportType) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/reports?type=${reportType}&format=${format}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and download system reports</p>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="reportType">
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
            <div>
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={(v: 'pdf' | 'excel') => setFormat(v)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateReport} disabled={loading || !reportType}>
              {loading ? 'Generating...' : (
                <>
                  <Download size={20} className="mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Available Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTypes.map((type) => (
              <div key={type.value} className="border rounded-lg p-4 hover:border-emerald-500 transition-colors cursor-pointer" onClick={() => setReportType(type.value)}>
                <div className="flex items-center gap-3">
                  <FileText className="text-emerald-600" size={24} />
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-muted-foreground">Click to select</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
