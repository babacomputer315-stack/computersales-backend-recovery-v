import { blogComments, users, blogPosts } from "../../../db/schema";
import { createCrudService } from "../base.service";
import { eq } from "drizzle-orm";

export const blogCommentService = createCrudService({
  table: blogComments as any,
  getId: (table) => table.id,
  searchableFields: ["content"],
  sortableFields: ["createdAt", "updatedAt"],
  joins: [
    {
      alias: users,
      condition: eq(users.id, blogComments.authorId),
      select: {
        id: users.id,
        name: users.name,
      },
      key: "author",
    },
    {
      alias: blogPosts,
      condition: eq(blogPosts.id, blogComments.postId),
      select: {
        id: blogPosts.id,
        title: blogPosts.title,
      },
      key: "post",
    },
  ],
});
