import type { NextRequest } from "next/server";

function extractHostname(input: string): string {
  let raw = input.trim().toLowerCase();
  if (raw.includes("://")) {
    try {
      return new URL(raw).hostname.toLowerCase();
    } catch {
      raw = raw.replace(/^https?:\/\//, "");
    }
  }
  // Strip path and port if present
  raw = raw.split("/")[0];
  raw = raw.split(":")[0];
  return raw;
}

function matchesDomain(host: string, allowedPattern: string): boolean {
  if (host === allowedPattern) return true;
  // If allowedPattern has no dot (e.g., 'tenant-qa'), match the first segment of host
  if (!allowedPattern.includes(".") && host.split(".")[0] === allowedPattern) {
    return true;
  }
  // Wildcard support (e.g., '*.example.com')
  if (allowedPattern.startsWith("*.") && host.endsWith(allowedPattern.slice(1))) {
    return true;
  }
  return false;
}

function getAllowedDomains(): string[] {
  return (process.env.ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((item) => extractHostname(item))
    .filter(Boolean);
}

export function isDomainAllowed(req: NextRequest): boolean {
  const isDev = process.env.NODE_ENV === "development";

  // In development, automatically allow localhost and 127.0.0.1
  const hostHeader =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.hostname;
  const requestHost = extractHostname(hostHeader);

  if (isDev && (requestHost === "localhost" || requestHost === "127.0.0.1")) {
    return true;
  }

  // Block obvious cross-site browser requests
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  const allowedDomains = getAllowedDomains();
  // If no allowed domains are configured, allow only in dev; block in production
  if (allowedDomains.length === 0) {
    return isDev;
  }

  // 1. Verify destination Host
  const isHostValid = allowedDomains.some((pattern) =>
    matchesDomain(requestHost, pattern),
  );
  if (!isHostValid) {
    return false;
  }

  // 2. Verify Origin (if present)
  const originHeader = req.headers.get("origin");
  if (originHeader) {
    const originHost = extractHostname(originHeader);
    if (isDev && (originHost === "localhost" || originHost === "127.0.0.1")) {
      return true;
    }
    const isOriginValid = allowedDomains.some((pattern) =>
      matchesDomain(originHost, pattern),
    );
    if (!isOriginValid) {
      return false;
    }
  }

  // 3. Verify Referer (if present and Origin is absent)
  const refererHeader = req.headers.get("referer");
  if (!originHeader && refererHeader) {
    const refererHost = extractHostname(refererHeader);
    if (isDev && (refererHost === "localhost" || refererHost === "127.0.0.1")) {
      return true;
    }
    const isRefererValid = allowedDomains.some((pattern) =>
      matchesDomain(refererHost, pattern),
    );
    if (!isRefererValid) {
      return false;
    }
  }

  return true;
}
