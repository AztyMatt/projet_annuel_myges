ALTER TABLE "module" ALTER COLUMN "code" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "module" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "program_module" ADD COLUMN "coefficient" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "program_module" ADD COLUMN "ects_credits" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "module" DROP COLUMN "coefficient";--> statement-breakpoint
ALTER TABLE "module" DROP COLUMN "ects_credits";--> statement-breakpoint
ALTER TABLE "module" ADD CONSTRAINT "module_name_code_unique" UNIQUE("name","code");--> statement-breakpoint
UPDATE "program" SET "code" = '' WHERE "code" IS NULL;--> statement-breakpoint
ALTER TABLE "program" ALTER COLUMN "code" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "program" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "program" ADD CONSTRAINT "program_name_code_unique" UNIQUE("name","code");--> statement-breakpoint
CREATE UNIQUE INDEX "session_slot_with_classroom_unique" ON "session" ("course_id","classroom_id","start_time","end_time") WHERE "classroom_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "session_slot_without_classroom_unique" ON "session" ("course_id","start_time","end_time") WHERE "classroom_id" IS NULL;