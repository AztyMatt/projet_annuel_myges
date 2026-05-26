import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as authSchema from "./schema/auth"
import * as academicYearSchema from "./schema/academic-year"
import * as absenceSchema from "./schema/absence"
import * as adminSchema from "./schema/admin"
import * as assessmentSchema from "./schema/assessment"
import * as auditLogSchema from "./schema/audit-log"
import * as blocSchema from "./schema/bloc"
import * as campusSchema from "./schema/campus"
import * as classSchema from "./schema/class"
import * as classroomSchema from "./schema/classroom"
import * as companySchema from "./schema/company"
import * as conversationSchema from "./schema/conversation"
import * as conversationPrivateSchema from "./schema/conversation-private"
import * as courseSchema from "./schema/course"
import * as documentSchema from "./schema/document"
import * as externalSchema from "./schema/external"
import * as fileSchema from "./schema/file"
import * as gradeSchema from "./schema/grade"
import * as groupSchema from "./schema/group"
import * as instructorSchema from "./schema/instructor"
import * as messageSchema from "./schema/message"
import * as moduleSchema from "./schema/module"
import * as periodSchema from "./schema/period"
import * as programSchema from "./schema/program"
import * as programModuleSchema from "./schema/program-module"
import * as sessionSchema from "./schema/session"
import * as studentSchema from "./schema/student"

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
})

export const db = drizzle(pool, {
  schema: {
    ...authSchema,
    ...academicYearSchema,
    ...absenceSchema,
    ...adminSchema,
    ...assessmentSchema,
    ...auditLogSchema,
    ...blocSchema,
    ...campusSchema,
    ...classSchema,
    ...classroomSchema,
    ...companySchema,
    ...conversationSchema,
    ...conversationPrivateSchema,
    ...courseSchema,
    ...documentSchema,
    ...externalSchema,
    ...fileSchema,
    ...gradeSchema,
    ...groupSchema,
    ...instructorSchema,
    ...messageSchema,
    ...moduleSchema,
    ...periodSchema,
    ...programSchema,
    ...programModuleSchema,
    ...sessionSchema,
    ...studentSchema,
  },
})
