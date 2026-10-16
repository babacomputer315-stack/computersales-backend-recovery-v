import { desc, eq } from "drizzle-orm";
import { createCrudService } from "../base.service";
import { productComments, products, users } from "../../../db/schema";
import { db } from "../../../db/client";

export const adminProductCommentService = createCrudService({
  table: productComments as any,
  getId: (table) => table.id,
  searchableFields: ["content"],
  sortableFields: ["createdAt", "updatedAt"],
  joins: [
    {
      alias: users,
      condition: eq(users.id, productComments.authorId),
      select: {
        id: users.id,
        name: users.name,
      },
      key: "author",
    },
    {
      alias: products,
      condition: eq(products.id, productComments.productId),
      select: {
        id: products.id,
        name: products.name,
      },
      key: "product",
    },
  ],
});

export async function getUserCommentsService(userId: number) {
  const data = await db.query.productComments.findMany({
    where: eq(productComments.authorId, userId),
    with: {
      product: true,
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: (comments, { desc }) => [desc(comments.createdAt)],
  });

  return data;
}

export async function setApproval(id: number, isApproved: boolean) {
  const [updated] = await db
    .update(productComments)
    .set({ isApproved, updatedAt: new Date() })
    .where(eq(productComments.id, id))
    .returning();
  return updated || null;
}

export async function setAnswer(id: number, answer: string) {
  const [updated] = await db
    .update(productComments)
    .set({ answer, updatedAt: new Date() })
    .where(eq(productComments.id, id))
    .returning();
  return updated || null;
}
