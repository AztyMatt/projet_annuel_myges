import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { zDateString, patchBody } from "@express/src/http/zod-schemas";
import { AssessmentType } from "@domain/assessment/assessment.enums";
import { assessmentUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";

export const assessmentRouter = Router();

const createAssessmentSchema = z.object({
    courseId: z.string().min(1),
    title: z.string().min(1),
    type: z.enum(Object.values(AssessmentType) as [string, ...string[]]),
    dueDate: zDateString,
    maxGroupSize: z.number().int().positive(),
    isPublished: z.boolean().optional(),
});

const updateAssessmentSchema = patchBody({
    title: z.string().min(1).optional(),
    type: z.enum(Object.values(AssessmentType) as [string, ...string[]]).optional(),
    isPublished: z.boolean().optional(),
    dueDate: zDateString.optional(),
    maxGroupSize: z.number().int().positive().optional(),
});

const createAssessmentGroupSchema = z.object({
    assessmentId: z.string().min(1),
    studentIds: z.array(z.string().min(1)).optional(),
});

const addAssessmentGroupMemberSchema = z.object({
    assessmentGroupId: z.string().min(1),
    studentId: z.string().min(1),
});

assessmentRouter.get("/assessments", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.list(auth);
    respond(res, result, {
        assessments_listed: (r) => ({ status: 200, body: r.assessments }),
    });
}));

assessmentRouter.get("/assessments/:id", ...authed(async (req, res) => {
    const result = await assessmentUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Assessment not found" },
        assessment_found: (r) => ({ status: 200, body: r.assessment }),
    });
}));

assessmentRouter.post("/assessments", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.create(req.body, auth);
    respond(res, result, {
        course_not_found: { status: 404, error: "Course not found" },
        course_finished: { blocked: { type: "Creation", reason: "Cannot create an assessment on a finished course" } },
        assessment_already_exists: { blocked: { type: "Creation", reason: "An assessment with this title and due date already exists for this course" } },
        assessment_created: (r) => ({ status: 201, body: r.assessment }),
    });
}, createAssessmentSchema));

assessmentRouter.patch("/assessments/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Assessment not found" },
        assessment_locked: { blocked: { type: "Operation", reason: "A published assessment only allows editing its title, due date and instructions" } },
        assessment_updated: (r) => ({ status: 200, body: r.assessment }),
    });
}, updateAssessmentSchema));

assessmentRouter.post("/assessments/:id/publish", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.publish(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Assessment not found" },
        assessment_published: (r) => ({ status: 200, body: r.assessment }),
    });
}));

assessmentRouter.delete("/assessments/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Assessment not found" },
        assessment_has_grades: { blocked: { type: "Deletion", reason: "Assessment has grades" } },
        assessment_has_submissions: { blocked: { type: "Deletion", reason: "Assessment has student submissions" } },
        assessment_linked_to_session_exam: { blocked: { type: "Deletion", reason: "Assessment has a linked session exam" } },
        assessment_deleted_with_warnings: (r) => ({ status: 200, body: { message: "Assessment deleted", storageWarnings: r.failedPaths } }),
        assessment_deleted: { status: 200, body: { message: "Assessment deleted" } },
    });
}));

assessmentRouter.get("/courses/:courseId/assessments", ...authed(async (req, res) => {
    const result = await assessmentUseCases.listByCourse(String(req.params.courseId));
    respond(res, result, {
        assessments_listed: (r) => ({ status: 200, body: r.assessments }),
    });
}));

assessmentRouter.get("/assessment-groups/assessment/:assessmentId", ...authed(async (req, res) => {
    const result = await assessmentUseCases.listGroupsByAssessment(String(req.params.assessmentId));
    respond(res, result, {
        assessment_groups_listed: (r) => ({ status: 200, body: r.assessmentGroups }),
    });
}));

assessmentRouter.get("/assessment-groups/:id", ...authed(async (req, res) => {
    const result = await assessmentUseCases.findGroupById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Assessment group not found" },
        assessment_group_found: (r) => ({ status: 200, body: r.assessmentGroup }),
    });
}));

