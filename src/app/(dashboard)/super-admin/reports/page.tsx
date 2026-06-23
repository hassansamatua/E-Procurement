"use client";

import React, { useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Download } from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('tenders');
  const [format, setFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const reportTypes = [
    { value: 'tenders', label: 'Tenders Report' },
    { value: 'bids', label: 'Bids Report' },
    { value: 'contracts', label: 'Contracts Report' },
    { value: 'suppliers', label: 'Suppliers Report' },
    { value: 'evaluations', label: 'Evaluations Report' },
    { value: 'procurement', label: 'Procurement Report' },
    { value: 'performance', label: 'Supplier Performance Report' },
    { value: 'audit', label: 'Audit Log Report' },
  ];

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        format,
      });
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await axios.get(`/api/reports?${params}`, {
        responseType: format === 'pdf' ? 'blob' : 'arraybuffer',
      });

      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
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
                  <SelectValue />
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
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
              {loading ? (
                'Generating...'
              ) : (
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
                    <p className="text-sm text-gray-500">Click to select</p>
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
