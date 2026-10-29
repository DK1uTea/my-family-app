const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION ?? "v1";

export const API_URL = `${API_ORIGIN}/api/${API_VERSION}`;
