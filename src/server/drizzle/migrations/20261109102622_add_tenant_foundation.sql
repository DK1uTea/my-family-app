CREATE TABLE "tenants" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "tenants" ("id", "name", "is_active") VALUES ('default', 'Default Tenant', true)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
UPDATE "users" SET "tenant_id" = 'default' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_tenant_id" ON "users" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_scope_check" CHECK (("users"."role_key" = 'super_admin' AND "users"."tenant_id" IS NULL) OR ("users"."role_key" IS DISTINCT FROM 'super_admin' AND "users"."tenant_id" IS NOT NULL));
--> statement-breakpoint
UPDATE "roles" SET "permission_keys" = '["event-timeline.read", "event-timeline.create", "event-timeline.edit", "event-timeline.delete"]'::jsonb
WHERE "key" = 'admin';
--> statement-breakpoint
INSERT INTO "roles" ("key", "name", "module_keys", "permission_keys")
VALUES ('super_admin', 'Super Admin', '[]'::jsonb, '["*"]'::jsonb)
ON CONFLICT ("key") DO NOTHING;
