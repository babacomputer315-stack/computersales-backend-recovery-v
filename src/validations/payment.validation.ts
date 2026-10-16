import { z } from "zod";

export const getPaymentByOrderIdSchema = z.object({
  params: z.object({
    orderId: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
});

export const initiatePaymentSchema = z.object({
  params: z.object({
    orderId: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
});

export const verifyPaymentSchema = z.object({
  params: z.object({
    orderId: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
  body: z.object({
    trackingCode: z.string().min(1, "Tracking code is required"),
    provider: z.string().min(1, "Payment provider is required"),
  }),
});

export const getPaymentStatusSchema = z.object({
  params: z.object({
    orderId: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
});

export const refundPaymentSchema = z.object({
  params: z.object({
    orderId: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
});

export const getUserPaymentsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
  }),
});
