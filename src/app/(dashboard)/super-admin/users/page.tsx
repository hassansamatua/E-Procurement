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
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    role_id: '',
    organization_id: '',
    department: '',
  });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

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
    setCreateError('');
    setCreateLoading(true);

    try {
      await axios.post('/api/users', {
        ...createForm,
        organization_id: createForm.organization_id || null,
      });
      setCreateForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        role_id: '',
        organization_id: '',
        department: '',
      });
      setIsCreateOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setCreateError(error.response?.data?.message || 'Failed to create user');
    }
    setCreateLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`/api/users?id=${id}`);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditError('');
    setIsEditOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError('');
    setEditLoading(true);

    try {
      await axios.patch('/api/users', {
        id: selectedUser.id,
        first_name: selectedUser.first_name,
        last_name: selectedUser.last_name,
        phone: selectedUser.phone,
        department: selectedUser.department,
        role_id: selectedUser.role_id,
        organization_id: selectedUser.organization_id || null,
        is_active: selectedUser.is_active,
        is_suspended: selectedUser.is_suspended,
      });
      setIsEditOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      setEditError(error.response?.data?.message || 'Failed to update user');
    }
    setEditLoading(false);
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
                {createError && (
                  <div className="p-3 text-sm text-white bg-destructive rounded-md">{createError}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="role_id">Role</Label>
                  <Select value={createForm.role_id} onValueChange={(value) => setCreateForm({ ...createForm, role_id: value })} required>
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
                  <Select value={createForm.organization_id} onValueChange={(value) => setCreateForm({ ...createForm, organization_id: value })}>
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
                  <Input id="department" value={createForm.department} onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createLoading}>{createLoading ? 'Creating...' : 'Create User'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              {selectedUser && (
                <form onSubmit={handleEditUser} className="space-y-4">
                  {editError && (
                    <div className="p-3 text-sm text-white bg-destructive rounded-md">{editError}</div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_first_name">First Name</Label>
                      <Input id="edit_first_name" value={selectedUser.first_name} onChange={(e) => setSelectedUser({ ...selectedUser, first_name: e.target.value })} required />
                    </div>
                    <div>
                      <Label htmlFor="edit_last_name">Last Name</Label>
                      <Input id="edit_last_name" value={selectedUser.last_name} onChange={(e) => setSelectedUser({ ...selectedUser, last_name: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit_phone">Phone</Label>
                    <Input id="edit_phone" value={selectedUser.phone || ''} onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="edit_department">Department</Label>
                    <Input id="edit_department" value={selectedUser.department || ''} onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="edit_role_id">Role</Label>
                    <Select value={selectedUser.role_id} onValueChange={(value) => setSelectedUser({ ...selectedUser, role_id: value })}>
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
                    <Label htmlFor="edit_organization_id">Organization</Label>
                    <Select value={selectedUser.organization_id || ''} onValueChange={(value) => setSelectedUser({ ...selectedUser, organization_id: value })}>
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
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedUser.is_active}
                        onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedUser.is_suspended}
                        onChange={(e) => setSelectedUser({ ...selectedUser, is_suspended: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">Suspended</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</Button>
                  </div>
                </form>
              )}
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
                <Button size="sm" variant="ghost" onClick={() => openEditDialog(item)}>
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
