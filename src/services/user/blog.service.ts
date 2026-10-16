import { db } from "../../db/client";
import { blogPosts } from "../../db/schema/blog/blogPosts";
import { blogCategories } from "../../db/schema/blog/blogCategories";
import { blogTags } from "../../db/schema/blog/blogTags";
import { blogPostTags } from "../../db/schema/blog/blogPostTags";
import { eq, and, ilike, or, sql, lte, gte } from "drizzle-orm";
import { NotFoundException } from "../../utils/apiResponse";

export class UserBlogService {
  /**
   * Get all published blog posts with filtering, search, and pagination
   */
  static async getAll(
    options: {
      page?: number;
      limit?: number;
      sortBy?: "title" | "publishedAt" | "createdAt";
      sortOrder?: "asc" | "desc";
      filters?: {
        search?: string;
        categoryId?: number;
        categorySlug?: string;
        tagId?: number;
        tagSlug?: string;
        tagIds?: number[];
        publishedAfter?: Date;
        publishedBefore?: Date;
      };
    } = {}
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = "publishedAt",
      sortOrder = "desc",
      filters = {},
    } = options;

    const whereClauses = [];

    // Only show published posts
    whereClauses.push(eq(blogPosts.status, "published"));

    // Search in title, excerpt, and content
    if (filters.search) {
      whereClauses.push(
        or(
          ilike(blogPosts.title, `%${filters.search}%`),
          ilike(blogPosts.excerpt, `%${filters.search}%`),
          ilike(blogPosts.content, `%${filters.search}%`)
        )
      );
    }

    // Filter by category ID
    if (filters.categoryId) {
      whereClauses.push(eq(blogPosts.categoryId, filters.categoryId));
    }

