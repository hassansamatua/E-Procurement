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
import { UserRole } from '@/types';
import { Gavel, ShieldCheck, BarChart3, FileSignature, Mail, Lock, AlertCircle } from 'lucide-react';

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
  FINANCE_OFFICER: '/finance',
  EVALUATION_OFFICER: '/evaluation',
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden brand-gradient p-12 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-black/20 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <img src="/logo.jpeg" alt="E-Procurement Logo" className="w-12 h-12 rounded-2xl object-cover bg-white/15 backdrop-blur-sm ring-1 ring-white/20" />
          <span className="text-xl font-bold tracking-tight">E-Procurement</span>
        </div>

        <div className="relative space-y-8 max-w-md">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Procurement, reimagined for modern teams.
            </h1>
            <p className="text-white/80 text-lg">
              From request to award to contract — manage the entire procurement lifecycle in one elegant platform.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: <FileSignature size={18} />, title: 'End-to-end workflow', desc: 'Requests, tenders, bids, evaluations & contracts.' },
              { icon: <ShieldCheck size={18} />, title: 'Secure & role-based', desc: 'Granular access control for every stakeholder.' },
              { icon: <BarChart3 size={18} />, title: 'Insightful reporting', desc: 'Real-time dashboards and exportable reports.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="grid place-items-center w-9 h-9 shrink-0 rounded-xl bg-white/15 ring-1 ring-white/20">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-white/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} E-Procurement System. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/logo.jpeg" alt="E-Procurement Logo" className="w-11 h-11 rounded-2xl object-cover shadow-lg" />
            <span className="text-xl font-bold brand-text">E-Procurement</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1.5">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10 h-11"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Are you a supplier?{' '}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Register here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
