import { db } from "../../db/client";
import { coupons, products, productCategories } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { fetchPaginatedList } from "../../utils/queryBuilder";

export class CouponService {
  // Get paginated coupons with filters
  async getPaginatedCoupons(filters: any) {
    return fetchPaginatedList({
      table: coupons,
      filters,
      searchableFields: ["code"],
      sortableFields: [
        "code",
        "type",
        "value",
        "createdAt",
        "updatedAt",
        "usedCount",
      ],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
      page: filters.page,
      limit: filters.limit,
      joins: [
        {
          alias: products as any,
          condition: eq(coupons.productId, products.id),
          select: {
            id: products.id,
            name: products.name,
            slug: products.slug,
          },
          key: "product",
        },
        {
          alias: productCategories as any,
          condition: eq(coupons.categoryId, productCategories.id),
          select: {
            id: productCategories.id,
            name: productCategories.name,
            slug: productCategories.slug,
          },
          key: "category",
        },
      ],
    });
  }

  // Get coupon by ID
  async getCouponById(id: number) {
    const result = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        type: coupons.type,
        value: coupons.value,
        maxUsage: coupons.maxUsage,
        usedCount: coupons.usedCount,
        startDate: coupons.startDate,
        endDate: coupons.endDate,
        productId: coupons.productId,
        categoryId: coupons.categoryId,
        isActive: coupons.isActive,
        createdAt: coupons.createdAt,
        updatedAt: coupons.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
        },
        category: {
          id: productCategories.id,
          name: productCategories.name,
          slug: productCategories.slug,
        },
      })
      .from(coupons)
      .leftJoin(products, eq(coupons.productId, products.id))
      .leftJoin(productCategories, eq(coupons.categoryId, productCategories.id))
      .where(eq(coupons.id, id))
      .limit(1);

    return result[0] || null;
  }

  // Get coupon by code
  async getCouponByCode(code: string) {
    const result = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        type: coupons.type,
        value: coupons.value,
        maxUsage: coupons.maxUsage,
        usedCount: coupons.usedCount,
        startDate: coupons.startDate,
        endDate: coupons.endDate,
        productId: coupons.productId,
        categoryId: coupons.categoryId,
        isActive: coupons.isActive,
        createdAt: coupons.createdAt,
        updatedAt: coupons.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
        },
        category: {
          id: productCategories.id,
          name: productCategories.name,
          slug: productCategories.slug,
        },
      })
      .from(coupons)
      .leftJoin(products, eq(coupons.productId, products.id))
      .leftJoin(productCategories, eq(coupons.categoryId, productCategories.id))
      .where(eq(coupons.code, code))
      .limit(1);

    return result[0] || null;
  }

  // Create new coupon
  async createCoupon(data: {
    code: string;
    type: "percentage" | "fixed";
    value: number;
    maxUsage?: number;
    startDate?: Date;
    endDate?: Date;
    productId?: number;
    categoryId?: number;
    isActive?: boolean;
  }) {
    const result = await db
      .insert(coupons)
      .values({
        code: data.code,
        type: data.type,
        value: data.value,
        maxUsage: data.maxUsage || 1,
        startDate: data.startDate,
        endDate: data.endDate,
        productId: data.productId,
        categoryId: data.categoryId,
        isActive: data.isActive ?? true,
      })
      .returning();

    return result[0];
  }

  // Update coupon
  async updateCoupon(
    id: number,
    data: Partial<{
      code: string;
      type: "percentage" | "fixed";
      value: number;
      maxUsage: number;
      startDate: Date;
      endDate: Date;
      productId: number;
      categoryId: number;
      isActive: boolean;
    }>
  ) {
    const result = await db
      .update(coupons)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, id))
      .returning();

    return result[0] || null;
  }

  // Delete coupon
  async deleteCoupon(id: number) {
    const result = await db
      .delete(coupons)
      .where(eq(coupons.id, id))
      .returning();

    return result[0] || null;
  }

  // Validate coupon for application
  async validateCoupon(
    code: string,
    items: Array<{
      productId: number;
      categoryId?: number;
      quantity: number;
      unitPrice: number;
    }>
  ) {
    const coupon = await this.getCouponByCode(code);

    if (!coupon) {
      return { valid: false, error: "Coupon code not found" };
    }

    if (!coupon.isActive) {
      return { valid: false, error: "Coupon is not active" };
    }

    // Check if coupon has reached max usage
    if (coupon.usedCount >= coupon.maxUsage) {
      return { valid: false, error: "Coupon has reached maximum usage limit" };
    }

    // Check date validity
    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return { valid: false, error: "Coupon is not yet active" };
    }

    if (coupon.endDate && now > coupon.endDate) {
      return { valid: false, error: "Coupon has expired" };
    }

    // Check if coupon applies to any of the items
    let applicableItems = items;

    if (coupon.productId) {
      applicableItems = items.filter(
        (item) => item.productId === coupon.productId
      );
      if (applicableItems.length === 0) {
        return {
          valid: false,
          error: "Coupon does not apply to any items in your cart",
        };
      }
    }

    if (coupon.categoryId) {
      applicableItems = items.filter(
        (item) => item.categoryId === coupon.categoryId
      );
      if (applicableItems.length === 0) {
        return {
          valid: false,
          error: "Coupon does not apply to any items in your cart",
        };
      }
    }

    // Calculate discount amount
    const totalAmount = applicableItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    let discountAmount = 0;

    if (coupon.type === "percentage") {
      discountAmount = Math.round((totalAmount * coupon.value) / 100);
    } else {
      discountAmount = Math.min(coupon.value, totalAmount);
    }

    return {
      valid: true,
      coupon,
      discountAmount,
      applicableItems,
    };
  }

  // Increment coupon usage
  async incrementCouponUsage(id: number) {
    const result = await db
      .update(coupons)
      .set({
        usedCount: sql`${coupons.usedCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, id))
      .returning();

    return result[0] || null;
  }

  // Get coupon statistics
  async getCouponStats() {
    const stats = await db
      .select({
        totalCoupons: sql<number>`count(*)`,
        activeCoupons: sql<number>`count(*) filter (where is_active = true)`,
        expiredCoupons: sql<number>`count(*) filter (where end_date < now())`,
        totalUsage: sql<number>`sum(used_count)`,
      })
      .from(coupons);

    return stats[0];
  }

  // Get coupons with usage count (for admin list)
  async getCouponsWithUsageCount(filters: any) {
    const result = await this.getPaginatedCoupons(filters);

    // Add usage count for each coupon
    const couponsWithUsage = await Promise.all(
      result.data.map(async (coupon: any) => {
        const usageCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(coupons)
          .where(eq(coupons.id, coupon.id));

        return {
          ...coupon,
          usageCount: usageCount[0]?.count || 0,
        };
      })
    );
    // console.log(couponsWithUsage);
    return result;
    // return {
    //   ...result,
    //   data: couponsWithUsage,
    // };
  }
}

export const couponService = new CouponService();
