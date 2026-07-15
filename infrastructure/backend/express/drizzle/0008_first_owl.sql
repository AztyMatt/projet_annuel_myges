ALTER TABLE "users" ALTER COLUMN "gdpr_consent_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN "purpose" text DEFAULT 'reset' NOT NULL;