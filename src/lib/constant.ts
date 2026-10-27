const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const VERSION = process.env.NEXT_PUBLIC_API_VERSION ?? "v1";

export function getApiUrl(module: string) {
  return `${BASE}/${module}/api/${VERSION}`;
}

export const CORE_API_URL = getApiUrl("core");
