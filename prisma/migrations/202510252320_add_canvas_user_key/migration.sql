ALTER TABLE "User"
ADD COLUMN "canvasUserKey" TEXT;

UPDATE "User"
SET "canvasUserKey" = CONCAT('legacy-', "id")
WHERE "canvasUserKey" IS NULL;

ALTER TABLE "User"
ADD CONSTRAINT "User_canvasUserKey_key" UNIQUE ("canvasUserKey");
