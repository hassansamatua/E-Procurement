"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SupplierProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      const data = response.data.data;
      setProfile(Array.isArray(data) && data.length > 0 ? data[0] : data || null);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'destructive',
      SUSPENDED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const InfoField = ({ label, value }: { label: string; value?: string | number }) => (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      <p className="font-medium">{value || 'N/A'}</p>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Supplier Profile</h1>
          <p className="text-muted-foreground">View your supplier profile information</p>
        </div>

        {profile ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{profile.company_name}</span>
                {getStatusBadge(profile.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoField label="Company Name" value={profile.company_name} />
                <InfoField label="Contact Person" value={profile.contact_person} />
                <InfoField label="Phone" value={profile.phone} />
                <InfoField label="Email" value={profile.email} />
                <InfoField label="Registration Number" value={profile.registration_number} />
                <InfoField label="TIN Number" value={profile.tin_number} />
                <InfoField label="Country" value={profile.country} />
                <InfoField label="Region" value={profile.region} />
                <InfoField label="District" value={profile.district} />
                <InfoField label="Performance Score" value={profile.performance_score} />
                <div className="md:col-span-2">
                  <InfoField label="Physical Address" value={profile.physical_address} />
                </div>
                <div className="md:col-span-2">
                  <InfoField label="Categories" value={profile.categories} />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No supplier profile found. Please complete your registration.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
