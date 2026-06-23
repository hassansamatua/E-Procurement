"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const roleRoutes: Record<UserRole, string> = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  STAFF: '/staff',
  HOD: '/hod',
  PROCUREMENT_OFFICER: '/procurement',
  ACCOUNTING_OFFICER: '/accounting',
  SUPPLIER: '/supplier',
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
      const state = useAuthStore.getState();
      if (state.user) {
        router.push(roleRoutes[state.user.role] || '/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)'}}>
      <Card className="w-full max-w-md rounded-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold" style={{color:'#1B5E20'}}>E-Procurement System</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm hover:underline" style={{color:'#1B5E20'}}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} style={{backgroundColor:'#1B5E20', color:'#FFFFFF'}}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-gray-500">
              Are you a supplier?{' '}
              <Link href="/register" className="hover:underline font-medium" style={{color:'#1B5E20'}}>
                Register here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
