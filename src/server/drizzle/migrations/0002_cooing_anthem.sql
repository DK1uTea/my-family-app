ALTER TABLE "user_preferences" ALTER COLUMN "preferred_language" SET DEFAULT 'vi';
UPDATE "user_preferences" SET "preferred_language" = 'vi' WHERE "preferred_language" = 'de';
