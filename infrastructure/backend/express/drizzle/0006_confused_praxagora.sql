ALTER TABLE "grade" ADD COLUMN "is_retake" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "grade_assessment" ADD COLUMN "student_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "grade_assessment" ADD COLUMN "is_retake" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "grade_assessment" ADD CONSTRAINT "grade_assessment_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_year_only_one_current" ON "academic_year" USING btree ("is_current") WHERE "academic_year"."is_current" = true;--> statement-breakpoint
ALTER TABLE "grade_assessment" ADD CONSTRAINT "grade_assessment_assessment_id_student_id_is_retake_unique" UNIQUE("assessment_id","student_id","is_retake");