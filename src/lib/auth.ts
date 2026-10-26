import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole, UserSession } from '@/types';
import { getDatabase } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'billing-pos-inventory-secret-2026';
const TOKEN_COOKIE_NAME = 'retail_auth_token';

export function signToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export function getCurrentUser(request: NextRequest): UserSession | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = verifyToken(token);
    if (session) return session;
  }

  // Check cookie
  const cookieToken = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (cookieToken) {
    const session = verifyToken(cookieToken);
    if (session) return session;
  }

  return null;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete(TOKEN_COOKIE_NAME);
}

// Role permission checks
export const ROLE_PERMISSIONS: Record<UserRole, {
  canAccessSettings: boolean;
  canAccessReports: boolean;
  canAccessPOS: boolean;
  canAccessInventory: boolean;
  canAccessExpenses: boolean;
  canManageUsers: boolean;
  canCancelInvoice: boolean;
  canRefundInvoice: boolean;
}> = {
  OWNER: {
    canAccessSettings: true,
    canAccessReports: true,
    canAccessPOS: true,
    canAccessInventory: true,
    canAccessExpenses: true,
    canManageUsers: true,
    canCancelInvoice: true,
    canRefundInvoice: true,
  },
  MANAGER: {
    canAccessSettings: false,
    canAccessReports: true,
    canAccessPOS: true,
    canAccessInventory: true,
    canAccessExpenses: true,
    canManageUsers: false,
    canCancelInvoice: true,
    canRefundInvoice: true,
  },
  CASHIER: {
    canAccessSettings: false,
    canAccessReports: false,
    canAccessPOS: true,
    canAccessInventory: false,
    canAccessExpenses: false,
    canManageUsers: false,
    canCancelInvoice: false,
    canRefundInvoice: false,
  },
  INVENTORY: {
    canAccessSettings: false,
    canAccessReports: false,
    canAccessPOS: false,
    canAccessInventory: true,
    canAccessExpenses: false,
    canManageUsers: false,
    canCancelInvoice: false,
    canRefundInvoice: false,
  },
};

export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS['OWNER']): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
