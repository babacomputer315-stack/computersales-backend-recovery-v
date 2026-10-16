import { db } from "../../db/client";
import {
  specifications,
  specificationOptions,
  productSpecifications,
  productSpecificationOptions,
  products,
  Specification,
  NewSpecification,
  SpecificationOption,
  NewSpecificationOption,
  ProductSpecification,
  NewProductSpecification,
  categoryToSpecifications,
} from "../../db/schema";
import { eq, and, inArray, or, sql, desc, asc } from "drizzle-orm";
import { fetchPaginatedList } from "../../utils/queryBuilder";

export class SpecificationService {
  // Specification Management
  async getPaginatedSpecifications(filters: any) {
    return fetchPaginatedList({
      table: specifications,
      filters,
      searchableFields: ["name", "description"],
      sortableFields: ["name", "type", "createdAt", "updatedAt"],
      defaultSortBy: "name",
      defaultSortOrder: "asc",
      page: filters.page,
      limit: filters.limit,
    });
  }

  async getSpecificationById(id: number): Promise<Specification | null> {
    const result = await db
      .select()
      .from(specifications)
      .where(eq(specifications.id, id));
    return result[0] || null;
  }

  async getSpecificationWithOptions(id: number) {
    const spec = await db.query.specifications.findFirst({
      where: eq(specifications.id, id),
      with: {
        options: {
          orderBy: [asc(specificationOptions.order)],
        },
      },
    });
    return spec;
  }

  async createSpecification(data: NewSpecification): Promise<Specification> {
    const [spec] = await db.insert(specifications).values(data).returning();
    return spec;
  }

