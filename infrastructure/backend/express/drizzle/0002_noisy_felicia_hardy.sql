CREATE TABLE "file_assessment_instruction" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_id" text NOT NULL,
	"file_id" text NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_exam" ADD COLUMN "is_retake" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "file_assessment_instruction" ADD CONSTRAINT "file_assessment_instruction_assessment_id_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assessment_instruction" ADD CONSTRAINT "file_assessment_instruction_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assessment" DROP COLUMN "submitted_at";