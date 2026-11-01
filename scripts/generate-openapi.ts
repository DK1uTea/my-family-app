import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { z } from "zod";
import { apiContracts, apiTags } from "../src/server/openapi/contracts";

const outputPath = resolve("src/server/openapi/generated.json");
const checkOnly = process.argv.includes("--check");
const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

function jsonSchema(schema: z.ZodType) {
  const converted = z.toJSONSchema(schema, { target: "draft-2020-12" });
  const { $schema: _schemaVersion, ...openApiSchema } = converted;
  void _schemaVersion;
  return openApiSchema;
}

function routeMethods(source: string) {
  const file = ts.createSourceFile("route.ts", source, ts.ScriptTarget.Latest, true);
  const result = new Set<string>();
  for (const statement of file.statements) {
    const isExported = ts.canHaveModifiers(statement) &&
      ts.getModifiers(statement)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name && methods.has(statement.name.text)) {
      result.add(statement.name.text);
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && methods.has(declaration.name.text)) result.add(declaration.name.text);
      }
    }
  }
  return [...result];
}

function assertRouteContracts() {
  const root = resolve("src/app/api");
  const actual = new Set<string>();
  function walk(directory: string) {
    for (const name of readdirSync(directory)) {
      const path = resolve(directory, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name === "route.ts") {
        const relative = path.slice(root.length).replaceAll("\\", "/").replace(/\/route\.ts$/, "");
        if (relative === "/docs" || relative === "/openapi.json" || relative === "/[...path]") continue;
        const apiPath = `/api${relative.replace(/\[([^\]]+)\]/g, "{$1}")}`;
        for (const method of routeMethods(readFileSync(path, "utf8"))) actual.add(`${method} ${apiPath}`);
      }
    }
  }
  walk(root);
  const declared = new Set(apiContracts.map(contract => `${contract.method.toUpperCase()} ${contract.path}`));
  const missing = [...actual].filter(route => !declared.has(route));
  const stale = [...declared].filter(route => !actual.has(route));
  if (missing.length || stale.length) {
    throw new Error([
      missing.length ? `Route handlers missing OpenAPI contracts:\n  ${missing.join("\n  ")}` : "",
      stale.length ? `OpenAPI contracts without route handlers:\n  ${stale.join("\n  ")}` : "",
    ].filter(Boolean).join("\n"));
  }
}

function buildDocument() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const contract of apiContracts) {
    const responses = Object.fromEntries(Object.entries(contract.responses).map(([status, response]) => [status, {
      description: response.description,
      ...(response.schema ? { content: { "application/json": { schema: jsonSchema(response.schema) } } } : {}),
    }]));
    paths[contract.path] ??= {};
    paths[contract.path][contract.method] = {
      tags: contract.tags,
      summary: contract.summary,
      operationId: contract.operationId,
      ...(contract.description ? { description: contract.description } : {}),
      ...(contract.requestBody ? { requestBody: { required: true, content: { "application/json": { schema: jsonSchema(contract.requestBody) } } } } : {}),
      responses,
    };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "My Family API",
      version: "1.0.0",
      description: "First-party Next.js API. Compatibility endpoints are identified in each operation.",
    },
    servers: [{ url: "/", description: "Current host" }],
    tags: apiTags,
    paths,
  };
}

assertRouteContracts();
const generated = `${JSON.stringify(buildDocument(), null, 2)}\n`;
if (checkOnly) {
  const current = readFileSync(outputPath, "utf8");
  if (current !== generated) {
    console.error("OpenAPI document is out of date. Run pnpm openapi:generate and commit the generated file.");
    process.exitCode = 1;
  } else {
    console.log("OpenAPI contracts and generated document are up to date.");
  }
} else {
  writeFileSync(outputPath, generated);
  console.log(`Generated ${outputPath}`);
}