  async updateSpecification(
    id: number,
    data: Partial<NewSpecification>
  ): Promise<Specification | null> {
    const result = await db
      .update(specifications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(specifications.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteSpecification(id: number): Promise<void> {
    await db.delete(specifications).where(eq(specifications.id, id));
  }

  // Specification Options Management
  async getSpecificationOptions(specificationId: number): Promise<any[]> {
    // const result = await db
    //   .select()
    //   .from(specificationOptions)
    //   .innerJoin(
    //     specifications,
    //     eq(specificationOptions.specificationId, specifications.id)
    //   )
    //   .where(eq(specificationOptions.specificationId, specificationId))
    //   .orderBy(asc(specificationOptions.order));
    // return result;
    const result = await db.query.specificationOptions.findMany({
      where: eq(specificationOptions.specificationId, specificationId),
      with: {
        specification: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: (options, { asc }) => [asc(options.order)],
    });
    return result;
  }

  async createSpecificationOption(
    data: NewSpecificationOption
  ): Promise<SpecificationOption> {
    const [option] = await db
      .insert(specificationOptions)
      .values(data)
      .returning();
    return option;
  }

  async updateSpecificationOption(
    id: number,
    data: Partial<NewSpecificationOption>
  ): Promise<SpecificationOption | null> {
    const result = await db
      .update(specificationOptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(specificationOptions.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteSpecificationOption(id: number): Promise<void> {
    await db
      .delete(specificationOptions)
      .where(eq(specificationOptions.id, id));
  }

  async bulkCreateSpecificationOptions(
    specificationId: number,
    options: Omit<NewSpecificationOption, "specificationId">[]
  ): Promise<SpecificationOption[]> {
    const optionsWithSpecId = options.map((option) => ({
      ...option,
      specificationId,
    }));
    const result = await db
      .insert(specificationOptions)
      .values(optionsWithSpecId)
      .returning();
    return result;
  }

  // Product Specifications Management
  async getProductSpecifications(productId: number) {
    const result = await db.query.productSpecifications.findMany({
      where: eq(productSpecifications.productId, productId),
      with: {
        specification: {
          with: {
            options: {
              orderBy: [asc(specificationOptions.order)],
            },
          },
        },
        option: true,
        selectedOptions: {
          with: {
            option: true,
          },
        },
      },
    });
    return result;
  }

  async setProductSpecification(
    data: NewProductSpecification
  ): Promise<ProductSpecification> {
    // Check if specification already exists for this product
    const existing = await db
      .select()
      .from(productSpecifications)
      .where(
        and(
          eq(productSpecifications.productId, data.productId),
          eq(productSpecifications.specificationId, data.specificationId)
        )
      );

    if (existing.length > 0) {
      // Update existing
      const [updated] = await db
        .update(productSpecifications)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(productSpecifications.id, existing[0].id))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(productSpecifications)
        .values(data)
        .returning();
      return created;
    }
  }

  async setProductSpecificationOptions(
    productSpecId: number,
    optionIds: number[]
  ): Promise<void> {
    // Remove existing options
    await db
      .delete(productSpecificationOptions)
      .where(
        eq(productSpecificationOptions.productSpecificationId, productSpecId)
      );

    // Add new options
    if (optionIds.length > 0) {
      const options = optionIds.map((optionId) => ({
        productSpecificationId: productSpecId,
        optionId,
      }));
      await db.insert(productSpecificationOptions).values(options);
    }
  }

  async deleteProductSpecification(
    productId: number,
    specificationId: number
  ): Promise<void> {
    await db
      .delete(productSpecifications)
      .where(
        and(
          eq(productSpecifications.productId, productId),
          eq(productSpecifications.specificationId, specificationId)
        )
      );
  }

  // Product Filtering by Specifications
  async filterProductsBySpecifications(filters: {
    specifications?: Array<{
      specificationId: number;
      value?: string | number | boolean;
      optionId?: number;
      optionIds?: number[]; // For multi-select
      minValue?: number; // For numeric ranges
      maxValue?: number; // For numeric ranges
    }>;
  }) {
    if (!filters.specifications || filters.specifications.length === 0) {
      return [];
    }

    const conditions = filters.specifications.map((filter) => {
      const baseCondition = eq(
        productSpecifications.specificationId,
        filter.specificationId
      );

      if (filter.value !== undefined) {
        return and(
          baseCondition,
          eq(productSpecifications.value, filter.value.toString())
        );
      }

      if (filter.optionId !== undefined) {
        return and(
          baseCondition,
          eq(productSpecifications.optionId, filter.optionId)
        );
      }

      if (filter.optionIds && filter.optionIds.length > 0) {
        return and(
          baseCondition,
          inArray(productSpecificationOptions.optionId, filter.optionIds)
        );
      }

      if (filter.minValue !== undefined || filter.maxValue !== undefined) {
        const numericConditions = [];
        if (filter.minValue !== undefined) {
          numericConditions.push(
            sql`CAST(${productSpecifications.value} AS NUMERIC) >= ${filter.minValue}`
          );
        }
        if (filter.maxValue !== undefined) {
          numericConditions.push(
            sql`CAST(${productSpecifications.value} AS NUMERIC) <= ${filter.maxValue}`
          );
        }
        return and(baseCondition, ...numericConditions);
      }

      return baseCondition;
    });

    const productIds = await db
      .selectDistinct({ productId: productSpecifications.productId })
      .from(productSpecifications)
      .leftJoin(
        productSpecificationOptions,
        eq(
          productSpecifications.id,
          productSpecificationOptions.productSpecificationId
        )
      )
      .where(or(...conditions));

    return productIds.map((p) => p.productId);
  }

  // Get specifications by category
  async getSpecificationsByCategory(categoryId: number) {
    const result = await db.query.categoryToSpecifications.findMany({
      where: eq(categoryToSpecifications.categoryId, categoryId),
      with: {
        specification: {
          with: {
            options: {
              orderBy: [asc(specificationOptions.order)],
            },
          },
        },
      },
      orderBy: [asc(categoryToSpecifications.order)],
    });
    return result;
  }

  // Get specification statistics
  async getSpecificationStats() {
    const stats = await db
      .select({
        totalSpecifications: sql<number>`COUNT(DISTINCT ${specifications.id})::int`,
        totalOptions: sql<number>`COUNT(DISTINCT ${specificationOptions.id})::int`,
        totalProductSpecs: sql<number>`COUNT(DISTINCT ${productSpecifications.id})::int`,
      })
      .from(specifications)
      .leftJoin(
        specificationOptions,
        eq(specifications.id, specificationOptions.specificationId)
      )
      .leftJoin(
        productSpecifications,
        eq(specifications.id, productSpecifications.specificationId)
      );

    const typeStats = await db
      .select({
        type: specifications.type,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(specifications)
      .groupBy(specifications.type);

    return {
      overall: stats[0],
      byType: typeStats,
    };
  }
}

export const specificationService = new SpecificationService();
