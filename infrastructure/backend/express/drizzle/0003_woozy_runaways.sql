ALTER TABLE "message_read" DROP CONSTRAINT "message_read_message_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "file_justification" ALTER COLUMN "processed_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "classroom_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "firstname" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastname" text NOT NULL;--> statement-breakpoint
ALTER TABLE "external" ADD COLUMN "firstname" text NOT NULL;--> statement-breakpoint
ALTER TABLE "external" ADD COLUMN "lastname" text NOT NULL;--> statement-breakpoint
ALTER TABLE "message_read" ADD COLUMN "id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "external" DROP COLUMN "first_name";--> statement-breakpoint
ALTER TABLE "external" DROP COLUMN "last_name";