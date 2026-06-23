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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Send, Inbox, SendHorizontal, MailOpen } from 'lucide-react';

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox');

  useEffect(() => {
    fetchData();
  }, [folder]);

  const fetchData = async () => {
    try {
      const [messagesRes, usersRes] = await Promise.all([
        axios.get(`/api/messages?folder=${folder}&limit=100`),
        axios.get('/api/users?limit=100'),
      ]);
      setMessages(messagesRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await axios.post('/api/messages', {
        receiver_id: formData.get('receiver_id'),
        subject: formData.get('subject'),
        body: formData.get('body'),
      });
      setIsComposeOpen(false);
      if (folder === 'sent') {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await axios.patch('/api/messages', { messageId, action: 'MARK_READ' });
      fetchData();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const columns = [
    { key: 'sender_name', label: 'From', render: (item: Record<string, unknown>) => folder === 'inbox' ? (item.sender_name as string) : (item.receiver_name as string) },
    { key: 'subject', label: 'Subject' },
    { key: 'body', label: 'Message', render: (item: Record<string, unknown>) => (item.body as string).substring(0, 50) + '...' },
    { key: 'is_read', label: 'Status', render: (item: Record<string, unknown>) => 
      item.is_read ? <Badge variant="default">Read</Badge> : <Badge variant="success">Unread</Badge>
    },
    { key: 'created_at', label: 'Date', render: (item: Record<string, unknown>) => new Date(item.created_at as string).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Internal messaging system</p>
          </div>
          <div className="flex gap-2">
            <Select value={folder} onValueChange={(v: 'inbox' | 'sent') => setFolder(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbox">
                  <div className="flex items-center gap-2">
                    <Inbox size={16} />
                    Inbox
                  </div>
                </SelectItem>
                <SelectItem value="sent">
                  <div className="flex items-center gap-2">
                    <SendHorizontal size={16} />
                    Sent
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={20} className="mr-2" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Compose Message</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <Label htmlFor="receiver_id">To</Label>
                    <Select name="receiver_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" required />
                  </div>
                  <div>
                    <Label htmlFor="body">Message</Label>
                    <Textarea id="body" name="body" rows={6} required />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
                    <Button type="submit">
                      <Send size={16} className="mr-2" />
                      Send
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={messages}
            actions={(item) => (
              folder === 'inbox' && !item.is_read && (
                <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(item.id as string)}>
                  <MailOpen size={16} />
                </Button>
              )
            )}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
