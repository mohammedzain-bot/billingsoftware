import { NextRequest } from 'next/server';
import { getCurrentUser, ROLE_PERMISSIONS } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = getCurrentUser(request);
  if (!session) {
    return unauthorizedResponse('Not logged in');
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.id === session.id);
  if (!user || !user.active) {
    return unauthorizedResponse('User not found or inactive');
  }

  return successResponse({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
    permissions: ROLE_PERMISSIONS[user.role],
    business: db.businessProfile,
  });
}
