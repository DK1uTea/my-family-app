import { z } from "zod";

const jsonObject = z.record(z.string(), z.unknown());
const statusMessage = z.object({
  status: z.number(), message: z.string(), error_code: z.string(),
});

export type ApiContract = {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  tags: string[];
  summary: string;
  operationId: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: "path" | "query";
    required: boolean;
    schema: z.ZodType;
  }>;
  requestBody?: z.ZodType;
  responses: Record<string, { description: string; schema?: z.ZodType }>;
};

export const apiContracts: ApiContract[] = [
  {
    method: "get", path: "/api/tenants", tags: ["Tenants"],
    summary: "List tenants", operationId: "listTenants",
    parameters: [
      { name: "search", in: "query", required: false, schema: z.string().max(150) },
      { name: "page", in: "query", required: false, schema: z.coerce.number().int().positive() },
      { name: "limit", in: "query", required: false, schema: z.coerce.number().int().min(1).max(100) },
      { name: "sort", in: "query", required: false, schema: z.enum(["createdAt:desc", "createdAt:asc"]) },
    ],
    responses: {
      "200": { description: "Paginated tenants", schema: z.object({ status: z.literal(200), message: z.string(), data: z.object({ items: z.array(z.object({ id: z.string(), name: z.string(), description: z.string().nullable(), isActive: z.boolean(), createdAt: z.string(), updatedAt: z.string() })), pagination: z.object({ total: z.number(), limit: z.number(), page: z.number(), totalPages: z.number(), hasNextPage: z.boolean(), hasPrevPage: z.boolean() }) }) }) },
      "401": { description: "Authentication required", schema: statusMessage },
      "403": { description: "Super admin role required", schema: statusMessage },
      "400": { description: "Invalid list query parameter", schema: statusMessage },
    },
  },
  {
    method: "post", path: "/api/tenants", tags: ["Tenants"],
    summary: "Create a tenant", operationId: "createTenant",
    requestBody: z.object({
      name: z.string(),
      description: z.string().max(500).nullable().optional(),
    }).strict(),
    responses: {
      "201": { description: "Tenant created", schema: jsonObject },
      "400": { description: "Invalid tenant", schema: statusMessage },
      "401": { description: "Authentication required", schema: statusMessage },
      "403": { description: "Super admin role required", schema: statusMessage },
      "409": { description: "Tenant ID already exists (TENANT_ID_EXISTS)", schema: statusMessage },
    },
  },
  {
    method: "patch", path: "/api/tenants/{id}", tags: ["Tenants"],
    summary: "Update tenant details", operationId: "updateTenant",
    parameters: [{ name: "id", in: "path", required: true, schema: z.string() }],
    requestBody: z.object({
      name: z.string(),
      description: z.string().max(500).nullable().optional(),
    }),
    responses: {
      "200": { description: "Tenant updated", schema: jsonObject },
      "400": { description: "Invalid tenant", schema: statusMessage },
      "401": { description: "Authentication required", schema: statusMessage },
      "403": { description: "Super admin role required", schema: statusMessage },
      "404": { description: "Tenant not found", schema: statusMessage },
    },
  },
  {
    method: "patch", path: "/api/tenants/{id}/activate", tags: ["Tenants"],
    summary: "Activate a tenant", operationId: "activateTenant",
    parameters: [{ name: "id", in: "path", required: true, schema: z.string() }],
    responses: {
      "200": { description: "Tenant activated", schema: jsonObject },
      "401": { description: "Authentication required", schema: statusMessage },
      "403": { description: "Super admin role required", schema: statusMessage },
      "404": { description: "Tenant not found", schema: statusMessage },
    },
  },
  {
    method: "patch", path: "/api/tenants/{id}/deactivate", tags: ["Tenants"],
    summary: "Deactivate a tenant", operationId: "deactivateTenant",
    parameters: [{ name: "id", in: "path", required: true, schema: z.string() }],
    responses: {
      "200": { description: "Tenant deactivated", schema: jsonObject },
      "401": { description: "Authentication required", schema: statusMessage },
      "403": { description: "Super admin role required", schema: statusMessage },
      "404": { description: "Tenant not found", schema: statusMessage },
    },
  },
  {
    method: "get", path: "/api/health/database", tags: ["Health"],
    summary: "Check database connectivity", operationId: "getDatabaseHealth",
    responses: {
      "200": { description: "The application can reach Neon Postgres", schema: z.object({ status: z.literal("ok") }) },
      "503": { description: "The database is unavailable", schema: z.object({ status: z.literal("unavailable"), message: z.literal("DATABASE_UNAVAILABLE"), error_code: z.literal("DATABASE_UNAVAILABLE") }) },
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
      "400": { description: "Credentials are missing", schema: statusMessage },
      "401": { description: "Login failed", schema: statusMessage },
      "500": { description: "Unexpected server error", schema: statusMessage },
    },
  },
  {
    method: "put", path: "/api/clear-cookies", tags: ["Auth"],
    summary: "Clear auth cookies", operationId: "putClearCookies",
    responses: { "200": { description: "Auth cookies are cleared", schema: z.object({ message: z.literal("Cookies cleared") }) } },
  },
  {
    method: "get", path: "/api/users/me", tags: ["Users"],
    summary: "Get the authenticated user profile", operationId: "getCurrentUser",
    responses: {
      "200": { description: "Authenticated user and preferences", schema: jsonObject },
      "401": { description: "Authentication is required", schema: statusMessage },
      "404": { description: "User was not found", schema: statusMessage },
    },
  },
  {
    method: "get", path: "/api/permissions", tags: ["Roles"],
    summary: "List action permissions", operationId: "listModulePermissions",
    responses: { "200": { description: "Hierarchical module and action permission catalog", schema: jsonObject }, "401": { description: "Authentication required", schema: statusMessage }, "403": { description: "Admin role required", schema: statusMessage } },
  },
  {
    method: "get", path: "/api/roles", tags: ["Roles"],
    summary: "List roles", operationId: "listRoles",
    responses: { "200": { description: "Roles", schema: jsonObject }, "401": { description: "Authentication required", schema: statusMessage }, "403": { description: "Admin role required", schema: statusMessage } },
  },
  {
    method: "post", path: "/api/roles", tags: ["Roles"],
    summary: "Create a role", operationId: "createRole",
    requestBody: z.object({ key: z.string(), name: z.string(), permissionKeys: z.array(z.string()) }),
    responses: { "201": { description: "Role created", schema: jsonObject }, "400": { description: "Invalid input", schema: statusMessage }, "401": { description: "Authentication required", schema: statusMessage }, "403": { description: "Admin role required", schema: statusMessage }, "409": { description: "Duplicate or invalid role", schema: statusMessage } },
  },
  {
    method: "get", path: "/api/roles/{key}", tags: ["Roles"],
    summary: "Get a role", operationId: "getRole",
    parameters: [{ name: "key", in: "path", required: true, schema: z.string() }],
    responses: { "200": { description: "Role", schema: jsonObject }, "401": { description: "Authentication required", schema: statusMessage }, "403": { description: "Admin role required", schema: statusMessage }, "404": { description: "Role not found", schema: statusMessage } },
  },
  {
    method: "put", path: "/api/roles/{key}", tags: ["Roles"],
    summary: "Update a role", operationId: "updateRole",
    parameters: [{ name: "key", in: "path", required: true, schema: z.string() }],
    requestBody: z.object({ name: z.string(), permissionKeys: z.array(z.string()) }),
    responses: { "200": { description: "Role updated", schema: jsonObject }, "400": { description: "Invalid input", schema: statusMessage }, "401": { description: "Authentication required", schema: statusMessage }, "403": { description: "Admin role required or protected role", schema: statusMessage }, "404": { description: "Role not found", schema: statusMessage } },
  },
  {
    method: "put", path: "/api/users/{id}/role", tags: ["Roles"],
    summary: "Assign a user role", operationId: "assignUserRole",
    parameters: [{ name: "id", in: "path", required: true, schema: z.uuid() }],
    requestBody: z.object({ roleKey: z.string() }),
    responses: { "200": { description: "Role assigned", schema: statusMessage }, "400": { description: "Invalid input", schema: statusMessage }, "401": { description: "Authentication required", schema: statusMessage }, "403": { description: "Admin role required", schema: statusMessage }, "404": { description: "User or role not found", schema: statusMessage } },
  },
];

export const apiTags = [
  { name: "Health", description: "Application health and connectivity" },
  { name: "Tenants", description: "Platform tenant administration" },
  { name: "Auth", description: "Authentication endpoints" },
  { name: "Users", description: "User profile endpoints" },
  { name: "Roles", description: "Role and action permission administration" },
];
