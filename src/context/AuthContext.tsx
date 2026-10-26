'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, UserSession, BusinessProfileData } from '@/types';

interface RolePermissions {
  canAccessSettings: boolean;
  canAccessReports: boolean;
  canAccessPOS: boolean;
  canAccessInventory: boolean;
  canAccessExpenses: boolean;
  canManageUsers: boolean;
  canCancelInvoice: boolean;
  canRefundInvoice: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  business: BusinessProfileData | null;
  permissions: RolePermissions | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [business, setBusiness] = useState<BusinessProfileData | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data.user);
          setPermissions(json.data.permissions);
          setBusiness(json.data.business);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session fetch error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSession();
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setPermissions(null);
      router.push('/login');
    }
  };

  const switchRole = async (targetRole: UserRole) => {
    const creds: Record<UserRole, { email: string; pass: string }> = {
      OWNER: { email: 'owner@apexretail.in', pass: 'Admin@123' },
      MANAGER: { email: 'manager@apexretail.in', pass: 'Manager@123' },
      CASHIER: { email: 'cashier@apexretail.in', pass: 'Cashier@123' },
      INVENTORY: { email: 'inventory@apexretail.in', pass: 'Staff@123' },
    };

    const target = creds[targetRole];
    if (target) {
      setLoading(true);
      await login(target.email, target.pass);
      setLoading(false);
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        permissions,
        loading,
        login,
        logout,
        switchRole,
        refreshSession: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
