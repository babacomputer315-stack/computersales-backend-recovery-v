import { z } from "zod";

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Coupon code is required").max(50, "Coupon code must be less than 50 characters"),
    type: z.enum(["percentage", "fixed"], {
      errorMap: () => ({ message: "Type must be either 'percentage' or 'fixed'" }),
    }),
    value: z.number().positive("Value must be a positive number"),
    maxUsage: z.number().positive("Max usage must be a positive number").default(1),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    productId: z.number().positive("Product ID must be a positive number").optional(),
    categoryId: z.number().positive("Category ID must be a positive number").optional(),
    isActive: z.boolean().default(true),
  }).refine(
    (data) => {
      // Either productId or categoryId can be set, but not both
      if (data.productId && data.categoryId) {
        return false;
      }
      return true;
    },
    {
      message: "Cannot set both productId and categoryId. Choose one or neither.",
    }
  ).refine(
    (data) => {
      // If type is percentage, value should be between 1 and 100
      if (data.type === "percentage" && (data.value < 1 || data.value > 100)) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage value must be between 1 and 100",
    }
  ).refine(
    (data) => {
      // If dates are provided, startDate should be before endDate
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: "Start date must be before end date",
    }
  ),
});

export const updateCouponSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Coupon ID must be a number"),
  }),
  body: z.object({
    code: z.string().min(1, "Coupon code is required").max(50, "Coupon code must be less than 50 characters").optional(),
    type: z.enum(["percentage", "fixed"]).optional(),
    value: z.number().positive("Value must be a positive number").optional(),
    maxUsage: z.number().positive("Max usage must be a positive number").optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    productId: z.number().positive("Product ID must be a positive number").optional(),
    categoryId: z.number().positive("Category ID must be a positive number").optional(),
    isActive: z.boolean().optional(),
  }).refine(
    (data) => {
      // Either productId or categoryId can be set, but not both
      if (data.productId && data.categoryId) {
        return false;
      }
      return true;
    },
    {
      message: "Cannot set both productId and categoryId. Choose one or neither.",
    }
  ).refine(
    (data) => {
      // If type is percentage, value should be between 1 and 100
      if (data.type === "percentage" && data.value && (data.value < 1 || data.value > 100)) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage value must be between 1 and 100",
    }
  ).refine(
    (data) => {
      // If dates are provided, startDate should be before endDate
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: "Start date must be before end date",
    }
  ),
});

export const getCouponByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Coupon ID must be a number"),
  }),
});

export const deleteCouponSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Coupon ID must be a number"),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Coupon code is required"),
    items: z.array(
      z.object({
        productId: z.number().positive("Product ID must be a positive number"),
        categoryId: z.number().positive("Category ID must be a positive number").optional(),
        quantity: z.number().positive("Quantity must be a positive number"),
        unitPrice: z.number().positive("Unit price must be a positive number"),
      })
    ).min(1, "At least one item is required"),
  }),
});

export const getCouponsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
    search: z.string().optional(),
    type: z.enum(["percentage", "fixed"]).optional(),
    isActive: z.string().transform((val) => val === "true").optional(),
  }),
});
