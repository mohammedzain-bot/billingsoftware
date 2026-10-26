import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, generateId } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== 'OWNER') return forbiddenResponse('Only the Business Owner can export data backups');

  const db = getDatabase();
  const jsonString = JSON.stringify(db, null, 2);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `apex_retail_backup_${timestamp}.json`;

  return new NextResponse(jsonString, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== 'OWNER') return forbiddenResponse('Only the Business Owner can restore data backups');

  try {
    const backupData = await request.json();

    // Basic structure validation
    if (!backupData.businessProfile || !Array.isArray(backupData.products) || !Array.isArray(backupData.invoices)) {
      return errorResponse('Invalid backup file schema. Missing key relational tables.', 400);
    }

    dbRestore: {
      saveDatabase(backupData);
    }

    const db = getDatabase();
    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'DATABASE_RESTORED',
      entity: 'BACKUP',
      details: `Full database restored from uploaded backup by ${user.name}`,
      createdAt: new Date().toISOString(),
    });
    saveDatabase(db);

    return successResponse(null, 'Database successfully restored from backup');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to restore backup', 500);
  }
}
