-- Nullable: new users complete the setup wizard; existing users are backfilled so they skip it.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "setupWizardCompletedAt" TIMESTAMPTZ NULL;

UPDATE users
SET "setupWizardCompletedAt" = NOW()
WHERE "setupWizardCompletedAt" IS NULL;
