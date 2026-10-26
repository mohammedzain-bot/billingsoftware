import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase, generateId, User } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== 'OWNER') {
    return forbiddenResponse('Only the Business Owner can manage employee user accounts');
  }

  const db = getDatabase();
  const safeUsers = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    active: u.active,
    createdAt: u.createdAt,
  }));

  return successResponse(safeUsers);
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== 'OWNER') {
    return forbiddenResponse('Only the Owner can create new staff accounts');
  }

  try {
    const { name, email, password, role = 'CASHIER', phone } = await request.json();

    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required', 400);
    }

    const validRoles = ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY'];
    if (!validRoles.includes(role)) {
      return errorResponse('Invalid role specified', 400);
    }

    const db = getDatabase();
    const exists = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      return errorResponse('A user with this email address already exists', 400);
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();

    const newUser: User = {
      id: generateId(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      phone: phone || null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);

    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: newUser.id,
      details: `Created user account for ${newUser.name} with role ${newUser.role}`,
      createdAt: now,
    });

    saveDatabase(db);

    return successResponse(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        active: newUser.active,
      },
      'User account created successfully',
      201
    );
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create user', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== 'OWNER') return forbiddenResponse();

  try {
    const body = await request.json();
    const { id, name, role, phone, active, password } = body;

    const db = getDatabase();
    const target = db.users.find((u) => u.id === id);
    if (!target) return errorResponse('User not found', 404);

    const now = new Date().toISOString();

    if (name) target.name = name.trim();
    if (role) target.role = role;
    if (phone !== undefined) target.phone = phone;
    if (active !== undefined) target.active = Boolean(active);
    if (password && password.trim().length >= 6) {
      target.passwordHash = bcrypt.hashSync(password.trim(), 10);
    }
    target.updatedAt = now;

    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'USER_UPDATED',
      entity: 'USER',
      entityId: target.id,
      details: `Updated user account ${target.name} (${target.role})`,
      createdAt: now,
    });

    saveDatabase(db);
    return successResponse(
      {
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
        phone: target.phone,
        active: target.active,
      },
      'User updated successfully'
    );
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update user', 500);
  }
}
