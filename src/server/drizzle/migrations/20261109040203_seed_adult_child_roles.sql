INSERT INTO "roles" ("key", "name", "module_keys")
VALUES
	('adult', 'Adult', '["event-timeline"]'::jsonb),
	('child', 'Child', '["event-timeline"]'::jsonb)
ON CONFLICT ("key") DO UPDATE SET
	"name" = EXCLUDED."name",
	"module_keys" = CASE
		WHEN "roles"."module_keys" ? 'event-timeline' THEN "roles"."module_keys"
		ELSE "roles"."module_keys" || '["event-timeline"]'::jsonb
	END;
