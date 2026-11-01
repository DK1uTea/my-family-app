import axios from "axios";
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosInstance,
} from "axios";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/get-error-message";

/* ── Server response envelope ── */
type ServerEnvelope = {
  status: number;
  message?: string | string[];
  error_code?: string;
  data?: unknown;
};

function isEnvelope(data: unknown): data is ServerEnvelope {
  return typeof data === "object" && data !== null && "status" in data;
}

function unwrapEnvelope(response: AxiosResponse) {
  const { data } = response;
  if (!isEnvelope(data)) return response;

  const realStatus = data.status;
  if (realStatus >= 400) {
    const isRefreshCall = response.config?.url?.includes("/auth/refresh-token");
    const skipToast = (response.config as { _skipToast?: boolean })?._skipToast;
    if (!isRefreshCall && !skipToast) {
      const msgKey = Array.isArray(data.message)
        ? data.message[0]
        : data.message;
      toast.error(getErrorMessage(data.error_code ?? msgKey));
    }
    throw new axios.AxiosError(
      Array.isArray(data.message)
        ? data.message[0]
        : (data.message ?? String(realStatus)),
      String(realStatus),
      response.config,
      response.request,
      { ...response, status: realStatus },
    );
  }

  response.status = realStatus;
  return response;
}

/* ── Cross-tab auth coordination via BroadcastChannel ── */
type AuthMessage =
  | { type: "REFRESH_SUCCESS" }
  | { type: "REFRESH_FAILURE" }
  | { type: "LOGOUT" };

let authChannel: BroadcastChannel | null = null;

function getAuthChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window))
    return null;
  if (!authChannel) authChannel = new BroadcastChannel("auth");
  return authChannel;
}

export function broadcastAuth(message: AuthMessage) {
  getAuthChannel()?.postMessage(message);
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  // Read locale from URL path since we use [locale] routing (/vi/dashboards)
  const locale = window.location.pathname.split("/")[1] || "vi";
  window.location.assign(`/${locale}/login`);
}

/** Logout on backend, clear server-side cookies, broadcast, redirect. */
export async function clientLogout() {
  // _skipToast: true — logout is best-effort; network errors must not show a toast
  await apiProxy
    .post("/auth/logout", {}, { _skipToast: true } as object)
    .catch(() => {});
  await apiProxy.put("/clear-cookies").catch(() => {});
  broadcastAuth({ type: "LOGOUT" });
  redirectToLogin();
}

/* ── Token refresh state ── */
let isRefreshing = false;
let refreshQueue: Array<(success: boolean) => void> = [];

function notifyQueue(success: boolean) {
  refreshQueue.forEach((cb) => cb(success));
  refreshQueue = [];
}

// Calls the Next.js route handler which reads the httpOnly RT cookie server-side
async function doRefresh(): Promise<boolean> {
  try {
    const res = await apiProxy.post("/auth/refresh-token");
    return res?.status === 200 || res?.data?.status === 200;
  } catch {
    return false;
  }
}

/* ── Shared request interceptor ── */
function applyRequestInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    if (typeof window === "undefined") return config;

    const locale = window.location.pathname.split("/")[1] || "vi";
    const visitorId = localStorage.getItem("fingerprint") || "";
    config.headers.set("x-lang", locale);
    config.headers.set("x-user-identifier", visitorId);

    return config;
  });
}

/* ── Shared response interceptor ── */
function applyResponseInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => unwrapEnvelope(response),
    async (error: AxiosError<ServerEnvelope>) => {
      if (axios.isCancel(error)) return Promise.reject(error);

      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _skipToast?: boolean;
      };

      const status = error.response?.status;
      const isGet = originalRequest?.method?.toLowerCase() === "get";
      const isAuthRoute =
        originalRequest?.url?.includes("/auth/login") ||
        originalRequest?.url?.includes("/auth/refresh-token") ||
        originalRequest?.url?.includes("/auth/logout") ||
        originalRequest?.url?.includes("/clear-cookies");

      // 401 on GET or non-auth requests — retry once after refresh
      if (status === 401 && isGet && !originalRequest._retry && !isAuthRoute) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push((success) => {
              if (success) {
                resolve(instance(originalRequest));
              } else {
                originalRequest._skipToast = true;
                reject(error);
              }
            });
          });
        }

        isRefreshing = true;
        const refreshed = await doRefresh();
        isRefreshing = false;

        if (refreshed) {
          broadcastAuth({ type: "REFRESH_SUCCESS" });
          notifyQueue(true);
          return instance(originalRequest);
        }

        broadcastAuth({ type: "REFRESH_FAILURE" });
        notifyQueue(false);
        clientLogout();
        return Promise.reject(error);
      }

      const isRefreshCall = originalRequest?.url?.includes(
        "/auth/refresh-token",
      );
      if (
        status &&
        status >= 400 &&
        !originalRequest?._skipToast &&
        !isRefreshCall
      ) {
        const errData = error.response?.data;
        const errMsgKey = Array.isArray(errData?.message)
          ? errData.message[0]
          : errData?.message;
        toast.error(getErrorMessage(errData?.error_code ?? errMsgKey));
      }

      return Promise.reject(error);
    },
  );
}

/* ── apiProxy: Next.js route handlers (/api) ──────────────────────────────────
   Use for auth endpoints that need server-side httpOnly cookie management:
     POST /api/auth/login
     POST /api/auth/refresh-token
     PUT  /api/clear-cookies
   ─────────────────────────────────────────────────────────────────────────── */
export const apiProxy = axios.create({
  baseURL: "/api",
  timeout: 30000 * 2, // 60s
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

applyRequestInterceptor(apiProxy);
applyResponseInterceptor(apiProxy);

/* ── Cross-tab logout listener ── */
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  getAuthChannel()!.addEventListener(
    "message",
    (event: MessageEvent<AuthMessage>) => {
      if (event.data?.type === "LOGOUT") {
        redirectToLogin();
      }
    },
  );
}
