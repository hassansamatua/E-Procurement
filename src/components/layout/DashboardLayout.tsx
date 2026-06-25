"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuthStore, setupAxiosInterceptors } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Bell, Moon, Sun } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setupAxiosInterceptors();
  }, []);

  React.useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl brand-gradient grid place-items-center shadow-lg animate-pulse">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/30 border-t-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-chart-2/10 blur-3xl" />
      </div>

      <Sidebar />
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 glass border-b border-border/70">
          <div className="flex items-center justify-between px-4 sm:px-6 h-[73px]">
            <div className="flex items-center gap-3 pl-12 lg:pl-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  Welcome back, {user?.first_name}
                </h2>
                <p className="hidden sm:block text-xs text-muted-foreground">
                  Here&apos;s what&apos;s happening today
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="grid place-items-center w-10 h-10 text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent transition-colors"
              >
                {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              <button
                aria-label="Notifications"
                className="relative grid place-items-center w-10 h-10 text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent transition-colors"
              >
                <Bell size={19} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main key={typeof window !== 'undefined' ? window.location.pathname : 'page'} className="p-4 sm:p-6 animate-slide-up">
          {children}
        </main>
      </div>
    </div>
  );
}
