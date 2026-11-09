CREATE TABLE "roles" (
	"key" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"module_keys" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
UPDATE "users"
SET "role_key" = 'legacy_' || "id"::text
WHERE "role_key" = 'admin'
  AND NOT (coalesce("permissions", '[]'::jsonb) ? '*');
--> statement-breakpoint
INSERT INTO "roles" ("key", "name", "module_keys")
VALUES ('admin', 'Admin', '["*"]'::jsonb);
--> statement-breakpoint
INSERT INTO "roles" ("key", "name", "module_keys")
SELECT DISTINCT "role_key", "role_key", '[]'::jsonb
FROM "users"
WHERE "role_key" IS NOT NULL AND "role_key" <> 'admin';
--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "currency" SET DEFAULT 'VND';
