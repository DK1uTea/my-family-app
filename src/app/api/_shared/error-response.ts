import { NextResponse } from 'next/server';

type ErrorOptions = {
  transportStatus?: number;
  details?: Record<string, unknown>;
};

export function apiError(status: number, key: string, options: ErrorOptions = {}) {
  return NextResponse.json(
    { status, message: key, error_code: key, ...options.details },
    { status: options.transportStatus ?? status },
  );
}
