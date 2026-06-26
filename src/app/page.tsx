"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import { UserRole } from '@/types';

const roleRoutes: Record<UserRole, string> = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  STAFF: '/staff',
  HOD: '/hod',
  PROCUREMENT_OFFICER: '/procurement',
  ACCOUNTING_OFFICER: '/accounting',
  FINANCE_OFFICER: '/finance',
  EVALUATION_OFFICER: '/evaluation',
  EVALUATOR: '/evaluation',
  SUPPLIER: '/supplier',
};

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(roleRoutes[user.role] || '/login');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
