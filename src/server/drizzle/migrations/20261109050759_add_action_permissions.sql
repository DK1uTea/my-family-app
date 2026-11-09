ALTER TABLE "roles" ADD COLUMN "permission_keys" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
-- Keep module_keys intact as a rollback source while the app switches to permission_keys.
UPDATE "roles"
SET "permission_keys" = CASE
	WHEN "key" = 'admin' THEN '["*"]'::jsonb
	WHEN "key" = 'adult' THEN '["event-timeline.read", "event-timeline.create", "event-timeline.edit", "event-timeline.delete"]'::jsonb
	WHEN "key" = 'child' THEN '["event-timeline.read"]'::jsonb
	WHEN "module_keys" ? 'event-timeline' THEN '["event-timeline.read"]'::jsonb
	ELSE '[]'::jsonb
END;
