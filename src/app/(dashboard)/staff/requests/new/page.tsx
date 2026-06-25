"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories?type=procurement&limit=100');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const estimatedAmount = parseFloat(formData.get('estimated_amount') as string);
    
    try {
      await axios.post('/api/procurement-requests', {
        title: formData.get('title'),
        description: formData.get('description'),
        category_id: categoryId || undefined,
        estimated_budget: estimatedAmount > 0 ? estimatedAmount : undefined,
        priority: urgency,
        currency: 'TZS',
      });
      router.push('/staff/requests');
    } catch (error) {
      console.error('Failed to create request:', error);
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.entries(errors).map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`).join('\n');
        alert(`Validation failed:\n${errorMessages}`);
      } else if (axios.isAxiosError(error) && error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to create request. Please check the console for details.');
      }
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Procurement Request</h1>
            <p className="text-muted-foreground">Create a new procurement request</p>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={4} required />
            </div>

            <div>
              <Label htmlFor="category_id">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimated_amount">Estimated Amount (TZS)</Label>
              <Input id="estimated_amount" name="estimated_amount" type="number" required />
            </div>

            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save size={20} className="mr-2" />
                {loading ? 'Saving...' : 'Save Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
