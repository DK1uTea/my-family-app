import { type NextRequest, NextResponse } from "next/server";
import { CORE_API_URL, getApiUrl } from "@/lib/constant";

// Microservice / module prefix routing (extend if backend is split into multiple services)
const MODULE_PREFIXES: Record<string, string> = {};

function normalizeLocale(locale: unknown) {
  if (typeof locale !== "string") return undefined;
  const normalized = locale.toLowerCase();
  return normalized === "en" || normalized === "de" ? normalized : undefined;
}

function normalizeAppearance(appearance: unknown) {
  if (typeof appearance !== "string") return undefined;
  const normalized = appearance.toLowerCase();
  return normalized === "dark" || normalized === "light"
    ? normalized
    : undefined;
}

function setLocaleCookies(response: NextResponse, locale: string) {
  response.cookies.set("preferredLanguage", locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  response.cookies.set("NEXT_LOCALE", locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10,
  });
}

function setAppearanceCookie(response: NextResponse, appearance: string) {
  response.cookies.set("appearance", appearance, {
    httpOnly: false,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 1,
): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    if (retries <= 0) throw err;
    return fetchWithRetry(url, init, retries - 1);
  }
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const modulePrefix = path[0];
  const moduleBaseUrl = MODULE_PREFIXES[modulePrefix];
  const [baseUrl, targetPath] = moduleBaseUrl
    ? [moduleBaseUrl, path.slice(1).join("/")]
    : [CORE_API_URL, path.join("/")];

  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = searchParams
    ? `${baseUrl}/${targetPath}?${searchParams}`
    : `${baseUrl}/${targetPath}`;

  // Build a minimal header set instead of forwarding the browser's raw headers
  // verbatim (Cookie, Accept-Encoding, sec-fetch-*, Referer, ...) — devtunnels
  // fails the underlying connection when those are passed through, the same
  // way /api/auth/login already avoids this by hand-picking its headers.
  const forwardedHeaders = new Headers();
  const accessToken = req.cookies.get("accessToken")?.value;
  const visitorId = req.headers.get("x-user-identifier");
  const locale = req.headers.get("x-lang");
  const contentType = req.headers.get("content-type");

  if (accessToken) forwardedHeaders.set("authorization", `Bearer ${accessToken}`);
  if (visitorId) forwardedHeaders.set("x-user-identifier", visitorId);
  if (locale) forwardedHeaders.set("x-lang", locale);
  if (contentType) forwardedHeaders.set("content-type", contentType);

  const isBodyless = ["GET", "HEAD"].includes(req.method.toUpperCase());
  const body = isBodyless ? undefined : await req.arrayBuffer();

  let response: Response;
  try {
    response = await fetchWithRetry(targetUrl, {
      method: req.method,
      headers: forwardedHeaders,
      body: body ? body : undefined,
      cache: "no-store",
    });
  } catch (err) {
    console.error(`[proxy] fetch failed → ${targetUrl}`, err);
    return NextResponse.json(
      { message: "Backend unreachable", target: targetUrl },
      { status: 502 },
    );
  }

  // console.log({ response })

  const responseBody = await response.arrayBuffer();

  // ⚠️ TEMPORARY — TESTING ONLY, DO NOT COMMIT ⚠️
  // Force the proxy's response status via ?__mockStatus=503 to verify the maintenance
  // screen without needing the backend to actually fail. Revert this block before merging.
  const mockStatus = Number(req.nextUrl.searchParams.get("__mockStatus"));
  const status =
    process.env.NODE_ENV !== "production" && mockStatus >= 400 && mockStatus < 600
      ? mockStatus
      : response.status;
  // ⚠️ END TEMPORARY BLOCK ⚠️

  const nextResponse = new NextResponse(responseBody, {
    status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
  });

  if (targetPath === "user/me" && response.status < 400) {
    try {
      const text = new TextDecoder().decode(responseBody);
      const data = JSON.parse(text);
      const preferredLanguage = normalizeLocale(
        data?.data?.settings?.preferredLanguage,
      );
      if (preferredLanguage) {
        setLocaleCookies(nextResponse, preferredLanguage);
      }

      const appearance = normalizeAppearance(
        data?.data?.settings?.appearance ?? data?.data?.settings?.theme,
      );
      if (appearance) {
        setAppearanceCookie(nextResponse, appearance);
      }
    } catch {
      // Keep the proxied response intact if the backend shape changes.
    }
  }

  return nextResponse;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
