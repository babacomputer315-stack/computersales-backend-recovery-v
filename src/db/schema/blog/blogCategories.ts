import { relations } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, serial } from "drizzle-orm/pg-core";
import { blogPosts } from "./blogPosts";

export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogCategoriesRelations = relations(
  blogCategories,
  ({ many }) => ({
    posts: many(blogPosts),
  })
);

export type BlogCategory = typeof blogCategories.$inferSelect;
export type NewBlogCategory = typeof blogCategories.$inferInsert;
