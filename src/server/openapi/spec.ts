export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Ft My Family API",
    version: "1.0.0",
    description:
      "First-party Next.js API. The auth compatibility route currently proxies the configured backend.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health", description: "Application health and connectivity" },
    { name: "Auth", description: "Authentication compatibility endpoints" },
  ],
  paths: {
    "/api/health/database": {
      get: {
        tags: ["Health"],
        summary: "Check database connectivity",
        operationId: "getDatabaseHealth",
        responses: {
          "200": {
            description: "The application can reach Neon Postgres",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { const: "ok" } },
                },
              },
            },
          },
          "503": {
            description: "The database is unavailable",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { const: "unavailable" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Sign in through the current auth backend",
        operationId: "postAuthLogin",
        description:
          "This compatibility endpoint currently forwards authentication to the configured external API.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                  rememberMe: { type: "boolean", default: false },
                  captchaToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Compatibility envelope. The status field contains the upstream result; tokens are set as httpOnly cookies on successful login.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "integer" },
                    message: {},
                    data: { type: "object" },
                    error_code: { type: "string" },
                    attemptsRemaining: { type: "integer" },
                    loginBlockDuration: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
