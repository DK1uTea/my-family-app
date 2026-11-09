UPDATE "user_preferences"
SET "currency" = 'VND'
WHERE "currency" IS DISTINCT FROM 'VND';
