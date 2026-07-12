import { userRepository } from "@express/src/postgres/auth/user.adapter";
import { twoFactorSessionRepository } from "@express/src/postgres/auth/two-factor-session.adapter";
import { passwordResetTokenRepository } from "@express/src/postgres/auth/password-reset-token.adapter";
import { adminRepository } from "@express/src/postgres/admin/admin.adapter";
import { studentRepository } from "@express/src/postgres/student/student.adapter";
import { instructorRepository } from "@express/src/postgres/instructor/instructor.adapter";
import { campusRepository } from "@express/src/postgres/campus/campus.adapter";
import { classroomRepository } from "@express/src/postgres/classroom/classroom.adapter";
import { moduleRepository } from "@express/src/postgres/module/module.adapter";
import { academicYearRepository } from "@express/src/postgres/academic-year/academic-year.adapter";
import { periodRepository } from "@express/src/postgres/period/period.adapter";
import { programRepository } from "@express/src/postgres/program/program.adapter";
import { programModuleRepository } from "@express/src/postgres/program/program-module/program-module.adapter";
import { blocRepository } from "@express/src/postgres/bloc/bloc.adapter";
import { classRepository } from "@express/src/postgres/class/class.adapter";
import { groupRepository } from "@express/src/postgres/group/group.adapter";
import { studentGroupRepository } from "@express/src/postgres/group/student-group/student-group.adapter";
import { courseRepository } from "@express/src/postgres/course/course.adapter";
import { sessionRepository } from "@express/src/postgres/session/session.adapter";
import { assessmentRepository } from "@express/src/postgres/assessment/assessment.adapter";
import { gradeRepository } from "@express/src/postgres/grade/grade.adapter";
import { absenceRepository } from "@express/src/postgres/absence/absence.adapter";
import { conversationRepository } from "@express/src/postgres/conversation/conversation.adapter";
import { messageRepository } from "@express/src/postgres/message/message.adapter";
import { companyRepository } from "@express/src/postgres/company/company.adapter";
import { externalRepository } from "@express/src/postgres/external/external.adapter";
import { auditLogRepository } from "@express/src/postgres/audit-log/audit-log.adapter";
import { sessionExamRepository } from "@express/src/postgres/session/session-exam/session-exam.adapter";
import { sessionExamStudentRepository } from "@express/src/postgres/session/session-exam/session-exam-student/session-exam-student.adapter";
import { sessionExamInstructorRepository } from "@express/src/postgres/session/session-exam/session-exam-instructor/session-exam-instructor.adapter";
import { sessionExamExternalRepository } from "@express/src/postgres/session/session-exam/session-exam-external/session-exam-external.adapter";
import { assessmentGroupRepository } from "@express/src/postgres/assessment/assessment-group/assessment-group.adapter";
import { assessmentGroupMemberRepository } from "@express/src/postgres/assessment/assessment-group-member/assessment-group-member.adapter";
import { gradeAssessmentRepository } from "@express/src/postgres/grade/grade-assessment/grade-assessment.adapter";
import { gradeSessionExamRepository } from "@express/src/postgres/grade/grade-session-exam/grade-session-exam.adapter";
import { gradeManualNotationRepository } from "@express/src/postgres/grade/grade-manual-notation/grade-manual-notation.adapter";
import { manualNotationRepository } from "@express/src/postgres/grade/grade-manual-notation/manual-notation/manual-notation.adapter";
import { fileRepository } from "@express/src/postgres/file/file.adapter";
import { fileCourseRepository } from "@express/src/postgres/file/file-course/file-course.adapter";
import { fileDocumentRepository } from "@express/src/postgres/file/file-document/file-document.adapter";
import { fileJustificationRepository } from "@express/src/postgres/file/file-justification/file-justification.adapter";
import { fileAssessmentRepository } from "@express/src/postgres/file/file-assessment/file-assessment.adapter";
import { fileAssessmentInstructionRepository } from "@express/src/postgres/file/file-assessment-instruction/file-assessment-instruction.adapter";
import { documentAdministrativeRepository } from "@express/src/postgres/document/document-administrative/document-administrative.adapter";
import { documentApprenticeshipContractRepository } from "@express/src/postgres/document/document-apprenticeship-contract/document-apprenticeship-contract.adapter";
import { messageReadRepository } from "@express/src/postgres/message/message-read/message-read.adapter";
import { conversationPrivateRepository } from "@express/src/postgres/conversation/conversation-private/conversation-private.adapter";
import { storageService } from "@express/src/storage/storage.adapter";
import { unitOfWork } from "@express/src/postgres/unit-of-work";
import { passwordHasher } from "@express/src/auth/password-hasher.adapter";
import { tokenProvider } from "@express/src/auth/token-provider.adapter";
import { totpProvider } from "@express/src/auth/totp-provider.adapter";
import { emailSender } from "@express/src/auth/email-sender.adapter";

