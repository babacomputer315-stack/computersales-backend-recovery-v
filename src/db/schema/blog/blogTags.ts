import { relations } from "drizzle-orm";
import { pgTable, varchar, timestamp, serial } from "drizzle-orm/pg-core";
import { blogPostTags } from "./blogPostTags";

export const blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
  posts: many(blogPostTags),
}));

export type BlogTag = typeof blogTags.$inferSelect;
export type NewBlogTag = typeof blogTags.$inferInsert;
