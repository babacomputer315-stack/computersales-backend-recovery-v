import { categoryToSpecifications } from "../../../db/schema";
import { db } from "../../../db/client";
import { and, eq, max } from "drizzle-orm";
import { BadRequestException } from "../../../utils/apiResponse";

export const categoryToSpecificationService = {
  async getByCategoryId(categoryId: number) {
    return db.query.categoryToSpecifications.findMany({
      where: eq(categoryToSpecifications.categoryId, categoryId),
      with: {
        specification: true,
        category: true,
      },
      orderBy: (cts) => [cts.order],
    });
  },

  async addSpecificationToCategory(
    categoryId: number,
    specificationId: number,
    isRequired: boolean = false,
    order: number | undefined
  ) {
    const exists = await db.query.categoryToSpecifications.findFirst({
      where: and(
        eq(categoryToSpecifications.categoryId, categoryId),
        eq(categoryToSpecifications.specificationId, specificationId)
      ),
    });

    if (exists) {
      throw new BadRequestException(
        "این مشخصه قبلاً به این دسته‌بندی اضافه شده است"
      );
    }

    const [inserted] = await db
      .insert(categoryToSpecifications)
      .values({
        categoryId,
        specificationId,
        isRequired,
        order: order || (await this.getNextOrder(categoryId)),
      })
      .returning();

    return inserted;
  },

  async removeSpecificationFromCategory(
    categoryId: number,
    specificationId: number
  ) {
    await db
      .delete(categoryToSpecifications)
      .where(
        and(
          eq(categoryToSpecifications.categoryId, categoryId),
          eq(categoryToSpecifications.specificationId, specificationId)
        )
      );
  },

  async updateSpecificationOrder(
    categoryId: number,
    specificationId: number,
    order: number
  ) {
    await db
      .update(categoryToSpecifications)
      .set({ order })
      .where(
        and(
          eq(categoryToSpecifications.categoryId, categoryId),
          eq(categoryToSpecifications.specificationId, specificationId)
        )
      );
  },

  async updateCategorySpecification(
    categoryId: number,
    specificationId: number,
    updateData: { isRequired?: boolean; order?: number }
  ) {
    const [updated] = await db
      .update(categoryToSpecifications)
      .set(updateData)
      .where(
        and(
          eq(categoryToSpecifications.categoryId, categoryId),
          eq(categoryToSpecifications.specificationId, specificationId)
        )
      )
      .returning();

    if (!updated) {
      throw new BadRequestException("مشخصه در این دسته‌بندی یافت نشد");
    }

    return updated;
  },

  async getNextOrder(categoryId: number): Promise<number> {
    const result = await db
      .select({ maxOrder: max(categoryToSpecifications.order) })
      .from(categoryToSpecifications)
      .where(eq(categoryToSpecifications.categoryId, categoryId));

    return (result[0].maxOrder || 0) + 1;
  },
};
