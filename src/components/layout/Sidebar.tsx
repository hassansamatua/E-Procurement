"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, Building2, Package, FileText, Gavel,
  ClipboardCheck, FileSignature, Bell, BarChart3, Shield, Settings,
  Truck, FolderOpen, Star, LogOut, Menu, X
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const roleNavItems: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Dashboard', href: '/super-admin', icon: <LayoutDashboard size={20} /> },
    { label: 'Organizations', href: '/super-admin/organizations', icon: <Building2 size={20} /> },
    { label: 'Users', href: '/super-admin/users', icon: <Users size={20} /> },
    { label: 'Suppliers', href: '/super-admin/suppliers', icon: <Truck size={20} /> },
    { label: 'Categories', href: '/super-admin/categories', icon: <FolderOpen size={20} /> },
    { label: 'Reports', href: '/super-admin/reports', icon: <BarChart3 size={20} /> },
    { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: <Shield size={20} /> },
    { label: 'Settings', href: '/super-admin/settings', icon: <Settings size={20} /> },
  ],
  ADMIN: [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
    { label: 'Suppliers', href: '/admin/suppliers', icon: <Truck size={20} /> },
    { label: 'Tenders', href: '/admin/tenders', icon: <Gavel size={20} /> },
    { label: 'Categories', href: '/admin/categories', icon: <FolderOpen size={20} /> },
    { label: 'Notifications', href: '/admin/notifications', icon: <Bell size={20} /> },
    { label: 'Reports', href: '/admin/reports', icon: <BarChart3 size={20} /> },
  ],
  STAFF: [
    { label: 'Dashboard', href: '/staff', icon: <LayoutDashboard size={20} /> },
    { label: 'My Requests', href: '/staff/requests', icon: <FileText size={20} /> },
    { label: 'New Request', href: '/staff/requests/new', icon: <Package size={20} /> },
    { label: 'Notifications', href: '/staff/notifications', icon: <Bell size={20} /> },
  ],
  HOD: [
    { label: 'Dashboard', href: '/hod', icon: <LayoutDashboard size={20} /> },
    { label: 'Pending Approvals', href: '/hod/approvals', icon: <ClipboardCheck size={20} /> },
    { label: 'All Requests', href: '/hod/requests', icon: <FileText size={20} /> },
    { label: 'Notifications', href: '/hod/notifications', icon: <Bell size={20} /> },
  ],
  PROCUREMENT_OFFICER: [
    { label: 'Dashboard', href: '/procurement', icon: <LayoutDashboard size={20} /> },
    { label: 'Requests', href: '/procurement/requests', icon: <FileText size={20} /> },
    { label: 'Tenders', href: '/procurement/tenders', icon: <Gavel size={20} /> },
    { label: 'Evaluations', href: '/procurement/evaluations', icon: <ClipboardCheck size={20} /> },
    { label: 'Contracts', href: '/procurement/contracts', icon: <FileSignature size={20} /> },
    { label: 'Ratings', href: '/procurement/ratings', icon: <Star size={20} /> },
    { label: 'Reports', href: '/procurement/reports', icon: <BarChart3 size={20} /> },
    { label: 'Notifications', href: '/procurement/notifications', icon: <Bell size={20} /> },
  ],
  ACCOUNTING_OFFICER: [
    { label: 'Dashboard', href: '/accounting', icon: <LayoutDashboard size={20} /> },
    { label: 'Pending Approvals', href: '/accounting/approvals', icon: <ClipboardCheck size={20} /> },
    { label: 'Requests', href: '/accounting/requests', icon: <FileText size={20} /> },
    { label: 'Notifications', href: '/accounting/notifications', icon: <Bell size={20} /> },
  ],
  FINANCE_OFFICER: [
    { label: 'Dashboard', href: '/finance', icon: <LayoutDashboard size={20} /> },
    { label: 'Pending Budget Approvals', href: '/finance', icon: <ClipboardCheck size={20} /> },
    { label: 'Active Contracts', href: '/finance', icon: <FileSignature size={20} /> },
    { label: 'Payment History', href: '/finance', icon: <FileText size={20} /> },
  ],
  SUPPLIER: [
    { label: 'Dashboard', href: '/supplier', icon: <LayoutDashboard size={20} /> },
    { label: 'Available Tenders', href: '/supplier/tenders', icon: <Gavel size={20} /> },
    { label: 'My Bids', href: '/supplier/bids', icon: <FileText size={20} /> },
    { label: 'Contracts', href: '/supplier/contracts', icon: <FileSignature size={20} /> },
    { label: 'Notifications', href: '/supplier/notifications', icon: <Bell size={20} /> },
    { label: 'Profile', href: '/supplier/profile', icon: <Users size={20} /> },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) return null;

  const navItems = roleNavItems[user.role] || [];

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-3.5 left-4 z-50 p-2.5 glass border border-sidebar-border rounded-xl shadow-sm text-foreground"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 h-[100px] flex items-center gap-5 border-b border-sidebar-border">
            <img src="/logo.jpeg" alt="E-Procurement Logo" className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight brand-text">E-Procurement</h1>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase truncate">
                {user.role.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Menu
            </p>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground hover:translate-x-0.5"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full brand-gradient transition-opacity",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className={cn("transition-colors", active ? "text-primary" : "group-hover:text-primary")}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-2 p-2 rounded-xl">
              <div className="w-9 h-9 rounded-full brand-gradient p-[2px] shrink-0">
                <div className="w-full h-full rounded-full bg-card grid place-items-center">
                  <span className="text-xs font-bold brand-text">
                    {user.first_name[0]}{user.last_name[0]}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); window.location.href = '/login'; }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
