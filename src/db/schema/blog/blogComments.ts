import {
  pgTable,
  timestamp,
  serial,
  integer,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { blogPosts } from "./blogPosts";
import { relations } from "drizzle-orm";
import { User, users } from "../users";

export const blogComments = pgTable("blog_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => blogPosts.id),
  authorId: integer("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull(),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogCommentsRelations = relations(blogComments, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogComments.postId],
    references: [blogPosts.id],
  }),
  author: one(users, {
    fields: [blogComments.authorId],
    references: [users.id],
  }),
}));

export type BlogCommentWithRelations = BlogComment & {
  author?: User;
};

export type BlogComment = typeof blogComments.$inferSelect;
export type NewBlogComment = typeof blogComments.$inferInsert;
