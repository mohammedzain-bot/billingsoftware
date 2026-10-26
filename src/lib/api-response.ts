import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, message = 'Success', status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(message = 'An error occurred', status = 400, errors?: any) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
}

export function unauthorizedResponse(message = 'Unauthorized access') {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = 'Forbidden: insufficient permissions') {
  return errorResponse(message, 403);
}
