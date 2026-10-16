import { blogPosts, blogPostTags } from "../../../db/schema";
import { db } from "../../../db/client";
import { eq } from "drizzle-orm";
import { cleanHtml } from "../../../utils/htmlCleaner";

export class BlogPostService {
  static async getAll() {
    return db.query.blogPosts.findMany({
      with: {
        author: true,
        category: true,
        thumbnail: true,
        tags: {
          with: { tag: true },
        },
        comments: true,
      },
    });
  }

  static async getById(id: number) {
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
      with: {
        author: true,
        category: true,
        thumbnail: true,
        tags: {
          with: { tag: true },
        },
        comments: true,
      },
    });

    if (!post) throw new Error("پست یافت نشد");
    return post;
  }

  static async create(data: any) {
    const { tags, ...postData } = data;

    const cleanedContent = cleanHtml(postData.content || "");

    const [created] = await db
      .insert(blogPosts)
      .values({
        ...postData,
        content: cleanedContent,
      })
      .returning();

    if (tags?.length) {
      const tagEntries = tags.map((tagId: number) => ({
        postId: created.id,
        tagId,
      }));
      await db.insert(blogPostTags).values(tagEntries);
    }

    return created;
  }

  static async update(id: number, data: any) {
    const {
      categoryId,
      content,
      excerpt,
      publishedAt,
      seoDescription,
      seoTitle,
      slug,
      status,
      tags,
      thumbnailId,
      title,
    } = data;

    const cleanedContent = cleanHtml(content || "");

    const [updated] = await db
      .update(blogPosts)
      .set({
        categoryId,
        content: cleanedContent,
        excerpt,
        publishedAt,
        seoDescription,
        seoTitle,
        slug,
        status,
        thumbnailId,
        title,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();

    // حذف تگ‌های قبلی
    await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));

    // اضافه کردن تگ‌های جدید
    if (tags?.length) {
      const tagEntries = tags.map((tagId: number) => ({
        postId: id,
        tagId,
      }));
      await db.insert(blogPostTags).values(tagEntries);
    }

    return updated;
  }

  static async remove(id: number) {
    // حذف تگ‌های مربوط به پست
    await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));

    // حذف پست
    const [deleted] = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();

    if (!deleted) throw new Error("پست برای حذف پیدا نشد");

    return deleted;
  }
}
