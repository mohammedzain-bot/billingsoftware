'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  ShoppingCart,
  LogOut,
  User as UserIcon,
  Clock,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onOpenMobile: () => void;
}

export default function Navbar({ onOpenMobile }: NavbarProps) {
  const { user, logout, switchRole, permissions } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'OWNER', label: 'Owner (Rajesh)', desc: 'Full store access & settings' },
    { role: 'MANAGER', label: 'Manager (Neha)', desc: 'Sales, stock & reports' },
    { role: 'CASHIER', label: 'Cashier (Vikas)', desc: 'POS billing & payments' },
    { role: 'INVENTORY', label: 'Inventory (Anil)', desc: 'Products, stock & purchases' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-charcoal-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & breadcrumb/title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 text-charcoal-600 hover:text-charcoal-900 rounded-lg hover:bg-charcoal-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-charcoal-600 bg-charcoal-50 px-3 py-1.5 rounded-md border border-charcoal-200">
          <Clock className="w-3.5 h-3.5 text-charcoal-400" />
          <span>{currentTime || 'Retail Terminal'}</span>
        </div>
      </div>

      {/* Right: Quick POS button, Quick Role Switcher, User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick POS action button */}
        {permissions?.canAccessPOS && (
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-md text-xs sm:text-sm font-semibold transition-colors shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Bill</span>
          </Link>
        )}

        {/* Role Switcher Pill (Great for pair programming / demo evaluation) */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-charcoal-50 hover:bg-charcoal-100 border border-charcoal-200 rounded-md text-xs font-medium text-charcoal-700 transition-colors"
            title="Switch demo user role"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-700" />
            <span className="hidden md:inline text-charcoal-500">Switch:</span>
            <span className="font-semibold text-charcoal-800">{user?.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-charcoal-400" />
          </button>

          {roleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setRoleDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-charcoal-200 rounded-lg shadow-lg py-1 z-40 text-xs">
                <div className="px-3 py-1.5 border-b border-charcoal-100 text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">
                  Test Role Permissions
                </div>
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setRoleDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 flex flex-col hover:bg-charcoal-50 transition-colors',
                      user?.role === r.role && 'bg-brand-50 text-brand-900 font-medium'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{r.label}</span>
                      {user?.role === r.role && (
                        <span className="text-[10px] text-brand-700 font-bold">Active</span>
                      )}
                    </div>
                    <span className="text-[11px] text-charcoal-500">{r.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-charcoal-200">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-charcoal-800 leading-tight">
              {user?.name || 'Staff User'}
            </span>
            <span className="text-[10px] text-charcoal-500 font-medium">
              {user?.role}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-charcoal-100 border border-charcoal-200 flex items-center justify-center text-charcoal-700">
            <UserIcon className="w-4 h-4" />
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-charcoal-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
