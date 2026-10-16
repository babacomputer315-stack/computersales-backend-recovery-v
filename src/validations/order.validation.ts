import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        productId: z.number().positive("Product ID must be a positive number"),
        variationId: z.number().positive("Variation ID must be a positive number").optional(),
        quantity: z.number().positive("Quantity must be a positive number").min(1, "Quantity must be at least 1"),
      })
    ).min(1, "At least one item is required"),
    shippingAddressId: z.number().positive("Shipping address ID must be a positive number"),
    paymentMethod: z.enum(["bank_transfer", "gateway"]).optional().default("gateway"),
    customerNote: z.string().max(500, "Customer note must be less than 500 characters").optional(),
    couponCode: z.string().optional(),
  }),
});

export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
});

export const getOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
});

export const getUserOrdersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
  }),
});