import { AuthUseCases } from "@application/auth/auth.use-cases";
import { AdminUseCases } from "@application/admin/admin.use-cases";
import { StudentUseCases } from "@application/student/student.use-cases";
import { InstructorUseCases } from "@application/instructor/instructor.use-cases";
import { CampusUseCases } from "@application/campus/campus.use-cases";
import { ClassroomUseCases } from "@application/classroom/classroom.use-cases";
import { ModuleUseCases } from "@application/module/module.use-cases";
import { AcademicYearUseCases } from "@application/academic-year/academic-year.use-cases";
import { PeriodUseCases } from "@application/period/period.use-cases";
import { ProgramUseCases } from "@application/program/program.use-cases";
import { BlocUseCases } from "@application/bloc/bloc.use-cases";
import { ClassUseCases } from "@application/class/class.use-cases";
import { GroupUseCases } from "@application/group/group.use-cases";
import { CourseUseCases } from "@application/course/course.use-cases";
import { SessionUseCases } from "@application/session/session.use-cases";
import { AssessmentUseCases } from "@application/assessment/assessment.use-cases";
import { GradeUseCases } from "@application/grade/grade.use-cases";
import { AbsenceUseCases } from "@application/absence/absence.use-cases";
import { ConversationUseCases } from "@application/conversation/conversation.use-cases";
import { MessageUseCases } from "@application/message/message.use-cases";
import { CompanyUseCases } from "@application/company/company.use-cases";
import { ExternalUseCases } from "@application/external/external.use-cases";
import { AuditLogUseCases } from "@application/audit-log/audit-log.use-cases";
import { SessionExamUseCases } from "@application/session/session-exam/session-exam.use-cases";
import { FileUseCases } from "@application/file/file.use-cases";
import { DocumentUseCases } from "@application/document/document.use-cases";
import { PlanningUseCases } from "@application/planning/planning.use-cases";

export const authUseCases = new AuthUseCases(
    userRepository,
    adminRepository,
    studentRepository,
    instructorRepository,
    fileRepository,
    messageRepository,
    messageReadRepository,
    auditLogRepository,
    passwordHasher,
    tokenProvider,
    totpProvider,
    twoFactorSessionRepository,
    passwordResetTokenRepository,
    emailSender,
    process.env.FRONTEND_PUBLIC_URL ?? "http://localhost:3000",
);

