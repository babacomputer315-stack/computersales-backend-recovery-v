import { eq, sql, and, or, like, desc, asc } from "drizzle-orm";
import { db } from "../../../db/client";
import { productCategories, productToCategories } from "../../../db/schema";
import { createCrudService } from "../base.service";
import { alias } from "drizzle-orm/pg-core";
import { slugify } from "../../../utils/slugify";

const parentCategory = alias(productCategories, "parent_category");

export const getTree = async (filters: any = {}) => {
  const { tree, ...restFilters } = filters;

  // Build query conditions for filtering
  const conditions = [];

  if (restFilters.name) {
    conditions.push(like(productCategories.name, `%${restFilters.name}%`));
  }

  if (restFilters.slug) {
    conditions.push(like(productCategories.slug, `%${restFilters.slug}%`));
  }

  // await updateAllSlugs();

  // Determine sort order
  let sortColumn;
  const sortOrder = restFilters.sortOrder === "asc" ? asc : desc;

  switch (restFilters.sortBy) {
    case "name":
      sortColumn = sortOrder(productCategories.name);
      break;
    case "slug":
      sortColumn = sortOrder(productCategories.slug);
      break;
    case "updatedAt":
      sortColumn = sortOrder(productCategories.updatedAt);
      break;
    case "order":
      sortColumn = sortOrder(productCategories.order);
      break;
    default:
      sortColumn = desc(productCategories.createdAt);
  }

  // Fetch categories directly from database to avoid circular dependency
  const categories = await db
    .select({
      id: productCategories.id,
      name: productCategories.name,
      slug: productCategories.slug,
      parentId: productCategories.parentId,
      imageId: productCategories.imageId,
      bannerId: productCategories.bannerId,
      description: productCategories.description,
      seoTitle: productCategories.seoTitle,
      seoDescription: productCategories.seoDescription,
      createdAt: productCategories.createdAt,
      updatedAt: productCategories.updatedAt,
      order: productCategories.order,
      parent: {
        id: parentCategory.id,
        name: parentCategory.name,
        slug: parentCategory.slug,
      },
    })
    .from(productCategories)
    .leftJoin(parentCategory, eq(productCategories.parentId, parentCategory.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sortColumn);

  // Get product counts for each category
  const productCounts = await db
    .select({
      categoryId: productToCategories.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(productToCategories)
    .groupBy(productToCategories.categoryId);

  const countMap = new Map<number, number>();
  for (const row of productCounts) {
    countMap.set(row.categoryId, row.count);
  }

  // Build tree structure
  const categoryMap = new Map<number, any>();
  const treeData: any[] = [];

  // First pass: create category objects with children arrays
  for (const cat of categories) {
    categoryMap.set(cat.id, {
      ...cat,
      children: [],
      productCount: countMap.get(cat.id) || 0,
    });
  }

  // Second pass: build parent-child relationships
  for (const cat of categories) {
    const current = categoryMap.get(cat.id);
    if (cat.parentId && cat.parentId !== cat.id) {
      // Prevent self-reference
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(current);
      } else {
        // If parent doesn't exist in current dataset, treat as root
        treeData.push(current);
      }
    } else {
      treeData.push(current);
    }
  }

  return treeData;
};

// Update slugs for all product categories
export const updateAllSlugs = async () => {
  const allCategories = await db.select().from(productCategories);

  const usedSlugs = new Set<string>();

  for (const category of allCategories) {
    let baseSlug = slugify(category.slug) || slugify(category.name);

    if (!baseSlug) continue;

    let newSlug = baseSlug;
    let counter = 1;

    // Ensure slug is unique in this batch (not considering DB for performance)
    while (usedSlugs.has(newSlug)) {
      newSlug = `${baseSlug}-${counter++}`;
    }

    usedSlugs.add(newSlug);

    if (newSlug !== category.slug) {
      try {
        await db
          .update(productCategories)
          .set({ slug: newSlug })
          .where(eq(productCategories.id, category.id));
        console.log(`✅ Updated category ${category.id} → ${newSlug}`);
      } catch (err: any) {
        if (err.code === "23505") {
          console.error(
            `⚠️ Duplicate slug skipped for category ${category.id}`
          );
        } else {
          console.error(`❌ Error updating category ${category.id}:`, err);
        }
      }
    }
  }

  console.log("✅ All category slugs updated safely.");
};

export const productCategoryService = createCrudService({
  table: productCategories as any,
  getId: (t) => t.id,
  slugColumn: productCategories.slug,
  searchableFields: ["name", "slug"],
  sortableFields: ["name", "order", "createdAt", "updatedAt"],
  joins: [
    {
      alias: parentCategory as any,
      condition: eq(productCategories.parentId, parentCategory.id),
      select: {
        id: parentCategory.id,
        name: parentCategory.name,
        slug: parentCategory.slug,
      },
      key: "parent",
    },
  ],
  getTreeFn: getTree,
});
