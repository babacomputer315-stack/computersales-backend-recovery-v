import { db } from "../../db/client";
import {
  categoryToSpecifications,
  specifications,
  specificationOptions,
  productCategories,
} from "../../db/schema";
import { eq, and } from "drizzle-orm";

export interface CategorySpecificationWithOptions {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  type: "text" | "select" | "multi_select";
  unit: string | null;
  isSearchable: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  order: number;
  options?: Array<{
    id: number;
    value: string;
    label: string;
    description: string | null;
    order: number;
    isActive: boolean;
  }>;
}

export class UserCategorySpecificationService {
  static async getByCategoryId(
    categoryId: number
  ): Promise<CategorySpecificationWithOptions[]> {
    const categorySpecs = await db.query.categoryToSpecifications.findMany({
      where: eq(categoryToSpecifications.categoryId, categoryId),
      with: {
        specification: {
          with: {
            options: {
              where: eq(specificationOptions.isActive, true),
              orderBy: (options, { asc }) => [asc(options.order)],
            },
          },
        },
      },
      orderBy: (cts, { asc }) => [asc(cts.order)],
    });

    return categorySpecs.map((cs) => ({
      id: cs.specification.id,
      name: cs.specification.name,
      slug: cs.specification.slug || "",
      description: cs.specification.description,
      type: cs.specification.type,
      unit: cs.specification.unit,
      isSearchable: cs.specification.isSearchable ?? true,
      isFilterable: cs.specification.isFilterable ?? true,
      isComparable: cs.specification.isComparable ?? true,
      isRequired: cs.isRequired ?? false,
      order: cs.order ?? 0,
      options: cs.specification.options?.map((option) => ({
        id: option.id,
        value: option.value,
        label: option.label,
        description: option.description,
        order: option.order ?? 0,
        isActive: option.isActive ?? true,
      })),
    }));
  }

  static async getByCategorySlug(
    categorySlug: string
  ): Promise<CategorySpecificationWithOptions[]> {
    // First get the category by slug
    const category = await db.query.productCategories.findFirst({
      where: eq(productCategories.slug, categorySlug),
    });

    if (!category) {
      return [];
    }

    return this.getByCategoryId(category.id);
  }

  static async getByCategoryIdOrSlug(
    identifier: string | number
  ): Promise<CategorySpecificationWithOptions[]> {
    if (typeof identifier === "number") {
      return this.getByCategoryId(identifier);
    } else {
      return this.getByCategorySlug(identifier);
    }
  }
}