export const adminUseCases = new AdminUseCases(adminRepository, userRepository);
export const studentUseCases = new StudentUseCases(studentRepository, studentGroupRepository, absenceRepository, sessionExamStudentRepository, assessmentGroupMemberRepository, fileDocumentRepository, userRepository, programRepository);
export const instructorUseCases = new InstructorUseCases(instructorRepository, courseRepository, sessionExamInstructorRepository, userRepository);
export const campusUseCases = new CampusUseCases(campusRepository, classroomRepository);
export const classroomUseCases = new ClassroomUseCases(classroomRepository, sessionRepository, campusRepository);
export const moduleUseCases = new ModuleUseCases(moduleRepository, programModuleRepository, courseRepository, manualNotationRepository);
export const academicYearUseCases = new AcademicYearUseCases(academicYearRepository, periodRepository, unitOfWork);
export const periodUseCases = new PeriodUseCases(periodRepository, programRepository, academicYearRepository);
export const programUseCases = new ProgramUseCases(programRepository, programModuleRepository, classRepository, blocRepository, studentRepository, periodRepository, moduleRepository);
export const blocUseCases = new BlocUseCases(blocRepository, courseRepository, programRepository);
export const classUseCases = new ClassUseCases(classRepository, groupRepository, studentGroupRepository, courseRepository, blocRepository, programModuleRepository, conversationRepository, unitOfWork, programRepository);
export const groupUseCases = new GroupUseCases(groupRepository, studentGroupRepository, courseRepository, classRepository, blocRepository, programModuleRepository, studentRepository);
export const courseUseCases = new CourseUseCases(courseRepository, sessionRepository, assessmentRepository, fileCourseRepository, fileRepository, storageService, conversationRepository, groupRepository, classRepository, blocRepository, programModuleRepository, unitOfWork, instructorRepository);
export const sessionUseCases = new SessionUseCases(sessionRepository, sessionExamRepository, absenceRepository, courseRepository, instructorRepository, classroomRepository, studentGroupRepository, studentRepository);
export const assessmentUseCases = new AssessmentUseCases(
    assessmentRepository,
    assessmentGroupRepository,
    assessmentGroupMemberRepository,
    fileAssessmentRepository,
    gradeAssessmentRepository,
    courseRepository,
    studentRepository,
    fileAssessmentInstructionRepository,
    fileRepository,
    storageService,
    sessionExamRepository,
    instructorRepository,
    studentGroupRepository,
    sessionRepository,
    unitOfWork,
);
export const gradeUseCases = new GradeUseCases(
    gradeRepository,
    gradeAssessmentRepository,
    gradeSessionExamRepository,
    gradeManualNotationRepository,
    manualNotationRepository,
    studentRepository,
    assessmentRepository,
    courseRepository,
    instructorRepository,
    sessionExamRepository,
    sessionRepository,
    sessionExamStudentRepository,
    moduleRepository,
);
export const absenceUseCases = new AbsenceUseCases(
    absenceRepository,
    fileJustificationRepository,
    fileRepository,
    storageService,
    unitOfWork,
    studentRepository,
    sessionRepository,
    courseRepository,
    instructorRepository,
    studentGroupRepository,
);
export const conversationUseCases = new ConversationUseCases(
    conversationRepository,
    conversationPrivateRepository,
    courseRepository,
    classRepository,
    unitOfWork,
    instructorRepository,
    studentRepository,
    groupRepository,
    userRepository,
);
export const messageUseCases = new MessageUseCases(messageRepository, messageReadRepository, conversationPrivateRepository, courseRepository, classRepository, groupRepository, studentGroupRepository, studentRepository, instructorRepository);
export const companyUseCases = new CompanyUseCases(companyRepository, documentApprenticeshipContractRepository);
export const externalUseCases = new ExternalUseCases(externalRepository, sessionExamExternalRepository);
export const auditLogUseCases = new AuditLogUseCases(auditLogRepository);
export const sessionExamUseCases = new SessionExamUseCases(
    sessionExamRepository,
    sessionExamStudentRepository,
    sessionExamInstructorRepository,
    sessionExamExternalRepository,
    sessionRepository,
    gradeSessionExamRepository,
    studentRepository,
    instructorRepository,
    externalRepository,
    assessmentRepository,
    courseRepository,
    studentGroupRepository,
);
export const planningUseCases = new PlanningUseCases(
    studentRepository,
    instructorRepository,
    studentGroupRepository,
    groupRepository,
    classRepository,
    courseRepository,
    moduleRepository,
    classroomRepository,
    sessionRepository,
    sessionExamRepository,
);
export const fileUseCases = new FileUseCases(
    fileRepository,
    fileCourseRepository,
    fileDocumentRepository,
    fileJustificationRepository,
    fileAssessmentRepository,
    fileAssessmentInstructionRepository,
    assessmentRepository,
    documentAdministrativeRepository,
    documentApprenticeshipContractRepository,
    storageService,
    assessmentGroupMemberRepository,
    studentRepository,
    assessmentGroupRepository,
    absenceRepository,
    unitOfWork,
    courseRepository,
    instructorRepository,
    sessionRepository,
);
export const documentUseCases = new DocumentUseCases(
    documentAdministrativeRepository,
    documentApprenticeshipContractRepository,
    fileDocumentRepository,
    fileRepository,
    companyRepository,
    storageService,
    unitOfWork,
    studentRepository,
);

export { userRepository };
