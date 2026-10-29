import { cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const packageDirectory = join(require.resolve("swagger-ui-dist/package.json"), "..");
const outputDirectory = join(process.cwd(), "public", "swagger-ui");
const assets = ["swagger-ui.css", "swagger-ui-bundle.js", "swagger-ui-standalone-preset.js"];

await mkdir(outputDirectory, { recursive: true });

for (const asset of assets) {
  await cp(join(packageDirectory, asset), join(outputDirectory, asset));
}
