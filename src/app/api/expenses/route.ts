import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, generateId, Expense } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'ALL';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const db = getDatabase();

  let expenses = db.expenses.filter((e) => {
    const matchCat = category === 'ALL' || e.category === category;
    let matchDate = true;
    if (startDate) {
      matchDate = matchDate && new Date(e.date) >= new Date(startDate);
    }
    if (endDate) {
      matchDate = matchDate && new Date(e.date) <= new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    return matchCat && matchDate;
  });

  expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  return successResponse({
    expenses,
    totalCount: expenses.length,
    totalExpense,
    categoryTotals,
  });
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role === 'CASHIER' || user.role === 'INVENTORY') {
    return forbiddenResponse('Only Owner or Manager can record operating expenses');
  }

  try {
    const body = await request.json();
    const { category, description, amount, paymentMethod = 'CASH', date, receiptUrl } = body;

    if (!category || !description || !amount || Number(amount) <= 0) {
      return errorResponse('Category, description, and positive amount are required', 400);
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    const newExpense: Expense = {
      id: generateId(),
      category: category.trim(),
      description: description.trim(),
      amount: Number(amount),
      paymentMethod,
      date: date ? new Date(date).toISOString() : now,
      receiptUrl: receiptUrl || null,
      createdByName: user.name,
      createdAt: now,
    };

    db.expenses.unshift(newExpense);

    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'EXPENSE_RECORDED',
      entity: 'EXPENSE',
      entityId: newExpense.id,
      details: `Recorded expense of ₹${newExpense.amount} for ${newExpense.category}: ${newExpense.description}`,
      createdAt: now,
    });

    saveDatabase(db);
    return successResponse(newExpense, 'Expense recorded successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to record expense', 500);
  }
}
