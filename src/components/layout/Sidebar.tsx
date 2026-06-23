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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">E-Procurement</h1>
            <p className="text-xs text-gray-500 mt-1">{user.role.replace(/_/g, ' ')}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {user.first_name[0]}{user.last_name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); window.location.href = '/login'; }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
