import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { productComments, products, users } from "../../db/schema";

export async function listApprovedByProduct(
  productId: number,
  page = 1,
  limit = 20
) {
  const offset = (page - 1) * limit;

  const data = await db
    .select({
      id: productComments.id,
      content: productComments.content,
      createdAt: productComments.createdAt,
      author: {
        id: users.id,
        name: users.name,
      },
      answer: productComments.answer,
      rating: productComments.rating,
    })
    .from(productComments)
    .leftJoin(users, eq(users.id, productComments.authorId))
    .where(
      and(
        eq(productComments.productId, productId),
        eq(productComments.isApproved, true)
      )
    )
    .orderBy(desc(productComments.createdAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(productComments)
    .where(
      and(
        eq(productComments.productId, productId),
        eq(productComments.isApproved, true)
      )
    );
  const total = totalResult[0]?.count ?? 0;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
    },
  };
}

export async function createComment(
  productId: number,
  authorId: number | null,
  content: string,
  rating: number
) {
  // Ensure product exists
  const product = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product[0]) return null;

  const [inserted] = await db
    .insert(productComments)
    .values({ productId, authorId: authorId ?? null, content, rating })
    .returning();
  return inserted;
}