assessmentRouter.post("/assessment-groups", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.createGroup(req.body, auth);
    respond(res, result, {
        members_required: { status: 400, error: "at least one studentId is required when the creator is not a student" },
        assessment_not_found: { status: 404, error: "Assessment not found" },
        assessment_not_published: { blocked: { type: "Creation", reason: "The assessment is not published yet" } },
        past_due_date: { blocked: { type: "Creation", reason: "The assessment due date has passed" } },
        group_full: { blocked: { type: "Creation", reason: "Group size exceeds the assessment maximum" } },
        student_not_in_course_group: { blocked: { type: "Creation", reason: "Student does not belong to the course group" } },
        student_already_in_group: { blocked: { type: "Creation", reason: "Student already belongs to a group for this assessment" } },
        assessment_group_created: (r) => ({ status: 201, body: r.assessmentGroup }),
    });
}, createAssessmentGroupSchema));

assessmentRouter.delete("/assessment-groups/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.deleteGroup(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Assessment group not found" },
        assessment_group_has_submissions: { blocked: { type: "Deletion", reason: "Assessment group has submissions" } },

        assessment_group_has_grades: { blocked: { type: "Operation", reason: "Assessment group has been graded" } },
        assessment_group_deleted: { status: 200, body: { message: "Assessment group deleted" } },
    });
}));

assessmentRouter.get("/assessment-group-members/group/:assessmentGroupId", ...authed(async (req, res) => {
    const result = await assessmentUseCases.listGroupMembersByGroup(String(req.params.assessmentGroupId));
    respond(res, result, {
        assessment_group_members_listed: (r) => ({ status: 200, body: r.members }),
    });
}));

assessmentRouter.get("/assessment-group-members/student/:studentId", ...authed(async (req, res) => {
    const result = await assessmentUseCases.listGroupMembersByStudent(String(req.params.studentId));
    respond(res, result, {
        assessment_group_members_listed: (r) => ({ status: 200, body: r.members }),
    });
}));

assessmentRouter.get("/assessment-group-members/:id", ...authed(async (req, res) => {
    const result = await assessmentUseCases.findGroupMemberById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Assessment group member not found" },
        assessment_group_member_found: (r) => ({ status: 200, body: r.member }),
    });
}));

assessmentRouter.post("/assessment-group-members", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.addGroupMember(req.body, auth);
    respond(res, result, {
        assessment_group_missing: { status: 404, error: "Assessment group not found" },
        assessment_not_found: { status: 404, error: "Assessment not found" },
        assessment_not_published: { blocked: { type: "Creation", reason: "The assessment is not published yet" } },
        past_due_date: { blocked: { type: "Creation", reason: "The assessment due date has passed" } },
        group_full: { blocked: { type: "Creation", reason: "Group size exceeds the assessment maximum" } },
        student_not_in_course_group: { blocked: { type: "Creation", reason: "Student does not belong to the course group" } },
        student_already_in_group: { blocked: { type: "Creation", reason: "Student already belongs to a group for this assessment" } },
        member_already_exists: { blocked: { type: "Creation", reason: "This student is already a member of this assessment group" } },
        assessment_group_member_added: (r) => ({ status: 201, body: r.member }),
    });
}, addAssessmentGroupMemberSchema));

assessmentRouter.delete("/assessment-group-members/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.deleteGroupMember(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Assessment group member not found" },
        assessment_group_missing: { blocked: { type: "Operation", reason: "Assessment group missing, cannot verify grades" } },
        assessment_group_has_submissions: { blocked: { type: "Operation", reason: "Group has submissions, its roster is locked" } },
        assessment_group_has_grades: { blocked: { type: "Operation", reason: "Group has been graded, its roster is locked" } },
        assessment_group_member_deleted: { status: 200, body: { message: "Assessment group member deleted" } },
    });
}));
