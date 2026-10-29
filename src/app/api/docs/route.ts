import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const docsHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ft My Family API Documentation</title>
    <link rel="stylesheet" href="/swagger-ui/swagger-ui.css" />
  </head>
  <body>
    <main id="swagger-ui" aria-label="API documentation"></main>
    <script src="/swagger-ui/swagger-ui-bundle.js"></script>
    <script src="/swagger-ui/swagger-ui-standalone-preset.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout"
      });
    </script>
  </body>
</html>`;

export function GET() {
  if (process.env.NODE_ENV === "production" && process.env.API_DOCS_ENABLED !== "true") {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(docsHtml, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
