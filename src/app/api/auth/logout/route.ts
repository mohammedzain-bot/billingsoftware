import { NextRequest } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  const response = successResponse(null, 'Logged out successfully');
  clearAuthCookie(response);
  return response;
}
