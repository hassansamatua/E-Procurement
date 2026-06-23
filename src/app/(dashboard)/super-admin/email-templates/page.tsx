"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Mail } from 'lucide-react';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/email-templates?limit=100');
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
    setLoading(false);
  };

  const handleCreateTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await axios.post('/api/email-templates', {
        name: formData.get('name'),
        subject: formData.get('subject'),
        body: formData.get('body'),
        variables: formData.get('variables') ? formData.get('variables')?.toString().split(',').map((v: string) => v.trim()) : [],
        is_active: formData.get('is_active') === 'true',
      });
      setIsCreateOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await axios.patch('/api/email-templates', {
        templateId: selectedTemplate.id,
        name: formData.get('name'),
        subject: formData.get('subject'),
        body: formData.get('body'),
        variables: formData.get('variables') ? formData.get('variables')?.toString().split(',').map((v: string) => v.trim()) : [],
        is_active: formData.get('is_active') === 'true',
      });
      setIsEditOpen(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await axios.delete(`/api/email-templates?id=${id}`);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setIsEditOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Template Name' },
    { key: 'subject', label: 'Subject' },
    { key: 'variables', label: 'Variables', render: (item: Record<string, unknown>) => {
      const vars = item.variables as string;
      return vars ? vars.split(',').join(', ') : 'N/A';
    }},
    { key: 'is_active', label: 'Status', render: (item: Record<string, unknown>) => 
      item.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground">Manage email notification templates</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={20} className="mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Template</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" required />
                </div>
                <div>
                  <Label htmlFor="body">Body</Label>
                  <Textarea id="body" name="body" rows={8} required />
                </div>
                <div>
                  <Label htmlFor="variables">Variables (comma-separated)</Label>
                  <Input id="variables" name="variables" placeholder="e.g., recipient_name, tender_number" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="is_active" name="is_active" defaultChecked />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Template</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={templates}
            actions={(item) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                  <Edit size={16} />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteTemplate(item.id as string)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          />
        )}

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Email Template</DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <form onSubmit={handleUpdateTemplate} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Template Name</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedTemplate.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-subject">Subject</Label>
                  <Input id="edit-subject" name="subject" defaultValue={selectedTemplate.subject} required />
                </div>
                <div>
                  <Label htmlFor="edit-body">Body</Label>
                  <Textarea id="edit-body" name="body" rows={8} defaultValue={selectedTemplate.body} required />
                </div>
                <div>
                  <Label htmlFor="edit-variables">Variables (comma-separated)</Label>
                  <Input id="edit-variables" name="variables" defaultValue={selectedTemplate.variables} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="edit-is_active" name="is_active" defaultChecked={selectedTemplate.is_active} />
                  <Label htmlFor="edit-is_active">Active</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit">Update Template</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
