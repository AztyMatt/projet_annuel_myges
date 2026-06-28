import express from "express";
import cors from "cors";
import { authRouter } from "@express/src/auth/routes";
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
];

export const app = express();

app.use(cors());
app.use(express.json());

routers.forEach((router) => app.use("/api", router));

app.get("/api/hello", (_request, response) => {
    response.json({ message: "Hello from Express!" });
});
