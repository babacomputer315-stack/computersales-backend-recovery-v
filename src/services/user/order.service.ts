import { db } from "../../db/client";
import {
  orders,
  orderItems,
  payments,
  productImages,
  coupons,
  productToCategories,
  users,
} from "../../db/schema";
import { products } from "../../db/schema/product/product";
import {
  productVariations,
} from "../../db/schema/product/variations";
import { addresses } from "../../db/schema/addresses";
import { eq, and, desc, count, asc, inArray, sql } from "drizzle-orm";
import {
  NotFoundException,
  BadRequestException,
} from "../../utils/apiResponse";
import { generateUniqueOrderNumber } from "../admin/order.service";
import { userCouponService } from "./coupon.service";
import { sendOrderSms } from "../../utils/sendSms";
// import { TapinService } from "../tapin.service";


export interface CreateOrderItem {
  productId: number;
  variationId?: number;
  quantity: number;
}

export interface CreateOrderData {
  items: CreateOrderItem[];
  shippingAddressId: number;
  paymentMethod?: "bank_transfer" | "gateway";
  customerNote?: string;
  couponCode?: string;
  shippingClassId?: number;
  depositImageId?: number;
  isAssembly?: boolean;
}

export class UserOrderService {
  static async createOrder(userId: number, orderData: CreateOrderData) {
    return await db.transaction(async (tx) => {
      // Validate shipping address belongs to user
      const address = await tx
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.id, orderData.shippingAddressId),
            eq(addresses.userId, userId)
          )
        )
        .limit(1);

      if (!address.length) {
        throw new BadRequestException("Invalid shipping address");
      }

      // Calculate total amount and validate products
      let totalAmount = 0;
      let discountAmount = 0;
      let couponId = null;
      const orderItemsData = [];

      for (const item of orderData.items) {
        if (item.productId === 0) {
          continue;
        }

        const product = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product.length) {
          throw new BadRequestException(
            `Product with ID ${item.productId} not found`
          );
        }

        const image = await tx
          .select()
          .from(productImages)
          .where(
            and(
              eq(productImages.productId, item.productId),
              eq(productImages.isThumbnail, true)
            )
          )
          .limit(1);

        if (!product[0].isPublished) {
          throw new BadRequestException(
            `Product ${product[0].name} is not available`
          );
        }

        // Check if product is single purchase only
        if (product[0].isSinglePurchase && item.quantity > 1) {
          throw new BadRequestException(
            `Product ${product[0].name} can only be purchased one at a time`
          );
        }

        let price = product[0].salePrice || product[0].regularPrice;
        let variation = null;
        let attributesText = "";

        if (item.variationId) {
          // variation = (await tx
          //   .select()
          //   .from(productVariations)
          //   .where(eq(productVariations.id, item.variationId))
          //   .limit(1)) as ProductVariationWithAttributes[];
          variation = await tx.query.productVariations.findFirst({
            where: eq(productVariations.id, item.variationId),
            with: {
              attributeValues: {
                with: {
                  attributeValue: {
                    with: {
                      attribute: true,
                    },
                  },
                },
              },
            },
          });

          if (!variation) {
            throw new BadRequestException(
              `Variation with ID ${item.variationId} not found`
            );
          }

          const attrPairs = variation.attributeValues
            .map((v: any) => {
              const attr = v.attributeValue.attribute?.name;
              const val = v.attributeValue.value;
              return attr && val ? `${attr}: ${val}` : null;
            })
            .filter(Boolean);

          attributesText = attrPairs.join(" • ") || "";

          price = variation.salePrice || variation.price || price;
        }

        const itemTotal = (price || 0) * item.quantity;
        totalAmount += itemTotal;

