import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, generateId } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const db = getDatabase();
  return successResponse(db.categories);
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const { name, description } = await request.json();
    if (!name) return errorResponse('Category name is required', 400);

    const db = getDatabase();
    const exists = db.categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase().trim()
    );
    if (exists) return errorResponse('Category with this name already exists', 400);

    const newCat = {
      id: generateId(),
      name: name.trim(),
      description: description || null,
      createdAt: new Date().toISOString(),
    };

    db.categories.push(newCat);
    saveDatabase(db);

    return successResponse(newCat, 'Category created successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create category', 500);
  }
}
