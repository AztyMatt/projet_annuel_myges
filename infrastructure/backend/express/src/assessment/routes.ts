import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { assessmentUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";

export const assessmentRouter = Router();

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
        missing_fields: { status: 400, error: "courseId, title, type, dueDate and maxGroupSize are required" },
        assessment_already_exists: { blocked: { type: "Creation", reason: "An assessment with this title and due date already exists for this course" } },
        assessment_created: (r) => ({ status: 201, body: r.assessment }),
    });
}));

assessmentRouter.patch("/assessments/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Assessment not found" },
        assessment_updated: (r) => ({ status: 200, body: r.assessment }),
    });
}));

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
        missing_fields: { status: 400, error: "assessmentId is required" },
        members_required: { status: 400, error: "at least one studentId is required when the creator is not a student" },
        assessment_group_created: (r) => ({ status: 201, body: r.assessmentGroup }),
    });
}));

assessmentRouter.delete("/assessment-groups/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await assessmentUseCases.deleteGroup(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Assessment group not found" },
        assessment_group_has_submissions: { blocked: { type: "Deletion", reason: "Assessment group has submissions" } },
        assessment_group_has_grades: { blocked: { type: "Deletion", reason: "Assessment group has been graded" } },
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
    const result = await assessmentUseCases.addGroupMember(req.body);
    respond(res, result, {
        missing_fields: { status: 400, error: "assessmentGroupId and studentId are required" },
        member_already_exists: { blocked: { type: "Creation", reason: "This student is already a member of this assessment group" } },
        assessment_group_member_added: (r) => ({ status: 201, body: r.member }),
    });
}));

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
