CREATE TABLE "absence" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"session_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text NOT NULL,
	"declared_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_year" (
	"id" text PRIMARY KEY NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_current" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"instructor_id" text,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"max_group_size" integer DEFAULT 3 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_group" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_group_member" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_group_id" text NOT NULL,
	"student_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_name" text NOT NULL,
	"entity_id" text NOT NULL,
	"old_value" json,
	"new_value" json NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"password_updated_at" timestamp with time zone NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"gdpr_consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "bloc" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"program_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campus" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"program_id" text NOT NULL,
	"size" integer NOT NULL,
	"conversation_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classroom" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"campus_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"siret" text NOT NULL,
	"address" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_number" text,
	"contact_email" text
);
--> statement-breakpoint
CREATE TABLE "conversation_private" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"student_id" text NOT NULL,
	"conversation_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" text PRIMARY KEY NOT NULL,
	"instructor_id" text NOT NULL,
	"module_id" text NOT NULL,
	"group_id" text NOT NULL,
	"bloc_id" text NOT NULL,
	"conversation_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_administrative" (
	"id" text PRIMARY KEY NOT NULL,
	"file_document_id" text NOT NULL,
	"type" text NOT NULL,
	"expiration" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "document_apprenticeship_contract" (
	"id" text PRIMARY KEY NOT NULL,
	"file_document_id" text NOT NULL,
	"company_id" text NOT NULL,
	"type" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" text PRIMARY KEY NOT NULL,
	"storage_path" text NOT NULL,
	"name" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_assessment" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_id" text NOT NULL,
	"assessment_group_id" text NOT NULL,
	"file_id" text NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_course" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"file_id" text NOT NULL,
	"course_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_document" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_justification" (
	"id" text PRIMARY KEY NOT NULL,
	"absence_id" text NOT NULL,
	"file_id" text NOT NULL,
	"validation_status" text NOT NULL,
	"processed_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"value" real NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"entered_at" timestamp with time zone NOT NULL,
	"entered_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_assessment" (
	"id" text PRIMARY KEY NOT NULL,
	"grade_id" text NOT NULL,
	"assessment_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_manual_notation" (
	"id" text PRIMARY KEY NOT NULL,
	"grade_id" text NOT NULL,
	"grade_manual_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_session_exam" (
	"id" text PRIMARY KEY NOT NULL,
	"grade_id" text NOT NULL,
	"session_exam_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_notation" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_group" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"group_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"contract_type" text NOT NULL,
	"specialties" json
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_read" (
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp with time zone NOT NULL,
	CONSTRAINT "message_read_message_id_user_id_pk" PRIMARY KEY("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "module" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"coefficient" integer NOT NULL,
	"ects_credits" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "period" (
	"id" text PRIMARY KEY NOT NULL,
	"order" integer NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"academic_year_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_module" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"module_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"period_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"mode" text NOT NULL,
	"classroom_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_exam" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"type" text NOT NULL,
	"assessment_id" text
);
--> statement-breakpoint
CREATE TABLE "session_exam_external" (
	"id" text PRIMARY KEY NOT NULL,
	"session_exam_id" text NOT NULL,
	"external_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_exam_instructor" (
	"id" text PRIMARY KEY NOT NULL,
	"session_exam_id" text NOT NULL,
	"instructor_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_exam_student" (
	"id" text PRIMARY KEY NOT NULL,
	"session_exam_id" text NOT NULL,
	"student_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"program_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "absence" ADD CONSTRAINT "absence_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absence" ADD CONSTRAINT "absence_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_instructor_id_instructor_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_group" ADD CONSTRAINT "assessment_group_assessment_id_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_group_member" ADD CONSTRAINT "assessment_group_member_assessment_group_id_assessment_group_id_fk" FOREIGN KEY ("assessment_group_id") REFERENCES "public"."assessment_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_group_member" ADD CONSTRAINT "assessment_group_member_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bloc" ADD CONSTRAINT "bloc_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class" ADD CONSTRAINT "class_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class" ADD CONSTRAINT "class_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom" ADD CONSTRAINT "classroom_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_private" ADD CONSTRAINT "conversation_private_admin_id_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_private" ADD CONSTRAINT "conversation_private_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_private" ADD CONSTRAINT "conversation_private_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_instructor_id_instructor_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_bloc_id_bloc_id_fk" FOREIGN KEY ("bloc_id") REFERENCES "public"."bloc"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_administrative" ADD CONSTRAINT "document_administrative_file_document_id_file_document_id_fk" FOREIGN KEY ("file_document_id") REFERENCES "public"."file_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_apprenticeship_contract" ADD CONSTRAINT "document_apprenticeship_contract_file_document_id_file_document_id_fk" FOREIGN KEY ("file_document_id") REFERENCES "public"."file_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_apprenticeship_contract" ADD CONSTRAINT "document_apprenticeship_contract_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assessment" ADD CONSTRAINT "file_assessment_assessment_id_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assessment" ADD CONSTRAINT "file_assessment_assessment_group_id_assessment_group_id_fk" FOREIGN KEY ("assessment_group_id") REFERENCES "public"."assessment_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assessment" ADD CONSTRAINT "file_assessment_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_course" ADD CONSTRAINT "file_course_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_course" ADD CONSTRAINT "file_course_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_document" ADD CONSTRAINT "file_document_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_document" ADD CONSTRAINT "file_document_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_justification" ADD CONSTRAINT "file_justification_absence_id_absence_id_fk" FOREIGN KEY ("absence_id") REFERENCES "public"."absence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_justification" ADD CONSTRAINT "file_justification_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_justification" ADD CONSTRAINT "file_justification_processed_by_admin_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_assessment" ADD CONSTRAINT "grade_assessment_grade_id_grade_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grade"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_assessment" ADD CONSTRAINT "grade_assessment_assessment_id_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_manual_notation" ADD CONSTRAINT "grade_manual_notation_grade_id_grade_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grade"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_manual_notation" ADD CONSTRAINT "grade_manual_notation_grade_manual_id_manual_notation_id_fk" FOREIGN KEY ("grade_manual_id") REFERENCES "public"."manual_notation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_session_exam" ADD CONSTRAINT "grade_session_exam_grade_id_grade_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grade"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_session_exam" ADD CONSTRAINT "grade_session_exam_session_exam_id_session_exam_id_fk" FOREIGN KEY ("session_exam_id") REFERENCES "public"."session_exam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_notation" ADD CONSTRAINT "manual_notation_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group" ADD CONSTRAINT "group_class_id_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_group" ADD CONSTRAINT "student_group_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_group" ADD CONSTRAINT "student_group_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor" ADD CONSTRAINT "instructor_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_read" ADD CONSTRAINT "message_read_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_read" ADD CONSTRAINT "message_read_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period" ADD CONSTRAINT "period_academic_year_id_academic_year_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_year"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_module" ADD CONSTRAINT "program_module_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_module" ADD CONSTRAINT "program_module_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program" ADD CONSTRAINT "program_period_id_period_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."period"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classroom"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam" ADD CONSTRAINT "session_exam_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam" ADD CONSTRAINT "session_exam_assessment_id_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam_external" ADD CONSTRAINT "session_exam_external_session_exam_id_session_exam_id_fk" FOREIGN KEY ("session_exam_id") REFERENCES "public"."session_exam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam_external" ADD CONSTRAINT "session_exam_external_external_id_external_id_fk" FOREIGN KEY ("external_id") REFERENCES "public"."external"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam_instructor" ADD CONSTRAINT "session_exam_instructor_session_exam_id_session_exam_id_fk" FOREIGN KEY ("session_exam_id") REFERENCES "public"."session_exam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam_instructor" ADD CONSTRAINT "session_exam_instructor_instructor_id_instructor_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam_student" ADD CONSTRAINT "session_exam_student_session_exam_id_session_exam_id_fk" FOREIGN KEY ("session_exam_id") REFERENCES "public"."session_exam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exam_student" ADD CONSTRAINT "session_exam_student_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE no action ON UPDATE no action;