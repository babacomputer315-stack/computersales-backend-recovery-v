import { pgTable, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { blogPosts } from "./blogPosts";
import { blogTags } from "./blogTags";
import { relations } from "drizzle-orm";

export const blogPostTags = pgTable("blog_post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => blogPosts.id),
  tagId: integer("tag_id")
    .notNull()
    .references(() => blogTags.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id],
  }),
}));

export type BlogPostTag = typeof blogPostTags.$inferSelect;
export type NewBlogPostTag = typeof blogPostTags.$inferInsert;