    // Filter by category slug - get category ID first
    if (filters.categorySlug) {
      const category = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.slug, filters.categorySlug),
        columns: { id: true },
      });
      if (category) {
        whereClauses.push(eq(blogPosts.categoryId, category.id));
      } else {
        // If category not found, return empty results
        whereClauses.push(sql`false`);
      }
    }

    // Filter by tag ID
    if (filters.tagId) {
      whereClauses.push(
        sql`EXISTS (
          SELECT 1 FROM ${blogPostTags} 
          WHERE ${blogPostTags.postId} = ${blogPosts.id} 
          AND ${blogPostTags.tagId} = ${filters.tagId}
        )`
      );
    }

    // Filter by tag slug - get tag ID first
    if (filters.tagSlug) {
      const tag = await db.query.blogTags.findFirst({
        where: eq(blogTags.slug, filters.tagSlug),
        columns: { id: true },
      });
      if (tag) {
        whereClauses.push(
          sql`EXISTS (
            SELECT 1 FROM ${blogPostTags} 
            WHERE ${blogPostTags.postId} = ${blogPosts.id} 
            AND ${blogPostTags.tagId} = ${tag.id}
          )`
        );
      } else {
        // If tag not found, return empty results
        whereClauses.push(sql`false`);
      }
    }

    // Filter by multiple tag IDs
    if (filters.tagIds?.length) {
      whereClauses.push(
        sql`EXISTS (
          SELECT 1 FROM ${blogPostTags} 
          WHERE ${blogPostTags.postId} = ${blogPosts.id} 
          AND ${blogPostTags.tagId} = ANY(${filters.tagIds})
        )`
      );
    }

    // Filter by published date range
    if (filters.publishedAfter) {
      whereClauses.push(gte(blogPosts.publishedAt, filters.publishedAfter));
    }
    if (filters.publishedBefore) {
      whereClauses.push(lte(blogPosts.publishedAt, filters.publishedBefore));
    }

    const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

    // Pagination
    const offset = (page - 1) * limit;

    // Main query
    const data = await db.query.blogPosts.findMany({
      where,
      limit,
      offset,
      orderBy: (fields, { asc, desc }) => {
        const field = fields[sortBy as keyof typeof fields];
        return sortOrder === "asc" ? asc(field) : desc(field);
      },
      with: {
        author: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: true,
        thumbnail: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(blogPosts)
      .where(where ?? sql`true`);

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get a blog post by ID
   */
  static async getById(id: number) {
    const result = await db.query.blogPosts.findFirst({
      where: and(eq(blogPosts.id, id), eq(blogPosts.status, "published")),
      with: {
        author: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: true,
        thumbnail: true,
        tags: {
          with: {
            tag: true,
          },
        },
        comments: {
          where: (comments, { eq }) => eq(comments.isApproved, true),
          orderBy: (comments, { desc }) => desc(comments.createdAt),
          with: {
            author: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException("Blog post not found");
    }

    return result;
  }

  /**
   * Get a blog post by slug
   */
  static async getBySlug(slug: string) {
    const result = await db.query.blogPosts.findFirst({
      where: and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")),
      with: {
        author: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: true,
        thumbnail: true,
        tags: {
          with: {
            tag: true,
          },
        },
        comments: {
          where: (comments, { eq }) => eq(comments.isApproved, true),
          orderBy: (comments, { desc }) => desc(comments.createdAt),
          with: {
            author: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException("Blog post not found");
    }

    return result;
  }

  /**
   * Get recent blog posts
   */
  static async getRecent(limit: number = 5) {
    return db.query.blogPosts.findMany({
      where: eq(blogPosts.status, "published"),
      limit,
      orderBy: (fields, { desc }) => desc(fields.publishedAt),
      with: {
        author: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        thumbnail: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });
  }

  /**
   * Get related blog posts (same category)
   */
  static async getRelated(postId: number, limit: number = 5) {
    // Get the post's category
    const post = await db.query.blogPosts.findFirst({
      where: and(eq(blogPosts.id, postId), eq(blogPosts.status, "published")),
      columns: {
        categoryId: true,
      },
    });

    if (!post || !post.categoryId) {
      return [];
    }

    // Get posts from the same category, excluding the current post
    return db.query.blogPosts.findMany({
      where: and(
        eq(blogPosts.status, "published"),
        eq(blogPosts.categoryId, post.categoryId),
        sql`${blogPosts.id} != ${postId}`
      ),
      limit,
      orderBy: (fields, { desc }) => desc(fields.publishedAt),
      with: {
        author: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        thumbnail: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });
  }

  /**
   * Get all blog categories
   */
  static async getAllCategories() {
    return db.query.blogCategories.findMany({
      orderBy: (fields, { asc }) => asc(fields.name),
    });
  }

  /**
   * Get a blog category by slug
   */
  static async getCategoryBySlug(slug: string) {
    const result = await db.query.blogCategories.findFirst({
      where: eq(blogCategories.slug, slug),
    });

    if (!result) {
      throw new NotFoundException("Category not found");
    }

    return result;
  }

  /**
   * Get all blog tags
   */
  static async getAllTags() {
    return db.query.blogTags.findMany({
      orderBy: (fields, { asc }) => asc(fields.name),
    });
  }

  /**
   * Get a blog tag by slug
   */
  static async getTagBySlug(slug: string) {
    const result = await db.query.blogTags.findFirst({
      where: eq(blogTags.slug, slug),
    });

    if (!result) {
      throw new NotFoundException("Tag not found");
    }

    return result;
  }

  /**
   * Search blog posts
   */
  static async search(query: string, limit: number = 20) {
    return db.query.blogPosts.findMany({
      where: and(
        eq(blogPosts.status, "published"),
        or(
          ilike(blogPosts.title, `%${query}%`),
          ilike(blogPosts.excerpt, `%${query}%`),
          ilike(blogPosts.content, `%${query}%`)
        )
      ),
      limit,
      orderBy: (fields, { desc }) => desc(fields.publishedAt),
      with: {
        author: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        thumbnail: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });
  }
}
