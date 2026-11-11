import { apiError } from '@/app/api/_shared/error-response';

type UpstreamError = {
  error_code?: unknown;
  message?: unknown;
};

export function upstreamErrorResponse(result: UpstreamError | null, status: number) {
  const candidate = result?.error_code ?? result?.message;
  const first = Array.isArray(candidate) ? candidate[0] : candidate;
  const key = typeof first === 'string' && /^[A-Z][A-Z0-9_.]*$/.test(first)
    ? first
    : 'UPSTREAM_REQUEST_FAILED';
  return apiError(status, key);
}