        orderItemsData.push({
          productId: item.productId,
          variationId: item.variationId,
          productName: product[0].name,
          imageId: variation?.imageFileId || image[0]?.fileId,
          sku: variation?.sku || product[0].sku,
          attributesText: attributesText,
          quantity: item.quantity,
          unitPrice: price,
          totalPrice: itemTotal,
        });
      }

      // Apply discount code if provided
      if (orderData.couponCode) {
        // Get product categories for discount validation
        const productIds = orderItemsData.map((item) => item.productId);
        const productCategories = await tx
          .select({
            productId: products.id,
            categoryId: productToCategories.categoryId,
          })
          .from(products)
          .leftJoin(
            productToCategories,
            eq(products.id, productToCategories.productId)
          )
          .where(inArray(products.id, productIds));

        // Prepare items for discount validation
        const itemsForDiscount = orderItemsData.map((item) => {
          const category = productCategories.find(
            (pc) => pc.productId === item.productId
          );
          return {
            productId: item.productId,
            categoryId: category?.categoryId || undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
          };
        });

        const discountResult = await userCouponService.applyCoupon(
          orderData.couponCode,
          itemsForDiscount
        );

        if (discountResult.valid) {
          discountAmount = discountResult.discountAmount || 0;
          couponId = discountResult.coupon?.id || null;

          // Increment coupon usage
          await tx
            .update(coupons)
            .set({
              usedCount: sql`${coupons.usedCount} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(coupons.id, couponId || 0));
        } else {
          throw new BadRequestException(discountResult.error);
        }
      }

      // Generate order number (simple increment for now)
      // const lastOrder = await tx
      //   .select({ orderNumber: orders.orderNumber })
      //   .from(orders)
      //   .orderBy(desc(orders.orderNumber))
      //   .limit(1);

      const orderNumber = await generateUniqueOrderNumber();
      // lastOrder.length > 0 ? lastOrder[0].orderNumber + 1 : 1000;

      const user = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        throw new NotFoundException("User not found");
      }

      // let tapinBarcode: string | null = null;
      // let tapinOrderId: string | null = null;
      // let tapinId: string | null = null;

      // console.log(orderData.shippingClassId);

      // if (orderData.shippingClassId === 6) {

      //   console.log("Shipping Class is POST");

      //   const address = await tx
      //     .select()
      //     .from(addresses)
      //     .where(eq(addresses.id, orderData.shippingAddressId))
      //     .limit(1);

      //   const productsData = await tx
      //     .select()
      //     .from(products)
      //     .where(inArray(products.id, orderItemsData.map((item) => item.productId)));


      //   const tapinOrder = await TapinService.registerOrder({
      //     register_type: 0,
      //     address: address?.[0]?.addressLine || "",
      //     city_code: address?.[0]?.cityCode || "",
      //     province_code: address?.[0]?.provinceCode || "",
      //     description: orderData?.customerNote || null,
      //     email: user?.[0]?.email || "",
      //     employee_code: '-1',
      //     first_name: user?.[0]?.firstName || "",
      //     last_name: user?.[0]?.lastName || "",
      //     mobile: user?.[0]?.mobile,
      //     postal_code: address?.[0]?.postalCode?.length === 10 ? address[0].postalCode : "1313131313",
      //     box_id: (await TapinService.findSuitableBox(productsData as { id: number, length: number, width: number, height: number }[]))?.pk || 0,
      //     kiosk_id: 0,
      //     manual_id: orderNumber?.toString(),
      //     pay_type: 2,
      //     order_type: 1,
      //     package_weight: productsData.reduce((acc, product) => acc + (product.weight ?? 0), 0),
      //     content_type: 1,
      //     phone: user?.[0]?.mobile || "",
      //     count: orderItemsData?.length,
      //     title: orderItemsData?.map((item) => item?.productName).join(", "),
      //     weight: productsData?.reduce((acc, product) => acc + (product?.weight ?? 0), 0),
      //     products: orderItemsData?.map((item) => ({
      //       count: item?.quantity,
      //       discount: 0,
      //       price: item?.unitPrice,
      //       title: item?.productName?.slice(0, 40),
      //       weight: 500,
      //       product_id: null
      //     })),
      //   });

      //   console.log("Tapin Request Body>>>", {
      //     register_type: 0,
      //     address: address?.[0]?.addressLine || "",
      //     city_code: address?.[0]?.cityCode || "",
      //     province_code: address?.[0]?.provinceCode || "",
      //     description: orderData?.customerNote || null,
      //     email: user?.[0]?.email || "",
      //     employee_code: '-1',
      //     first_name: user?.[0]?.firstName || "",
      //     last_name: user?.[0]?.lastName || "",
      //     mobile: user?.[0]?.mobile,
      //     postal_code: address?.[0]?.postalCode?.length === 10 ? address[0].postalCode : "1313131313",
      //     box_id: (await TapinService.findSuitableBox(productsData as { id: number, length: number, width: number, height: number }[]))?.pk || 0,
      //     kiosk_id: 0,
      //     manual_id: orderNumber?.toString(),
      //     pay_type: 2,
      //     order_type: 1,
      //     package_weight: productsData.reduce((acc, product) => acc + (product.weight ?? 0), 0),
      //     content_type: 1,
      //     phone: user?.[0]?.mobile || "",
      //     count: orderItemsData?.length,
      //     title: orderItemsData?.map((item) => item?.productName).join(", "),
      //     weight: productsData?.reduce((acc, product) => acc + (product?.weight ?? 0), 0),
      //     products: orderItemsData?.map((item) => ({
      //       count: item?.quantity,
      //       discount: 0,
      //       price: item?.unitPrice,
      //       title: item?.productName?.slice(0, 40),
      //       weight: 500,
      //       product_id: null
      //     })),
      //   });

      //   console.log("tapinOrder Message>>>", tapinOrder?.returns?.message);
      //   console.log("tapinOrder Status>>>", tapinOrder?.returns?.status);
      //   console.log("tapinOrder Response>>>", tapinOrder);

      //   if (tapinOrder?.returns?.message && tapinOrder?.returns?.status !== 200) {
      //     throw new BadRequestException(tapinOrder?.returns?.message || "خطایی رخ داده است");
      //   }

      //   tapinBarcode = tapinOrder?.entries?.barcode || null;
      //   tapinOrderId = tapinOrder?.entries?.order_id?.toString() || null;
      //   tapinId = tapinOrder?.entries?.id || null;
      // }

      // Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId,
          status: "pending",
          // TAX
          // totalAmount:(totalAmount + (totalAmount * 10) / 100) - discountAmount,
          // taxAmount: (totalAmount * 10) / 100,
          totalAmount: totalAmount - discountAmount,
          taxAmount: 0,
          discountAmount,
          couponId,
          shippingAddressId: orderData.shippingAddressId,
          shippingClassId: orderData.shippingClassId || null,
          paymentMethod: orderData.paymentMethod || "gateway",
          customerNote: orderData.customerNote,
          depositImageId: orderData.depositImageId || null,
          isAssembly: orderData.isAssembly || false,
          // tapinBarcode: tapinBarcode || null,
          // tapinOrderId: tapinOrderId || null,
          // tapinId: tapinId || null,
          assemblyPrice: orderData.isAssembly
            ? ((totalAmount - discountAmount) * 3) / 100
            : 0,
        })
        .returning();

      // Create order items
      const createdOrderItems = await tx
        .insert(orderItems)
        .values(
          orderItemsData.map((item) => ({
            orderId: newOrder.id,
            ...item,
            unitPrice: item.unitPrice || 0,
          }))
        )
        .returning();

      // Create payment record
      const [payment] = await tx
        .insert(payments)
        .values({
          orderId: newOrder.id,
          provider: "zibal",
          status: "pending",
          amount: totalAmount - discountAmount,
          taxAmount: 0,
          // amount: totalAmount + (totalAmount * 10) / 100 - discountAmount,
          // taxAmount: (totalAmount * 10) / 100,
        })
        .returning();

      await sendOrderSms(user?.[0]?.mobile || "", {
        name: user?.[0]?.name || "",
        orderNumber: newOrder?.orderNumber?.toString(),
        status: newOrder?.status || "",
      });

      return {
        order: newOrder,
        items: createdOrderItems,
        payment,
      };
    });
  }

  static async getUserOrders(
    userId: number,
    page = 1,
    limit = 10,
    status:
      | "pending"
      | "processing"
      | "completed"
      | "cancelled"
      | "failed"
      | "returned" = "pending"
  ) {
    const offset = (page - 1) * limit;

    const userOrders = await db.query.orders.findMany({
      where: and(eq(orders.userId, userId), eq(orders.status, status)),
      orderBy: desc(orders.createdAt),
      limit,
      offset,
      with: {
        notes: true,
        shippingAddress: true,
        payment: true,
        items: {
          with: {
            product: true,
            image: true,
            variation: true,
          },
        },
      },
    });

    const totalResult = await db
      .select({ count: count() })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.status, status)));

    const statusCountsRaw = await db
      .select({
        status: orders.status,
        count: count(),
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .groupBy(orders.status);

    const statusCounts: Record<string, number> = {};
    statusCountsRaw.forEach((row) => {
      statusCounts[row.status] = Number(row.count);
    });

    return {
      orders: userOrders,
      statusCounts,
      pagination: {
        page,
        limit,
        total: totalResult[0].count,
        totalPages: Math.ceil(totalResult[0].count / limit),
      },
    };
  }

  static async getOrderById(userId: number, orderId: number) {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
      with: {
        notes: true,
        shippingAddress: true,
        items: {
          with: {
            product: true,
            image: true,
            variation: {
              columns: {
                sku: true,
                // price: true,
                // salePrice: true,
                // imageFileId: true,
                // imageAlt: true,
              },
              with: {
                imageFile: true,
                attributeValues: {
                  with: {
                    attributeValue: {
                      with: {
                        file: true,
                        attribute: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const payment = await db.query.payments.findFirst({
      where: eq(payments.orderId, orderId),
    });

    // const order = await db
    //   .select({
    //     id: orders.id,
    //     orderNumber: orders.orderNumber,
    //     status: orders.status,
    //     totalAmount: orders.totalAmount,
    //     paymentMethod: orders.paymentMethod,
    //     customerNote: orders.customerNote,
    //     createdAt: orders.createdAt,
    //     updatedAt: orders.updatedAt,
    //     payment: {
    //       id: payments.id,
    //       status: payments.status,
    //       provider: payments.provider,
    //       trackingCode: payments.trackingCode,
    //       paidAt: payments.paidAt,
    //     },
    //     shippingAddress: {
    //       id: addresses.id,
    //       fullName: addresses.fullName,
    //       addressLine: addresses.addressLine,
    //       city: addresses.city,
    //       postalCode: addresses.postalCode,
    //       phone: addresses.phone,
    //     },
    //   })
    //   .from(orders)
    //   .leftJoin(payments, eq(orders.id, payments.orderId))
    //   .leftJoin(addresses, eq(orders.shippingAddressId, addresses.id))
    //   .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    //   .limit(1);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // // Get order items with product details
    // const orderItemsWithProducts = await db
    //   .select({
    //     id: orderItems.id,
    //     productId: orderItems.productId,
    //     variationId: orderItems.variationId,
    //     quantity: orderItems.quantity,
    //     unitPrice: orderItems.unitPrice,
    //     totalPrice: orderItems.totalPrice,
    //     productName: orderItems.productName,
    //     product: {
    //       id: products.id,
    //       name: products.name,
    //       slug: products.slug,
    //     },
    //     variation: {
    //       id: productVariations.id,
    //       sku: productVariations.sku,
    //     },
    //   })
    //   .from(orderItems)
    //   .leftJoin(products, eq(orderItems.productId, products.id))
    //   .leftJoin(
    //     productVariations,
    //     eq(orderItems.variationId, productVariations.id)
    //   )
    //   .where(eq(orderItems.orderId, orderId));

    return {
      ...order,
      payment,
    };
  }

  static async cancelOrder(userId: number, orderId: number) {
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order.length) {
      throw new NotFoundException("Order not found");
    }

    if (order[0].status !== "pending") {
      throw new BadRequestException("Only pending orders can be cancelled");
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    return updatedOrder;
  }

  static async getOrderStatus(userId: number, orderId: number) {
    const order = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        payment: {
          status: payments.status,
          trackingCode: payments.trackingCode,
        },
      })
      .from(orders)
      .leftJoin(payments, eq(orders.id, payments.orderId))
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order.length) {
      throw new NotFoundException("Order not found");
    }

    return order[0];
  }
}
