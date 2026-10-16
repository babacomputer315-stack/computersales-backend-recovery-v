import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const staticPages = pgTable("static_pages", {
  id: serial("id").primaryKey(),

  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),

  content: text("content").notNull(),

  isPublished: boolean("is_published").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type StaticPage = typeof staticPages.$inferSelect;
export type NewStaticPage = typeof staticPages.$inferInsert;
