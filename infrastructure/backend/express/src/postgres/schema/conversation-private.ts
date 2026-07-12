import { pgTable, text, unique } from "drizzle-orm/pg-core";
import { users } from "@express/src/postgres/schema/auth";
import { conversation } from "@express/src/postgres/schema/conversation";

export const conversationPrivate = pgTable("conversation_private", {
    id: text("id").primaryKey(),
    userAId: text("user_a_id")
        .references(() => users.id, { onDelete: "set null" }),
    userBId: text("user_b_id")
        .references(() => users.id, { onDelete: "set null" }),
    conversationId: text("conversation_id")
        .notNull()
        .references(() => conversation.id, { onDelete: "cascade" }),
}, (table) => ({
    pairUnique: unique().on(table.userAId, table.userBId),
}));
