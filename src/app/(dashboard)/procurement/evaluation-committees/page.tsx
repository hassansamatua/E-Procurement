"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Trash2 } from 'lucide-react';

export default function EvaluationCommitteesPage() {
  const [committees, setCommittees] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [committeesRes, tendersRes, usersRes] = await Promise.all([
        axios.get('/api/evaluation-committees?limit=100'),
        axios.get('/api/tenders?limit=100'),
        axios.get('/api/users?limit=100'),
      ]);
      setCommittees(committeesRes.data.data || []);
      setTenders(tendersRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleCreateCommittee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await axios.post('/api/evaluation-committees', {
        tender_id: formData.get('tender_id'),
        name: formData.get('name'),
        members: selectedMembers.map(userId => ({ user_id: userId, role: 'MEMBER' })),
      });
      setIsCreateOpen(false);
      setSelectedMembers([]);
      fetchData();
    } catch (error) {
      console.error('Failed to create committee:', error);
    }
  };

  const handleDeleteCommittee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this committee?')) return;
    
    try {
      await axios.patch('/api/evaluation-committees', { committeeId: id, action: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete committee:', error);
    }
  };

  const columns = [
    { key: 'name', label: 'Committee Name' },
    { key: 'tender_title', label: 'Tender' },
    { key: 'tender_number', label: 'Tender #' },
    { key: 'member_count', label: 'Members' },
    { key: 'created_at', label: 'Created', render: (item: Record<string, unknown>) => new Date(item.created_at as string).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Evaluation Committees</h1>
            <p className="text-muted-foreground">Manage tender evaluation committees</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={20} className="mr-2" />
                Create Committee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Evaluation Committee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCommittee} className="space-y-4">
                <div>
                  <Label htmlFor="name">Committee Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="tender_id">Tender</Label>
                  <Select name="tender_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tender" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenders.map((tender) => (
                        <SelectItem key={tender.id} value={tender.id}>{tender.tender_number} - {tender.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Members</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={selectedMembers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, user.id]);
                            } else {
                              setSelectedMembers(selectedMembers.filter(id => id !== user.id));
                            }
                          }}
                        />
                        <label htmlFor={`user-${user.id}`} className="text-sm">
                          {user.first_name} {user.last_name} ({user.role_name})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Committee</Button>
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
            data={committees}
            actions={(item) => (
              <Button size="sm" variant="destructive" onClick={() => handleDeleteCommittee(item.id as string)}>
                <Trash2 size={16} />
              </Button>
            )}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
