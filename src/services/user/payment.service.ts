import { db } from "../../db/client";
import {
  orderItems,
  orders,
  OrderWithFullDetails,
  payments,
  productVariations,
  products,
  users,
} from "../../db/schema";
import { eq, and, count } from "drizzle-orm";
import {
  NotFoundException,
  BadRequestException,
} from "../../utils/apiResponse";

type TransactionClient = Parameters<typeof db.transaction>[0] extends (
  tx: infer T
) => any
  ? T
  : never;
import { PecService, PecCallbackData } from "./pec.service";

// Payment provider types
export type PaymentProvider = "zibal" | "pec";

export interface PaymentVerificationData {
  trackingCode: string;
  provider: PaymentProvider;
}

export interface ZibalPaymentRequest {
  merchant: string;
  amount: number;
  callbackUrl: string;
  description?: string;
  orderId?: string;
  mobile?: string;
  allowedCards?: string[];
  linkToPay?: boolean;
  sms?: boolean;
  factorNumber?: string;
}

export interface ZibalPaymentResponse {
  result: number;
  message: string;
  trackId?: string;
  payLink?: string;
}

export interface ZibalVerificationRequest {
  merchant: string;
  trackId: string;
}

export interface ZibalVerificationResponse {
  result: number;
  message: string;
  amount: number;
  paidAt: string;
  cardNumber: string;
  refNumber: string;
  status: number;
  description: string;
}

export class UserPaymentService {
  private static readonly ZIBAL_API_URL = "https://gateway.zibal.ir/v1/request";
  private static readonly ZIBAL_VERIFY_URL =
    "https://gateway.zibal.ir/v1/verify";

  // Use getters to access env vars at runtime (not at class load time)
  private static get ZIBAL_MERCHANT_ID(): string {
    return process.env.ZIBAL_MERCHANT_ID || "";
  }

  private static get CALLBACK_BASE_URL(): string {
    return (
      process.env.CALLBACK_BASE_URL || "http://localhost:3000/cart/checkout"
    );
  }

  /**
   * Validate payment provider configuration
   */
  private static validateProviderConfig(provider: PaymentProvider): void {
    // console.log({
    //   ZIBAL_MERCHANT_ID: process.env.ZIBAL_MERCHANT_ID,
    //   PEC_PIN: process.env.PEC_PIN,
    //   CALLBACK_BASE_URL: process.env.CALLBACK_BASE_URL,
    //   provider,
    // });
    if (provider === "zibal") {
      if (!process.env.ZIBAL_MERCHANT_ID) {
        throw new BadRequestException(
          "Zibal payment is not configured. ZIBAL_MERCHANT_ID environment variable is missing."
        );
      }
    } else if (provider === "pec") {
      if (!process.env.PEC_PIN) {
        throw new BadRequestException(
          "PEC payment is not configured. PEC_PIN environment variable is missing."
        );
      }
      if (!process.env.CALLBACK_BASE_URL) {
        throw new BadRequestException(
          "CALLBACK_BASE_URL environment variable is required for PEC payment."
        );
      }
      // PEC requires HTTPS callback URL in production
      const callbackUrl = process.env.CALLBACK_BASE_URL;
      if (
        !callbackUrl.startsWith("https://") &&
        !callbackUrl.includes("localhost")
      ) {
        throw new BadRequestException(
          "PEC requires HTTPS callback URL. Please set a valid HTTPS URL in CALLBACK_BASE_URL."
        );
      }
    }
  }

