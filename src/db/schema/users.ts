import {
  pgTable,
  varchar,
  timestamp,
  serial,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { addresses } from "./addresses";
import { blogComments } from "./blog/blogComments";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
  "super_admin",
]);
export const userStatusEnum = pgEnum("user_status", ["active", "blocked"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  nationalCode: varchar("national_code", { length: 10 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 11 }),
  birthDate: date("birth_date"),
  mobile: varchar("mobile", { length: 11 }).notNull().unique(),
  code: varchar("code", { length: 4 }),
  role: userRoleEnum("role").notNull().default("user"),
  status: userStatusEnum("status").default("active"),
  createdAt: timestamp("created_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  comments: many(blogComments),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
