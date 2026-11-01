import { z } from "zod";

const jsonObject = z.record(z.string(), z.unknown());
const statusMessage = z.object({ status: z.number(), message: z.unknown().optional() });

export type ApiContract = {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  tags: string[];
  summary: string;
  operationId: string;
  description?: string;
  requestBody?: z.ZodType;
  responses: Record<string, { description: string; schema?: z.ZodType }>;
};

export const apiContracts: ApiContract[] = [
  {
    method: "get", path: "/api/health/database", tags: ["Health"],
    summary: "Check database connectivity", operationId: "getDatabaseHealth",
    responses: {
      "200": { description: "The application can reach Neon Postgres", schema: z.object({ status: z.literal("ok") }) },
      "503": { description: "The database is unavailable", schema: z.object({ status: z.literal("unavailable") }) },
    },
  },
  {
    method: "post", path: "/api/auth/login", tags: ["Auth"],
    summary: "Sign in through the current auth backend", operationId: "postAuthLogin",
    description: "This compatibility endpoint currently forwards authentication to the configured external API.",
    requestBody: z.object({
      email: z.email(), password: z.string(), rememberMe: z.boolean().optional(), captchaToken: z.string().optional(),
    }),
    responses: {
      "200": { description: "Compatibility envelope; successful login sets httpOnly auth cookies", schema: jsonObject },
    },
  },
  {
    method: "post", path: "/api/auth/accept-invite", tags: ["Auth"],
    summary: "Accept an invitation", operationId: "postAcceptInvite",
    description: "Forwards the invitation payload to the configured auth backend.", requestBody: jsonObject,
    responses: { "200": { description: "Upstream response envelope", schema: jsonObject }, "4XX": { description: "Invitation could not be accepted", schema: statusMessage }, "500": { description: "Unexpected server error", schema: statusMessage } },
  },
  {
    method: "post", path: "/api/auth/forgot-password", tags: ["Auth"],
    summary: "Request a password reset", operationId: "postForgotPassword",
    description: "Forwards the request to the configured auth backend.", requestBody: jsonObject,
    responses: { "200": { description: "Upstream response envelope", schema: jsonObject }, "4XX": { description: "Request could not be processed", schema: statusMessage }, "500": { description: "Unexpected server error", schema: statusMessage } },
  },
  {
    method: "post", path: "/api/auth/verify-invite-user", tags: ["Auth"],
    summary: "Verify an invited user", operationId: "postVerifyInviteUser",
    description: "Forwards the request to the configured auth backend.", requestBody: jsonObject,
    responses: { "200": { description: "Upstream response envelope", schema: jsonObject }, "4XX": { description: "Invitation could not be verified", schema: statusMessage }, "500": { description: "Unexpected server error", schema: statusMessage } },
  },
  {
    method: "post", path: "/api/auth/logout", tags: ["Auth"],
    summary: "Sign out", operationId: "postAuthLogout",
    responses: { "200": { description: "Auth cookies are cleared", schema: z.object({ status: z.literal(200), message: z.literal("OK") }) } },
  },
  {
    method: "post", path: "/api/auth/refresh-token", tags: ["Auth"],
    summary: "Refresh the access token", operationId: "postRefreshToken",
    responses: {
      "200": { description: "New access token; auth cookies are updated", schema: z.object({ status: z.literal(200), message: z.literal("OK"), data: z.object({ accessToken: z.string() }) }) },
      "401": { description: "Refresh token is missing or invalid", schema: statusMessage },
    },
  },
  {
    method: "get", path: "/api/auth/socket-token", tags: ["Auth"],
    summary: "Get the socket access token", operationId: "getSocketToken",
    responses: { "200": { description: "Access token from the auth cookie", schema: z.object({ status: z.literal(200), data: z.object({ token: z.string() }) }) }, "401": { description: "No access token is available", schema: statusMessage } },
  },
  {
    method: "post", path: "/api/auth/registration-token", tags: ["Auth"],
    summary: "Issue a token for registration avatar upload", operationId: "postRegistrationToken",
    description: "Internal compatibility endpoint. Called immediately after accepting an invitation.",
    requestBody: z.object({ email: z.email(), password: z.string() }),
    responses: {
      "200": { description: "Short-lived access token", schema: z.object({ accessToken: z.string() }) },
      "400": { description: "Credentials are missing", schema: z.object({ message: z.string() }) },
      "401": { description: "Login failed", schema: z.object({ message: z.string() }) },
      "500": { description: "Unexpected server error", schema: z.object({ message: z.string() }) },
    },
  },
  {
    method: "put", path: "/api/clear-cookies", tags: ["Auth"],
    summary: "Clear auth cookies", operationId: "putClearCookies",
    responses: { "200": { description: "Auth cookies are cleared", schema: z.object({ message: z.literal("Cookies cleared") }) } },
  },
  {
    method: "get", path: "/api/user/me", tags: ["Users"],
    summary: "Get the authenticated user profile", operationId: "getCurrentUser",
    responses: {
      "200": { description: "Authenticated user and preferences", schema: jsonObject },
      "401": { description: "Authentication is required", schema: statusMessage },
      "404": { description: "User was not found", schema: statusMessage },
    },
  },
];

export const apiTags = [
  { name: "Health", description: "Application health and connectivity" },
  { name: "Auth", description: "Authentication endpoints" },
  { name: "Users", description: "User profile endpoints" },
];