  static async getPaymentByOrderId(userId: number, orderId: number) {
    const payment = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        provider: payments.provider,
        status: payments.status,
        amount: payments.amount,
        trackingCode: payments.trackingCode,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          totalAmount: orders.totalAmount,
        },
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(and(eq(payments.orderId, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!payment.length) {
      throw new NotFoundException("Payment not found");
    }

    return payment[0];
  }

  static async getUserPayments(userId: number, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const userPayments = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        provider: payments.provider,
        status: payments.status,
        amount: payments.amount,
        trackingCode: payments.trackingCode,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          totalAmount: orders.totalAmount,
        },
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(orders.userId, userId))
      .orderBy(payments.createdAt)
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(orders.userId, userId));

    return {
      payments: userPayments,
      pagination: {
        page,
        limit,
        total: totalResult[0].count,
        totalPages: Math.ceil(totalResult[0].count / limit),
      },
    };
  }

  /**
   * Initiate payment with selected provider
   * @param userId - User ID
   * @param orderId - Order ID
   * @param provider - Payment provider (zibal or pec)
   */
  static async initiatePayment(
    userId: number,
    orderId: number,
    provider: PaymentProvider = "zibal"
  ) {
    // Validate provider configuration first
    this.validateProviderConfig(provider);

    // Verify order belongs to user and is pending
    const order = (await db
      .select()
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1)) as any[];

    if (!order.length) {
      throw new NotFoundException("Order not found");
    }

    const orderData = order[0].orders;
    const userData = order[0].users;

    if (orderData.status !== "pending") {
      throw new BadRequestException("Order is not in pending status");
    }

    // Get or create payment record
    let payment = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (!payment.length) {
      // Create new payment record
      const [newPayment] = await db
        .insert(payments)
        .values({
          orderId,
          provider,
          status: "pending",
          amount: orderData.totalAmount || 0,
        })
        .returning();
      payment = [newPayment];
    } else {
      // Update provider if different
      if (payment[0].provider !== provider) {
        const [updatedPayment] = await db
          .update(payments)
          .set({ provider, updatedAt: new Date() })
          .where(eq(payments.id, payment[0].id))
          .returning();
        payment = [updatedPayment];
      }
    }

    try {
      if (provider === "pec") {
        return await this.initiatePecPayment(orderData, payment[0]);
      } else {
        return await this.initiateZibalPayment(orderData, userData, payment[0]);
      }
    } catch (error) {
      // Update payment status to failed
      console.error("Payment initiation failed:", error);
      await db
        .update(payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment[0].id));

      throw new BadRequestException(
        `Payment initiation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Initiate payment with PEC (Parsian) gateway
   */
  private static async initiatePecPayment(orderData: any, payment: any) {
    // Amount in Rials (multiply by 10 if stored in Tomans)
    const amountInRials = Number(`${orderData.totalAmount}0`) || 0;

    // Request sale token from PEC
    const pecResponse = await PecService.requestSale(
      amountInRials,
      payment.id, // Use payment ID as OrderId for uniqueness
      this.CALLBACK_BASE_URL
    );

    if (PecService.isSuccessful(pecResponse.Status, pecResponse.Token)) {
      // Success - update payment with PEC token
      const [updatedPayment] = await db
        .update(payments)
        .set({
          trackingCode: pecResponse.Token.toString(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();

      return {
        payment: updatedPayment,
        paymentUrl: PecService.getPaymentUrl(pecResponse.Token),
        trackingCode: pecResponse.Token.toString(),
        provider: "pec",
        pecResponse: {
          status: pecResponse.Status,
          token: pecResponse.Token,
          message: PecService.getStatusMessage(pecResponse.Status),
        },
      };
    } else {
      // PEC API error
      console.error("PEC payment initiation failed:", pecResponse);
      throw new BadRequestException(
        `PEC payment initiation failed: ${PecService.getStatusMessage(
          pecResponse.Status
        )}`
      );
    }
  }

  /**
   * Initiate payment with Zibal gateway
   */
  private static async initiateZibalPayment(
    orderData: any,
    userData: any,
    payment: any
  ) {
    const zibalRequest: ZibalPaymentRequest = {
      merchant: UserPaymentService.ZIBAL_MERCHANT_ID,
      amount: Number(`${orderData.totalAmount}0`) || 0,
      callbackUrl: `${UserPaymentService.CALLBACK_BASE_URL}`,
      description: `Payment for order #${orderData.orderNumber}`,
      orderId: orderData.id.toString(),
      mobile: userData?.mobile || undefined,
    };

    const response = await fetch(UserPaymentService.ZIBAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(zibalRequest),
    });

    const zibalResponse: ZibalPaymentResponse = await response.json();

    if (zibalResponse.result === 100) {
      // Success - update payment with Zibal tracking ID
      const [updatedPayment] = await db
        .update(payments)
        .set({
          trackingCode: zibalResponse.trackId,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();

      return {
        payment: updatedPayment,
        paymentUrl: `https://gateway.zibal.ir/start/${zibalResponse.trackId}`,
        trackingCode: zibalResponse.trackId,
        provider: "zibal",
        zibalResponse: {
          result: zibalResponse.result,
          message: zibalResponse.message,
        },
      };
    } else {
      console.error("Zibal payment initiation failed:", zibalResponse);
      throw new BadRequestException(
        `Zibal payment initiation failed: ${zibalResponse.message}`
      );
    }
  }

  /**
   * Verify payment based on provider
   */
  static async verifyPayment(
    userId: number,
    orderId: number,
    verificationData: PaymentVerificationData
  ) {
    // Verify order belongs to user
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order.length) {
      throw new NotFoundException("Order not found");
    }

    // Get payment record
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (!payment.length) {
      throw new NotFoundException("Payment not found");
    }

    // Verify tracking code matches
    if (payment[0].trackingCode !== verificationData.trackingCode) {
      throw new BadRequestException("Invalid tracking code");
    }

    const provider = verificationData.provider || payment[0].provider;

    if (provider === "pec") {
      return await this.verifyPecPayment(payment[0], order[0]);
    } else {
      return await this.verifyZibalPayment(
        payment[0],
        order[0],
        verificationData
      );
    }
  }

  /**
   * Verify PEC payment
   */
  private static async verifyPecPayment(payment: any, order: any) {
    try {
      const token = parseInt(payment.trackingCode, 10);
      const confirmResponse = await PecService.confirmPayment(token);

      if (confirmResponse.Status === 0 && confirmResponse.RRN > 0) {
        const wasPending = order.status === "pending";

        return await db.transaction(async (tx) => {
          const [updatedPayment] = await tx
            .update(payments)
            .set({
              status: "paid",
              refNumber: confirmResponse.RRN.toString(),
              cardNumber: confirmResponse.CardNumberMasked,
              gatewayStatus: confirmResponse.Status,
              paidAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id))
            .returning();

          const [updatedOrder] = await tx
            .update(orders)
            .set({
              status: "processing",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id))
            .returning();

          if (wasPending) {
            await this.reduceInventoryForOrder(order.id, tx);
          }

          const items = await tx.query.orderItems.findMany({
            where: eq(orderItems.orderId, order.id),
            with: {
              product: true,
            },
          });

          return {
            success: true,
            payment: updatedPayment,
            order: updatedOrder,
            orderItems: items,
            message: "پرداخت با موفقیت انجام شد",
            pecResponse: {
              status: confirmResponse.Status,
              rrn: confirmResponse.RRN,
              cardNumber: confirmResponse.CardNumberMasked,
            },
          };
        });
      } else {
        // Payment verification failed - attempt reversal
        try {
          await PecService.reversalRequest(token);
        } catch (reversalError) {
          console.error("PEC Reversal failed:", reversalError);
        }

        const [updatedPayment] = await db
          .update(payments)
          .set({
            status: "failed",
            gatewayStatus: confirmResponse.Status,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id))
          .returning();

        return {
          success: false,
          payment: updatedPayment,
          order,
          message: PecService.getStatusMessage(confirmResponse.Status),
          pecResponse: {
            status: confirmResponse.Status,
          },
        };
      }
    } catch (error) {
      const [updatedPayment] = await db
        .update(payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();

      return {
        success: false,
        payment: updatedPayment,
        message: `پرداخت ناموفق بود: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Verify Zibal payment
   */
  private static async verifyZibalPayment(
    payment: any,
    order: any,
    verificationData: PaymentVerificationData
  ) {
    try {
      const zibalVerifyRequest: ZibalVerificationRequest = {
        merchant: UserPaymentService.ZIBAL_MERCHANT_ID,
        trackId: verificationData.trackingCode,
      };

      const response = await fetch(UserPaymentService.ZIBAL_VERIFY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(zibalVerifyRequest),
      });

      const zibalVerifyResponse: ZibalVerificationResponse =
        await response.json();

      if (zibalVerifyResponse.result === 100) {
        const wasPending = order.status === "pending";

        return await db.transaction(async (tx) => {
          const [updatedPayment] = await tx
            .update(payments)
            .set({
              status: "paid",
              refNumber: zibalVerifyResponse.refNumber,
              cardNumber: zibalVerifyResponse.cardNumber,
              description: zibalVerifyResponse.description,
              gatewayStatus: zibalVerifyResponse.status,
              paidAt: new Date(zibalVerifyResponse.paidAt),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id))
            .returning();

          const [updatedOrder] = await tx
            .update(orders)
            .set({
              status: "processing",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id))
            .returning();

          if (wasPending) {
            await this.reduceInventoryForOrder(order.id, tx);
          }

          const items = await tx.query.orderItems.findMany({
            where: eq(orderItems.orderId, order.id),
            with: {
              product: true,
            },
          });

          return {
            success: true,
            payment: updatedPayment,
            order: updatedOrder,
            orderItems: items,
            message: "پرداخت با موفقیت انجام شد",
            zibalResponse: {
              result: zibalVerifyResponse.result,
              message: zibalVerifyResponse.message,
              amount: zibalVerifyResponse.amount,
              paidAt: zibalVerifyResponse.paidAt,
              cardNumber: zibalVerifyResponse.cardNumber,
              refNumber: zibalVerifyResponse.refNumber,
            },
          };
        });
      } else {
        const [updatedPayment] = await db
          .update(payments)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id))
          .returning();

        return {
          success: false,
          payment: updatedPayment,
          order,
          zibalResponse: {
            result: zibalVerifyResponse.result,
            message: zibalVerifyResponse.message,
          },
        };
      }
    } catch (error) {
      const [updatedPayment] = await db
        .update(payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();

      return {
        success: false,
        payment: updatedPayment,
        message: `پرداخت ناموفق بود: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  static async getPaymentStatus(userId: number, orderId: number) {
    const payment = await db
      .select({
        id: payments.id,
        status: payments.status,
        provider: payments.provider,
        trackingCode: payments.trackingCode,
        amount: payments.amount,
        paidAt: payments.paidAt,
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
        },
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(and(eq(payments.orderId, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!payment.length) {
      throw new NotFoundException("Payment not found");
    }

    return payment[0];
  }

  static async refundPayment(userId: number, orderId: number) {
    // Verify order belongs to user
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order.length) {
      throw new NotFoundException("Order not found");
    }

    // Get payment record
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (!payment.length) {
      throw new NotFoundException("Payment not found");
    }

    if (payment[0].status !== "paid") {
      throw new BadRequestException("Payment is not in paid status");
    }

    // If PEC, try to reverse the transaction
    if (payment[0].provider === "pec" && payment[0].trackingCode) {
      try {
        const token = parseInt(payment[0].trackingCode, 10);
        await PecService.reversalRequest(token);
      } catch (error) {
        console.error("PEC Reversal failed:", error);
        // Continue with local status update even if reversal fails
      }
    }

    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment[0].id))
      .returning();

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    return {
      payment: updatedPayment,
      order: updatedOrder,
      message:
        payment[0].provider === "pec"
          ? "درخواست برگشت تراکنش ارسال شد"
          : "Refund request processed. Please contact support for actual refund.",
    };
  }

  /**
   * Handle PEC payment gateway callback
   * Called when user returns from PEC payment page
   */
  static async handlePecCallback(callbackData: PecCallbackData) {
    try {
      const token = parseInt(callbackData.Token, 10);
      const status = parseInt(callbackData.status, 10);

      // Find payment by tracking code (Token)
      const payment = await db
        .select()
        .from(payments)
        .where(eq(payments.trackingCode, callbackData.Token))
        .limit(1);

      if (!payment.length) {
        throw new Error("Payment not found");
      }

      // Get the order
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, payment[0].orderId))
        .limit(1);

      if (!order.length) {
        throw new Error("Order not found");
      }

      // Check if payment was successful (Status=0 and Token>0)
      if (status === 0 && token > 0) {
        // Confirm the payment with PEC
        const confirmResponse = await PecService.confirmPayment(token);

      if (confirmResponse.Status === 0 && confirmResponse.RRN > 0) {
        const orderRecord = order[0];
        const wasPending = orderRecord.status === "pending";

        await db.transaction(async (tx) => {
          await tx
            .update(payments)
            .set({
              status: "paid",
              refNumber: confirmResponse.RRN.toString(),
              cardNumber: confirmResponse.CardNumberMasked,
              gatewayStatus: confirmResponse.Status,
              paidAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment[0].id));

          await tx
            .update(orders)
            .set({
              status: "processing",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderRecord.id));

          if (wasPending) {
            await this.reduceInventoryForOrder(orderRecord.id, tx);
          }
        });

        return {
          success: true,
          orderId: order[0].id,
          orderNumber: order[0].orderNumber,
          message: "پرداخت با موفقیت انجام شد",
          rrn: confirmResponse.RRN,
        };
        } else {
          // Confirmation failed - attempt reversal
          try {
            await PecService.reversalRequest(token);
          } catch (reversalError) {
            console.error("PEC Reversal failed:", reversalError);
          }

          await db
            .update(payments)
            .set({
              status: "failed",
              gatewayStatus: confirmResponse.Status,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment[0].id));

          return {
            success: false,
            orderId: order[0].id,
            message: PecService.getStatusMessage(confirmResponse.Status),
          };
        }
      } else {
        // Payment failed at gateway
        await db
          .update(payments)
          .set({
            status: "failed",
            gatewayStatus: status,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment[0].id));

        return {
          success: false,
          orderId: order[0].id,
          message: PecService.getStatusMessage(status),
        };
      }
    } catch (error) {
      console.error("PEC callback error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Callback handler for Zibal payment gateway
  static async handleZibalCallback(
    trackId: string,
    success: boolean,
    orderId?: string
  ) {
    try {
      // Find payment by tracking code
      const payment = await db
        .select()
        .from(payments)
        .where(eq(payments.trackingCode, trackId))
        .limit(1);

      if (!payment.length) {
        throw new Error("Payment not found");
      }

      if (success) {
        // Payment was successful, verify it with Zibal
        const verificationResult = await this.verifyPaymentWithZibal(trackId);

        const orderRecordResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, payment[0].orderId))
          .limit(1);

        if (!orderRecordResult.length) {
          throw new Error("Order not found");
        }

        if (verificationResult.success) {
          const orderRecord = orderRecordResult[0];
          const wasPending = orderRecord.status === "pending";

          await db.transaction(async (tx) => {
            // Update payment status
            await tx
              .update(payments)
              .set({
                status: "paid",
                paidAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(payments.id, payment[0].id));

            // Update order status
            await tx
              .update(orders)
              .set({
                status: "processing",
                updatedAt: new Date(),
              })
              .where(eq(orders.id, payment[0].orderId));

            if (wasPending) {
              await this.reduceInventoryForOrder(payment[0].orderId, tx);
            }
          });
        }
      } else {
        // Payment failed
        await db
          .update(payments)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment[0].id));
      }

      return { success: true };
    } catch (error) {
      console.error("Zibal callback error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static async verifyPaymentWithZibal(trackId: string) {
    try {
      const zibalVerifyRequest: ZibalVerificationRequest = {
        merchant: UserPaymentService.ZIBAL_MERCHANT_ID,
        trackId: trackId,
      };

      const response = await fetch(UserPaymentService.ZIBAL_VERIFY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(zibalVerifyRequest),
      });

      const zibalVerifyResponse: ZibalVerificationResponse =
        await response.json();

      return {
        success: zibalVerifyResponse.result === 100,
        response: zibalVerifyResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static async reduceInventoryForOrder(
    orderId: number,
    executor: typeof db | TransactionClient = db
  ) {
    const items = await executor.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
      columns: {
        productId: true,
        variationId: true,
        quantity: true,
      },
    });

    for (const item of items) {
      if (item.variationId) {
        const [variation] = await executor
          .select()
          .from(productVariations)
          .where(eq(productVariations.id, item.variationId))
          .limit(1);

        if (!variation) {
          continue;
        }

        const newQuantity = Math.max(
          (variation.stockQuantity ?? 0) - item.quantity,
          0
        );

        await executor
          .update(productVariations)
          .set({
            stockQuantity: newQuantity,
            updatedAt: new Date(),
            ...(newQuantity <= 0 ? { stockStatus: "outofstock" } : {}),
          })
          .where(eq(productVariations.id, variation.id));
      } else if (item.productId) {
        const [product] = await executor
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) {
          continue;
        }

        const newQuantity = Math.max(
          (product.stockQuantity ?? 0) - item.quantity,
          0
        );

        await executor
          .update(products)
          .set({
            stockQuantity: newQuantity,
            updatedAt: new Date(),
            ...(newQuantity <= 0 ? { stockStatus: "outofstock" } : {}),
          })
          .where(eq(products.id, product.id));
      }
    }
  }
}
