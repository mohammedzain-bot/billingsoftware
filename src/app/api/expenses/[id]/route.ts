import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, generateId } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
    return forbiddenResponse('Only Owner or Manager can delete expenses');
  }

  const db = getDatabase();
  const index = db.expenses.findIndex((e) => e.id === params.id);
  if (index === -1) return errorResponse('Expense not found', 404);

  const deleted = db.expenses[index];
  db.expenses.splice(index, 1);

  db.auditLogs.unshift({
    id: generateId(),
    userId: user.id,
    userName: user.name,
    action: 'EXPENSE_DELETED',
    entity: 'EXPENSE',
    entityId: params.id,
    details: `Deleted expense of ₹${deleted.amount} (${deleted.category})`,
    createdAt: new Date().toISOString(),
  });

  saveDatabase(db);
  return successResponse(null, 'Expense removed successfully');
}
