import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase, generateId } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    const db = getDatabase();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    if (!user.active) {
      return errorResponse('This user account has been deactivated. Please contact the owner.', 403);
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse('Invalid email or password', 401);
    }

    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };

    const token = signToken(session);

    // Record audit log
    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'USER_LOGIN',
      entity: 'AUTH',
      details: `User ${user.name} logged in successfully as ${user.role}`,
      createdAt: new Date().toISOString(),
    });
    saveDatabase(db);

    const response = successResponse({
      user: session,
      token,
    }, 'Login successful');

    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse(error.message || 'Login failed', 500);
  }
}
