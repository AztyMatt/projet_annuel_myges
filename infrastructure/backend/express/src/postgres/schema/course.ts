import { pgTable, text, unique } from "drizzle-orm/pg-core";
import { instructor } from "@express/src/postgres/schema/instructor";
import { module } from "@express/src/postgres/schema/module";
import { group } from "@express/src/postgres/schema/group";
import { bloc } from "@express/src/postgres/schema/bloc";
import { conversation } from "@express/src/postgres/schema/conversation";

export const course = pgTable("course", {
    id: text("id").primaryKey(),
    instructorId: text("instructor_id")
        .notNull()
        .references(() => instructor.id),
    moduleId: text("module_id")
        .notNull()
        .references(() => module.id),
    groupId: text("group_id")
        .notNull()
        .references(() => group.id),
    blocId: text("bloc_id")
        .notNull()
        .references(() => bloc.id),
    conversationId: text("conversation_id")
        .notNull()
        .references(() => conversation.id),
}, (table) => ({
    courseUnique: unique().on(table.instructorId, table.moduleId, table.groupId),
}));
