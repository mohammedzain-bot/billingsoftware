'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Users,
  Truck,
  TrendingDown,
  BarChart3,
  Settings,
  ShieldCheck,
  Store,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, business } = useAuth();

  const role = user?.role || 'CASHIER';

  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY'],
    },
    {
      title: 'Point of Sale (POS)',
      href: '/pos',
      icon: ShoppingCart,
      roles: ['OWNER', 'MANAGER', 'CASHIER'],
      highlight: true,
    },
    {
      title: 'Invoices & Sales',
      href: '/invoices',
      icon: Receipt,
      roles: ['OWNER', 'MANAGER', 'CASHIER'],
    },
    {
      title: 'Products & Inventory',
      href: '/products',
      icon: Package,
      roles: ['OWNER', 'MANAGER', 'INVENTORY'],
    },
    {
      title: 'Customers & Credit',
      href: '/customers',
      icon: Users,
      roles: ['OWNER', 'MANAGER', 'CASHIER'],
    },
    {
      title: 'Purchases & Vendors',
      href: '/purchases',
      icon: Truck,
      roles: ['OWNER', 'MANAGER', 'INVENTORY'],
    },
    {
      title: 'Expense Tracker',
      href: '/expenses',
      icon: TrendingDown,
      roles: ['OWNER', 'MANAGER'],
    },
    {
      title: 'Reports & Analytics',
      href: '/reports',
      icon: BarChart3,
      roles: ['OWNER', 'MANAGER'],
    },
    {
      title: 'Store Settings',
      href: '/settings',
      icon: Settings,
      roles: ['OWNER'],
    },
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(role));

  const roleColors: Record<UserRole, string> = {
    OWNER: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    MANAGER: 'bg-blue-50 text-blue-800 border-blue-200',
    CASHIER: 'bg-amber-50 text-amber-800 border-amber-200',
    INVENTORY: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-charcoal-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-charcoal-200 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-700 flex items-center justify-center text-white shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-charcoal-900 tracking-tight leading-tight">
                {business?.name?.split(' ')[0] || 'Apex'} Retail
              </span>
              <span className="text-[11px] font-medium text-charcoal-500">
                Billing & Inventory
              </span>
            </div>
          </Link>

          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-charcoal-500 hover:text-charcoal-800 rounded-md hover:bg-charcoal-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current Role Banner */}
        <div className="px-4 py-2.5 bg-charcoal-50 border-b border-charcoal-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-charcoal-500" />
            <span className="text-xs text-charcoal-600 font-medium">Logged Role:</span>
          </div>
          <span
            className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded-full border tracking-wide uppercase',
              roleColors[role]
            )}
          >
            {role}
          </span>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allowedItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-800 font-semibold'
                    : 'text-charcoal-700 hover:bg-charcoal-100 hover:text-charcoal-900',
                  item.highlight && !isActive && 'text-brand-700 font-medium'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4',
                    isActive ? 'text-brand-700' : 'text-charcoal-500'
                  )}
                />
                <span>{item.title}</span>
                {item.highlight && (
                  <span className="ml-auto text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded font-bold">
                    POS
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Store Info */}
        <div className="p-4 border-t border-charcoal-200 bg-white">
          <div className="text-xs text-charcoal-600 flex flex-col gap-0.5">
            <span className="font-semibold text-charcoal-800 truncate">
              {business?.name || 'Apex Supermart'}
            </span>
            <span className="text-[11px] text-charcoal-500 truncate">
              GST: {business?.gstin || '27AABCU9603R1ZM'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
