ALTER TABLE "conversation_private" RENAME COLUMN "admin_id" TO "user_a_id";--> statement-breakpoint
ALTER TABLE "conversation_private" RENAME COLUMN "student_id" TO "user_b_id";--> statement-breakpoint
ALTER TABLE "admin" DROP CONSTRAINT "admin_instructor_id_instructor_id_fk";
--> statement-breakpoint
ALTER TABLE "assessment_group" DROP CONSTRAINT "assessment_group_assessment_id_assessment_id_fk";
--> statement-breakpoint
ALTER TABLE "assessment_group_member" DROP CONSTRAINT "assessment_group_member_assessment_group_id_assessment_group_id_fk";
--> statement-breakpoint
ALTER TABLE "conversation_private" DROP CONSTRAINT "conversation_private_admin_id_admin_id_fk";
--> statement-breakpoint
ALTER TABLE "conversation_private" DROP CONSTRAINT "conversation_private_student_id_student_id_fk";
--> statement-breakpoint
ALTER TABLE "conversation_private" DROP CONSTRAINT "conversation_private_conversation_id_conversation_id_fk";
--> statement-breakpoint
ALTER TABLE "file_assessment" DROP CONSTRAINT "file_assessment_file_id_file_id_fk";
--> statement-breakpoint
ALTER TABLE "file_assessment_instruction" DROP CONSTRAINT "file_assessment_instruction_file_id_file_id_fk";
--> statement-breakpoint
ALTER TABLE "file_course" DROP CONSTRAINT "file_course_file_id_file_id_fk";
--> statement-breakpoint
ALTER TABLE "file_justification" DROP CONSTRAINT "file_justification_file_id_file_id_fk";
--> statement-breakpoint
ALTER TABLE "file_justification" DROP CONSTRAINT "file_justification_processed_by_admin_id_fk";
--> statement-breakpoint
ALTER TABLE "grade" DROP CONSTRAINT "grade_student_id_student_id_fk";
--> statement-breakpoint
ALTER TABLE "grade" DROP CONSTRAINT "grade_entered_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "grade_assessment" DROP CONSTRAINT "grade_assessment_grade_id_grade_id_fk";
--> statement-breakpoint
ALTER TABLE "grade_manual_notation" DROP CONSTRAINT "grade_manual_notation_grade_id_grade_id_fk";
--> statement-breakpoint
ALTER TABLE "grade_session_exam" DROP CONSTRAINT "grade_session_exam_grade_id_grade_id_fk";
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "message_conversation_id_conversation_id_fk";
--> statement-breakpoint
ALTER TABLE "message_read" DROP CONSTRAINT "message_read_message_id_message_id_fk";
--> statement-breakpoint
ALTER TABLE "session_exam_external" DROP CONSTRAINT "session_exam_external_session_exam_id_session_exam_id_fk";
--> statement-breakpoint
ALTER TABLE "session_exam_instructor" DROP CONSTRAINT "session_exam_instructor_session_exam_id_session_exam_id_fk";
--> statement-breakpoint
ALTER TABLE "session_exam_student" DROP CONSTRAINT "session_exam_student_session_exam_id_session_exam_id_fk";
--> statement-breakpoint
ALTER TABLE "document_apprenticeship_contract" ALTER COLUMN "company_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "grade" ALTER COLUMN "entered_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_group" ADD CONSTRAINT "assessment_group_assessment_id_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_group_member" ADD CONSTRAINT "assessment_group_member_assessment_group_id_assessment_group_id_fk" FOREIGN KEY ("assessment_group_id") REFERENCES "public"."assessment_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_private" ADD CONSTRAINT "conversation_private_user_a_id_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_private" ADD CONSTRAINT "conversation_private_user_b_id_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_private" ADD CONSTRAINT "conversation_private_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assessment" ADD CONSTRAINT "file_assessment_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assessment_instruction" ADD CONSTRAINT "file_assessment_instruction_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_course" ADD CONSTRAINT "file_course_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_justification" ADD CONSTRAINT "file_justification_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_justification" ADD CONSTRAINT "file_justification_processed_by_admin_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."admin"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_assessment" ADD CONSTRAINT "grade_assessment_grade_id_grade_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_manual_notation" ADD CONSTRAINT "grade_manual_notation_grade_id_grade_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_session_exam" ADD CONSTRAINT "grade_session_exam_grade_id_grade_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_read" ADD CONSTRAINT "message_read_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam_external" ADD CONSTRAINT "session_exam_external_session_exam_id_session_exam_id_fk" FOREIGN KEY ("session_exam_id") REFERENCES "public"."session_exam"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam_instructor" ADD CONSTRAINT "session_exam_instructor_session_exam_id_session_exam_id_fk" FOREIGN KEY ("session_exam_id") REFERENCES "public"."session_exam"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam_student" ADD CONSTRAINT "session_exam_student_session_exam_id_session_exam_id_fk" FOREIGN KEY ("session_exam_id") REFERENCES "public"."session_exam"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "module_code_unique" ON "module" USING btree ("code") WHERE "module"."code" != '';--> statement-breakpoint
CREATE UNIQUE INDEX "program_code_unique" ON "program" USING btree ("code") WHERE "program"."code" != '';--> statement-breakpoint
ALTER TABLE "admin" DROP COLUMN "instructor_id";--> statement-breakpoint
ALTER TABLE "absence" ADD CONSTRAINT "absence_student_id_session_id_unique" UNIQUE("student_id","session_id");--> statement-breakpoint
ALTER TABLE "academic_year" ADD CONSTRAINT "academic_year_start_date_end_date_unique" UNIQUE("start_date","end_date");--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_course_id_title_due_date_unique" UNIQUE("course_id","title","due_date");--> statement-breakpoint
ALTER TABLE "assessment_group_member" ADD CONSTRAINT "assessment_group_member_assessment_group_id_student_id_unique" UNIQUE("assessment_group_id","student_id");--> statement-breakpoint
ALTER TABLE "bloc" ADD CONSTRAINT "bloc_program_id_name_unique" UNIQUE("program_id","name");--> statement-breakpoint
ALTER TABLE "campus" ADD CONSTRAINT "campus_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "class" ADD CONSTRAINT "class_program_id_number_unique" UNIQUE("program_id","number");--> statement-breakpoint
ALTER TABLE "classroom" ADD CONSTRAINT "classroom_campus_id_name_unique" UNIQUE("campus_id","name");--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_siret_unique" UNIQUE("siret");--> statement-breakpoint
ALTER TABLE "conversation_private" ADD CONSTRAINT "conversation_private_user_a_id_user_b_id_unique" UNIQUE("user_a_id","user_b_id");--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_instructor_id_module_id_group_id_unique" UNIQUE("instructor_id","module_id","group_id");--> statement-breakpoint
ALTER TABLE "document_administrative" ADD CONSTRAINT "document_administrative_file_document_id_unique" UNIQUE("file_document_id");--> statement-breakpoint
ALTER TABLE "document_apprenticeship_contract" ADD CONSTRAINT "document_apprenticeship_contract_file_document_id_unique" UNIQUE("file_document_id");--> statement-breakpoint
ALTER TABLE "external" ADD CONSTRAINT "external_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "file_assessment" ADD CONSTRAINT "file_assessment_assessment_group_id_file_id_unique" UNIQUE("assessment_group_id","file_id");--> statement-breakpoint
ALTER TABLE "file_assessment_instruction" ADD CONSTRAINT "file_assessment_instruction_assessment_id_file_id_unique" UNIQUE("assessment_id","file_id");--> statement-breakpoint
ALTER TABLE "file_course" ADD CONSTRAINT "file_course_file_id_course_id_unique" UNIQUE("file_id","course_id");--> statement-breakpoint
ALTER TABLE "file_document" ADD CONSTRAINT "file_document_file_id_student_id_unique" UNIQUE("file_id","student_id");--> statement-breakpoint
ALTER TABLE "file_justification" ADD CONSTRAINT "file_justification_absence_id_file_id_unique" UNIQUE("absence_id","file_id");--> statement-breakpoint
ALTER TABLE "grade_assessment" ADD CONSTRAINT "grade_assessment_grade_id_assessment_id_unique" UNIQUE("grade_id","assessment_id");--> statement-breakpoint
ALTER TABLE "grade_manual_notation" ADD CONSTRAINT "grade_manual_notation_grade_id_grade_manual_id_unique" UNIQUE("grade_id","grade_manual_id");--> statement-breakpoint
ALTER TABLE "grade_session_exam" ADD CONSTRAINT "grade_session_exam_grade_id_session_exam_id_unique" UNIQUE("grade_id","session_exam_id");--> statement-breakpoint
ALTER TABLE "manual_notation" ADD CONSTRAINT "manual_notation_module_id_name_unique" UNIQUE("module_id","name");--> statement-breakpoint
ALTER TABLE "group" ADD CONSTRAINT "group_class_id_name_unique" UNIQUE("class_id","name");--> statement-breakpoint
ALTER TABLE "student_group" ADD CONSTRAINT "student_group_student_id_group_id_unique" UNIQUE("student_id","group_id");--> statement-breakpoint
ALTER TABLE "instructor" ADD CONSTRAINT "instructor_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "message_read" ADD CONSTRAINT "message_read_message_id_user_id_unique" UNIQUE("message_id","user_id");--> statement-breakpoint
ALTER TABLE "period" ADD CONSTRAINT "period_academic_year_id_order_unique" UNIQUE("academic_year_id","order");--> statement-breakpoint
ALTER TABLE "program_module" ADD CONSTRAINT "program_module_program_id_module_id_unique" UNIQUE("program_id","module_id");--> statement-breakpoint
ALTER TABLE "session_exam" ADD CONSTRAINT "session_exam_session_id_unique" UNIQUE("session_id");--> statement-breakpoint
ALTER TABLE "session_exam_external" ADD CONSTRAINT "session_exam_external_session_exam_id_external_id_unique" UNIQUE("session_exam_id","external_id");--> statement-breakpoint
ALTER TABLE "session_exam_instructor" ADD CONSTRAINT "session_exam_instructor_session_exam_id_instructor_id_unique" UNIQUE("session_exam_id","instructor_id");--> statement-breakpoint
ALTER TABLE "session_exam_student" ADD CONSTRAINT "session_exam_student_session_exam_id_student_id_unique" UNIQUE("session_exam_id","student_id");--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_user_id_unique" UNIQUE("user_id");