'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Users,
  FileText,
  Shield,
  Printer,
  Database,
  Save,
  Plus,
  Edit,
  X,
  Download,
  Upload,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user, permissions, refreshSession } = useAuth();

  const [activeTab, setActiveTab] = useState<'store' | 'billing' | 'users' | 'audit' | 'backup'>('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Store profile form
  const [storeForm, setStoreForm] = useState<any>({});
  const [originalStore, setOriginalStore] = useState<any>({});

  // Users management
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    name: '', email: '', password: '', role: 'CASHIER', phone: '',
  });
  const [editUserForm, setEditUserForm] = useState<any>({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success) {
        setStoreForm({ ...json.data.business });
        setOriginalStore({ ...json.data.business });
        setAuditLogs(json.data.auditLogs || []);
      }

      if (user?.role === 'OWNER') {
        const usersRes = await fetch('/api/users');
        const usersJson = await usersRes.json();
        if (usersJson.success) setUsers(usersJson.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeForm),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Business settings saved successfully!');
        refreshSession();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddUser(false);
        setUserForm({ name: '', email: '', password: '', role: 'CASHIER', phone: '' });
        fetchSettings();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editUser.id, ...editUserForm }),
      });
      const json = await res.json();
      if (json.success) {
        setEditUser(null);
        fetchSettings();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleUserActive = async (u: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, active: !u.active }),
      });
      const json = await res.json();
      if (json.success) fetchSettings();
      else alert(json.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('WARNING: This will completely overwrite all current store data. Are you absolutely sure?')) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg('Database restored from backup successfully!');
        fetchSettings();
      } else {
        alert(result.message);
      }
    } catch (err: any) {
      alert('Invalid backup file: ' + err.message);
    }
  };

  const tabs = [
    { id: 'store', label: 'Store Profile', icon: Store },
    { id: 'billing', label: 'Invoice & Tax', icon: FileText },
    { id: 'users', label: 'Staff Accounts', icon: Users },
    { id: 'audit', label: 'Activity Logs', icon: Activity },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
  ];

  if (loading) {
    return (
      <div className="py-16 text-center text-charcoal-400 text-sm">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
          Store Settings & Configuration
        </h1>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Manage your business profile, billing preferences, and employee access
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 border-b border-charcoal-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === t.id
                  ? 'border-brand-700 text-brand-700 font-semibold'
                  : 'border-transparent text-charcoal-500 hover:text-charcoal-900'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ===== STORE PROFILE TAB ===== */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStore} className="bg-white rounded-xl border border-charcoal-200 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-charcoal-900 pb-3 border-b border-charcoal-100">
            Business Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {[
              { key: 'name', label: 'Store / Business Name *', type: 'text', required: true },
              { key: 'tagline', label: 'Tagline / Slogan', type: 'text' },
              { key: 'gstin', label: 'GSTIN Number', type: 'text' },
              { key: 'phone', label: 'Contact Phone *', type: 'text', required: true },
              { key: 'email', label: 'Business Email *', type: 'email', required: true },
              { key: 'address', label: 'Shop Address *', type: 'text', required: true },
              { key: 'city', label: 'City *', type: 'text', required: true },
              { key: 'state', label: 'State', type: 'text' },
              { key: 'pincode', label: 'PIN Code', type: 'text' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block font-semibold text-charcoal-700 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  required={field.required}
                  value={storeForm[field.key] || ''}
                  onChange={(e) => setStoreForm({ ...storeForm, [field.key]: e.target.value })}
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>
            ))}
          </div>

          <div className="text-xs space-y-3">
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Return & Exchange Policy</label>
              <textarea
                rows={2}
                value={storeForm.returnPolicy || ''}
                onChange={(e) => setStoreForm({ ...storeForm, returnPolicy: e.target.value })}
                className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Terms & Conditions (Invoice Footer)</label>
              <textarea
                rows={2}
                value={storeForm.termsAndConditions || ''}
                onChange={(e) => setStoreForm({ ...storeForm, termsAndConditions: e.target.value })}
                className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-charcoal-100 flex justify-end">
            <button
              type="submit"
              disabled={saving || user?.role !== 'OWNER'}
              className="flex items-center gap-1.5 px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Store Settings'}
            </button>
          </div>
        </form>
      )}

      {/* ===== BILLING & TAX TAB ===== */}
      {activeTab === 'billing' && (
        <form onSubmit={handleSaveStore} className="bg-white rounded-xl border border-charcoal-200 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-charcoal-900 pb-3 border-b border-charcoal-100">
            Invoice Numbering & Tax Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={storeForm.invoicePrefix || 'INV-'}
                onChange={(e) => setStoreForm({ ...storeForm, invoicePrefix: e.target.value })}
                className="w-full border border-charcoal-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Next Invoice Number (Counter)
              </label>
              <input
                type="number"
                value={storeForm.invoiceCounter || 1001}
                onChange={(e) => setStoreForm({ ...storeForm, invoiceCounter: Number(e.target.value) })}
                className="w-full border border-charcoal-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-brand-600"
              />
              <span className="text-[11px] text-charcoal-500">
                Next invoice: {storeForm.invoicePrefix || 'INV-'}{storeForm.invoiceCounter || 1001}
              </span>
            </div>
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Default GST Tax Rate (%)
              </label>
              <select
                value={storeForm.defaultTaxRate || 18}
                onChange={(e) => setStoreForm({ ...storeForm, defaultTaxRate: Number(e.target.value) })}
                className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
              >
                <option value={0}>0% (Exempted / Nil rated)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST (Standard)</option>
                <option value={28}>28% GST (Luxury)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Preferred Print Size
              </label>
              <select
                value={storeForm.printPaperSize || 'A4'}
                onChange={(e) => setStoreForm({ ...storeForm, printPaperSize: e.target.value })}
                className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
              >
                <option value="A4">A4 (Full Tax Invoice)</option>
                <option value="THERMAL_80MM">Thermal 80mm Receipt</option>
              </select>
            </div>
          </div>

          <div className="bg-charcoal-50 rounded-xl border border-charcoal-200 p-4 text-xs text-charcoal-600 space-y-1">
            <p className="font-bold text-charcoal-900">GST Tax Invoice Settings:</p>
            <p>• Intrastate sales use CGST + SGST split (each half of the applicable slab rate)</p>
            <p>• All invoices record item-level tax rates at the time of billing (historical snapshot)</p>
            <p>• GST Summary report generates GSTR-1 format breakdown by slab rate</p>
          </div>

          <div className="pt-3 border-t border-charcoal-100 flex justify-end">
            <button
              type="submit"
              disabled={saving || user?.role !== 'OWNER'}
              className="flex items-center gap-1.5 px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Billing Settings'}
            </button>
          </div>
        </form>
      )}

      {/* ===== STAFF ACCOUNTS TAB ===== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {user?.role !== 'OWNER' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
              Only the Business Owner can manage employee user accounts and access levels.
            </div>
          )}

          {user?.role === 'OWNER' && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff User</span>
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {user?.role === 'OWNER' && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {users.map((u) => {
                  const roleColors: Record<string, string> = {
                    OWNER: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    MANAGER: 'bg-blue-50 text-blue-800 border-blue-200',
                    CASHIER: 'bg-amber-50 text-amber-800 border-amber-200',
                    INVENTORY: 'bg-purple-50 text-purple-800 border-purple-200',
                  };
                  return (
                    <tr key={u.id} className="hover:bg-charcoal-50/70">
                      <td className="py-3 px-4 font-semibold text-charcoal-900">{u.name}</td>
                      <td className="py-3 px-4 text-charcoal-600">{u.email}</td>
                      <td className="py-3 px-4 text-charcoal-600">{u.phone || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide',
                          roleColors[u.role]
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                          u.active ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-charcoal-100 text-charcoal-600 border-charcoal-200'
                        )}>
                          {u.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      {user?.role === 'OWNER' && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditUser(u);
                                setEditUserForm({ name: u.name, role: u.role, phone: u.phone || '', password: '' });
                              }}
                              className="p-1.5 text-charcoal-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {u.id !== user?.id && (
                              <button
                                onClick={() => handleToggleUserActive(u)}
                                className={cn(
                                  'px-2 py-1 rounded text-[11px] font-semibold',
                                  u.active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                )}
                              >
                                {u.active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== AUDIT LOG TAB ===== */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-charcoal-200">
            <h2 className="text-sm font-bold text-charcoal-900">Business Activity Log (Last 30 Events)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Action Performed</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-charcoal-400">No activity logs available</td></tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-charcoal-50/70">
                      <td className="py-2.5 px-4 text-charcoal-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                      <td className="py-2.5 px-4 font-medium text-charcoal-800">{log.userName}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-[11px] bg-charcoal-100 px-1.5 py-0.5 rounded text-charcoal-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-charcoal-600">{log.entity}</td>
                      <td className="py-2.5 px-4 text-charcoal-500 max-w-sm truncate">{log.details || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== BACKUP & RESTORE TAB ===== */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-charcoal-900 pb-3 border-b border-charcoal-100">
              Data Backup & System Restore
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="border border-charcoal-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-charcoal-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-brand-700" />
                  Export Database Backup
                </div>
                <p className="text-charcoal-500">
                  Download a complete JSON backup of all business data including invoices, products, customers, purchases, and settings. Store this file safely offline.
                </p>
                <button
                  onClick={handleExportBackup}
                  disabled={user?.role !== 'OWNER'}
                  className="w-full py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  Download Full Backup
                </button>
              </div>

              <div className="border border-charcoal-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-charcoal-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-700" />
                  Restore from Backup
                </div>
                <p className="text-charcoal-500">
                  Upload a previously exported JSON backup file to restore the system. <strong className="text-red-700">Warning: This will overwrite all current data irreversibly.</strong>
                </p>
                <label className={cn(
                  'w-full py-2 border rounded-lg font-semibold text-center cursor-pointer block transition-colors',
                  user?.role === 'OWNER'
                    ? 'border-amber-300 text-amber-800 hover:bg-amber-50 bg-amber-50/50'
                    : 'opacity-50 cursor-not-allowed bg-charcoal-50 text-charcoal-500'
                )}>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    disabled={user?.role !== 'OWNER'}
                    onChange={handleImportBackup}
                  />
                  Choose Backup File & Restore
                </label>
              </div>
            </div>

            <div className="bg-charcoal-50 border border-charcoal-200 rounded-xl p-4 text-xs text-charcoal-600">
              <p className="font-bold text-charcoal-900 mb-1">Data Persistence & Storage:</p>
              <p>• All data is stored in a local JSON file at <code className="bg-charcoal-200 px-1 rounded">data/retail_database.json</code></p>
              <p>• Write operations use atomic rename (write to temp file, then rename) to prevent corruption</p>
              <p>• For production deployment, migrate to PostgreSQL with Prisma for multi-user concurrent access</p>
            </div>
          </div>
        </div>
      )}

      {/* ADD STAFF USER MODAL */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-charcoal-200">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <h3 className="text-sm font-bold text-charcoal-900">Create Staff Account</h3>
              <button onClick={() => setShowAddUser(false)} className="text-charcoal-400 hover:text-charcoal-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              {[
                { key: 'name', label: 'Full Name *', type: 'text', required: true },
                { key: 'email', label: 'Login Email *', type: 'email', required: true },
                { key: 'password', label: 'Initial Password *', type: 'password', required: true },
                { key: 'phone', label: 'Phone Number', type: 'tel', required: false },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block font-semibold text-charcoal-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    value={(userForm as any)[f.key]}
                    onChange={(e) => setUserForm({ ...userForm, [f.key]: e.target.value })}
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                    placeholder={f.key === 'password' ? 'Minimum 6 characters' : ''}
                  />
                </div>
              ))}
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Assigned Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                >
                  <option value="CASHIER">Cashier (POS & Billing)</option>
                  <option value="INVENTORY">Inventory Staff (Stock & Purchases)</option>
                  <option value="MANAGER">Manager (Sales, Reports & Stock)</option>
                  <option value="OWNER">Owner (Full Access)</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-bold">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-charcoal-200">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <h3 className="text-sm font-bold text-charcoal-900">Edit Staff Account: {editUser.email}</h3>
              <button onClick={() => setEditUser(null)} className="text-charcoal-400 hover:text-charcoal-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Full Name</label>
                <input type="text" value={editUserForm.name || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600" />
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Role</label>
                <select value={editUserForm.role || 'CASHIER'}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600">
                  <option value="CASHIER">Cashier</option>
                  <option value="INVENTORY">Inventory Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Phone</label>
                <input type="tel" value={editUserForm.phone || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600" />
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">New Password (leave blank to keep current)</label>
                <input type="password" value={editUserForm.password || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEditUser(null)}
                  className="px-3 py-1.5 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
