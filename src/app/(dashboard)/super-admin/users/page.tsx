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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { UserRole } from '@/types';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes, orgRes] = await Promise.all([
        axios.get('/api/users?limit=100'),
        axios.get('/api/roles'),
        axios.get('/api/organizations'),
      ]);
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
      setOrganizations(orgRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await axios.post('/api/users', {
        email: formData.get('email'),
        password: formData.get('password'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        phone: formData.get('phone'),
        role_id: formData.get('role_id'),
        organization_id: formData.get('organization_id') || null,
        department: formData.get('department'),
      });
      setIsCreateOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`/api/users?id=${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getRoleBadge = (roleName: string) => {
    const colors: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      SUPER_ADMIN: 'destructive',
      ADMIN: 'warning',
      STAFF: 'default',
      HOD: 'info',
      PROCUREMENT_OFFICER: 'success',
      ACCOUNTING_OFFICER: 'info',
      SUPPLIER: 'default',
    };
    return <Badge variant={colors[roleName] || 'default'}>{roleName.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'role_name', label: 'Role', render: (item: Record<string, unknown>) => getRoleBadge(item.role_name as string) },
    { key: 'department', label: 'Department' },
    { key: 'is_active', label: 'Status', render: (item: Record<string, unknown>) => 
      item.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users Management</h1>
            <p className="text-muted-foreground">Manage system users and their roles</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={20} className="mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" name="first_name" required />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" name="last_name" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div>
                  <Label htmlFor="role_id">Role</Label>
                  <Select name="role_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="organization_id">Organization</Label>
                  <Select name="organization_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" name="department" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit">Create User</Button>
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
            data={users}
            actions={(item) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost">
                  <Edit size={16} />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(item.id as string)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
