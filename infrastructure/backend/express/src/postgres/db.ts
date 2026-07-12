import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "@express/src/postgres/schema/auth";
import * as academicYearSchema from "@express/src/postgres/schema/academic-year";
import * as absenceSchema from "@express/src/postgres/schema/absence";
import * as adminSchema from "@express/src/postgres/schema/admin";
import * as assessmentSchema from "@express/src/postgres/schema/assessment";
import * as auditLogSchema from "@express/src/postgres/schema/audit-log";
import * as blocSchema from "@express/src/postgres/schema/bloc";
import * as campusSchema from "@express/src/postgres/schema/campus";
import * as classSchema from "@express/src/postgres/schema/class";
import * as classroomSchema from "@express/src/postgres/schema/classroom";
import * as companySchema from "@express/src/postgres/schema/company";
import * as conversationSchema from "@express/src/postgres/schema/conversation";
import * as conversationPrivateSchema from "@express/src/postgres/schema/conversation-private";
import * as courseSchema from "@express/src/postgres/schema/course";
import * as documentSchema from "@express/src/postgres/schema/document";
import * as externalSchema from "@express/src/postgres/schema/external";
import * as fileSchema from "@express/src/postgres/schema/file";
import * as gradeSchema from "@express/src/postgres/schema/grade";
import * as groupSchema from "@express/src/postgres/schema/group";
import * as instructorSchema from "@express/src/postgres/schema/instructor";
import * as messageSchema from "@express/src/postgres/schema/message";
import * as moduleSchema from "@express/src/postgres/schema/module";
import * as notificationSchema from "@express/src/postgres/schema/notification";
import * as periodSchema from "@express/src/postgres/schema/period";
import * as programSchema from "@express/src/postgres/schema/program";
import * as programModuleSchema from "@express/src/postgres/schema/program-module";
import * as sessionSchema from "@express/src/postgres/schema/session";
import * as studentSchema from "@express/src/postgres/schema/student";

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
});

export const rootDb = drizzle(pool, {
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
        ...notificationSchema,
        ...periodSchema,
        ...programSchema,
        ...programModuleSchema,
        ...sessionSchema,
        ...studentSchema,
    },
});

type Tx = Parameters<Parameters<typeof rootDb.transaction>[0]>[0];
export const txStore = new AsyncLocalStorage<Tx>();

export const db: typeof rootDb = new Proxy(rootDb, {
    get(target, prop) {
        const active = (txStore.getStore() ?? target) as typeof target;
        const value = Reflect.get(active, prop, active);
        return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(active) : value;
    },
});
