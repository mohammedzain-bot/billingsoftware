'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('owner@apexretail.in');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setError(res.message || 'Invalid credentials');
    }
  };

  const setDemoCredentials = (role: UserRole) => {
    setError(null);
    if (role === 'OWNER') {
      setEmail('owner@apexretail.in');
      setPassword('Admin@123');
    } else if (role === 'MANAGER') {
      setEmail('manager@apexretail.in');
      setPassword('Manager@123');
    } else if (role === 'CASHIER') {
      setEmail('cashier@apexretail.in');
      setPassword('Cashier@123');
    } else if (role === 'INVENTORY') {
      setEmail('inventory@apexretail.in');
      setPassword('Staff@123');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-brand-700 flex items-center justify-center text-white shadow-sm">
            <Store className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-charcoal-900">
          Apex Retail POS
        </h2>
        <p className="mt-1 text-center text-sm text-charcoal-500">
          Professional Billing & Inventory Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-charcoal-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@apexretail.in"
                  className="block w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg text-sm placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 border border-charcoal-200 rounded-lg text-sm placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-400 hover:text-charcoal-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 transition-colors disabled:opacity-50"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  <span>Sign into Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher helper */}
          <div className="mt-8 pt-6 border-t border-charcoal-100">
            <div className="flex items-center gap-1.5 text-xs text-charcoal-500 font-medium mb-3">
              <ShieldCheck className="w-4 h-4 text-brand-700" />
              <span>Select Role for Evaluation:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials('OWNER')}
                className="p-2 border border-charcoal-200 rounded-lg text-left hover:border-brand-600 hover:bg-brand-50 transition-colors"
              >
                <div className="font-semibold text-charcoal-800">Owner</div>
                <div className="text-[11px] text-charcoal-500">All permissions</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('MANAGER')}
                className="p-2 border border-charcoal-200 rounded-lg text-left hover:border-brand-600 hover:bg-brand-50 transition-colors"
              >
                <div className="font-semibold text-charcoal-800">Store Manager</div>
                <div className="text-[11px] text-charcoal-500">Sales & reports</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('CASHIER')}
                className="p-2 border border-charcoal-200 rounded-lg text-left hover:border-brand-600 hover:bg-brand-50 transition-colors"
              >
                <div className="font-semibold text-charcoal-800">Cashier</div>
                <div className="text-[11px] text-charcoal-500">Fast POS billing</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('INVENTORY')}
                className="p-2 border border-charcoal-200 rounded-lg text-left hover:border-brand-600 hover:bg-brand-50 transition-colors"
              >
                <div className="font-semibold text-charcoal-800">Inventory Staff</div>
                <div className="text-[11px] text-charcoal-500">Stock & purchases</div>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-charcoal-400">
          GST-ready Retail & POS Engine • Compliant with Indian Retail Standards
        </p>
      </div>
    </div>
  );
}
