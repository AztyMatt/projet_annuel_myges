import express from "express";
import cors from "cors";
import { authRouter } from "@express/src/auth/routes";
import { planningRouter } from "@express/src/planning/routes";
import { adminRouter } from "@express/src/admin/routes";
import { studentRouter } from "@express/src/student/routes";
import { instructorRouter } from "@express/src/instructor/routes";
import { campusRouter } from "@express/src/campus/routes";
import { classroomRouter } from "@express/src/classroom/routes";
import { moduleRouter } from "@express/src/module/routes";
import { academicYearRouter } from "@express/src/academic-year/routes";
import { periodRouter } from "@express/src/period/routes";
import { programRouter } from "@express/src/program/routes";
import { blocRouter } from "@express/src/bloc/routes";
import { classRouter } from "@express/src/class/routes";
import { groupRouter } from "@express/src/group/routes";
import { courseRouter } from "@express/src/course/routes";
import { sessionRouter } from "@express/src/session/routes";
import { sessionExamRouter } from "@express/src/session-exam/routes";
import { assessmentRouter } from "@express/src/assessment/routes";
import { gradeRouter } from "@express/src/grade/routes";
import { absenceRouter } from "@express/src/absence/routes";
import { conversationRouter } from "@express/src/conversation/routes";
import { messageRouter } from "@express/src/message/routes";
import { companyRouter } from "@express/src/company/routes";
import { externalRouter } from "@express/src/external/routes";
import { fileRouter } from "@express/src/file/routes";
import { documentRouter } from "@express/src/document/routes";
import { auditLogRouter } from "@express/src/audit-log/routes";
import { notificationRouter } from "@express/src/notification/routes";
import { send } from "@express/src/http/responses";

const routers = [
    authRouter,
    adminRouter,
    studentRouter,
    instructorRouter,
    campusRouter,
    classroomRouter,
    moduleRouter,
    academicYearRouter,
    periodRouter,
    programRouter,
    blocRouter,
    classRouter,
    groupRouter,
    courseRouter,
    sessionRouter,
    sessionExamRouter,
    assessmentRouter,
    gradeRouter,
    absenceRouter,
    conversationRouter,
    messageRouter,
    companyRouter,
    externalRouter,
    fileRouter,
    documentRouter,
    auditLogRouter,
    planningRouter,
    notificationRouter,
];

export const app = express();

app.use(cors());
app.use(express.json());

routers.forEach((router) => app.use("/api", router));

app.get("/api/hello", (_request, response) => {
    send(response, { status: 200, body: { message: "Bonjour depuis Express !" } });
});

app.use((err: { code?: string; detail?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.code === "23505") return void send(res, { blocked: { type: "Creation", reason: "Cette entrée existe déjà" } });
    if (err.code === "23503") {
        const stillReferenced = typeof err.detail === "string" && err.detail.includes("still referenced");
        return void send(res, stillReferenced
            ? { blocked: { type: "Deletion", reason: "Cet enregistrement est encore référencé par d'autres données" } }
            : { blocked: { type: "Creation", reason: "Un enregistrement référencé n'existe pas" } });
    }

    console.error(err);
    send(res, { status: 500, error: "Internal server error" });
});
