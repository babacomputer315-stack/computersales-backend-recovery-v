import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
  text,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "bulk_update",
  "bulk_delete",
]);

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  action: auditActionEnum("action").notNull(),
  resourceType: varchar("resource_type", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }), // ID of the affected resource (can be null for bulk operations)
  resourceName: varchar("resource_name", { length: 500 }), // Name/title of the resource for easy identification
  route: varchar("route", { length: 255 }).notNull(), // The API route that was called
  method: varchar("method", { length: 10 }).notNull(), // HTTP method (PUT, PATCH, DELETE)
  requestBody: jsonb("request_body"), // The request body (for updates)
  previousData: jsonb("previous_data"), // Previous state before change (for updates/deletes)
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  user: one(users, {
    fields: [adminAuditLogs.userId],
    references: [users.id],
  }),
}));

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLogs.$inferInsert;
