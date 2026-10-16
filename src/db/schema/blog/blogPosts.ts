import {
  pgTable,
  varchar,
  timestamp,
  serial,
  text,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { blogCategories } from "./blogCategories";
import { users } from "../users";
import { relations } from "drizzle-orm";
import { blogPostTags } from "./blogPostTags";
import { blogComments } from "./blogComments";
import { BlogTag } from "./blogTags";
import { files } from "../files";

export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  status: postStatusEnum("status").notNull().default("draft"),
  authorId: integer("author_id").references(() => users.id),
  categoryId: integer("category_id").references(() => blogCategories.id),
  publishedAt: timestamp("published_at"),
  thumbnailId: integer("thumbnail_id").references(() => files.id),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  thumbnail: one(files, {
    fields: [blogPosts.thumbnailId],
    references: [files.id],
  }),
  tags: many(blogPostTags),
  comments: many(blogComments),
}));

export type BlogPostWithRelations = BlogPost & {
  author?: typeof users.$inferSelect;
  category: typeof blogCategories.$inferSelect;
  thumbnail?: typeof files.$inferSelect;
  comments?: (typeof blogComments.$inferSelect)[];
  tags?: (typeof blogPostTags.$inferSelect & {
    tag: BlogTag;
  })[];
};

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
