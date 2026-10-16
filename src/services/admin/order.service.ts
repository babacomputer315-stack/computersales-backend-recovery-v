import { db } from "../../db/client";
import {
  files,
  NewOrder,
  NewOrderItem,
  Order,
  OrderItem,
  OrderWithFullDetails,
  orders,
  orderItems,
  productVariations,
  products,
  users,
  shippingClasses,
} from "../../db/schema";
import { eq, ilike, or, sql, SQL } from "drizzle-orm";
import { fetchPaginatedList } from "../../utils/queryBuilder";

export async function generateUniqueOrderNumber(): Promise<number> {
  let isUnique = false;
  let orderNumber = 0;

  while (!isUnique) {
    orderNumber = Math.floor(100000 + Math.random() * 900000);

    const existing = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.orderNumber, orderNumber),
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return orderNumber;
}

export class OrderService {
  async getPaginatedOrders(filters: any) {
    const queryFilters = { ...filters };
    const searchTerm =
      typeof filters.name === "string" ? filters.name.trim() : undefined;
    delete queryFilters.name;

    const additionalWhereClauses: SQL<boolean>[] = [];

    if (searchTerm) {
      const pattern = `%${searchTerm}%`;
      const searchCondition = or(
        // ilike(users.name, pattern),
        ilike(sql`${orders.orderNumber}::text`, pattern)
      ) as SQL<boolean>;
      additionalWhereClauses.push(searchCondition);
    }

    return fetchPaginatedList({
      table: orders,
      filters: queryFilters,
      searchableFields: ["orderNumber"],
      sortableFields: ["createdAt", "totalAmount", "orderNumber"],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
      page: filters.page,
      limit: filters.limit,
      joins: [
        {
          alias: users,
          condition: eq(users.id, orders.userId),
          select: {
            id: users.id,
            name: users.name,
          },
          key: "user",
        },
        {
          alias: files,
          condition: eq(files.id, orders.depositImageId),
          select: {
            id: files.id,
            name: files.name,
          },
          key: "depositImage",
        },
        {
          alias: shippingClasses,
          condition: eq(shippingClasses.id, orders.shippingClassId),
          select: {
            id: shippingClasses.id,
            name: shippingClasses.name,
          },
          key: "shippingClass",
        },
      ],
      additionalWhereClauses,
    });
  }

  async createOrder(
    orderData: NewOrder,
    items: NewOrderItem[]
  ): Promise<OrderWithFullDetails | null> {
    return db.transaction(async (tx) => {
      const newOrderNumber = await generateUniqueOrderNumber();

      const [newOrder] = await tx
        .insert(orders)
        .values({ ...orderData, orderNumber: newOrderNumber })
        .returning();

      const orderItemsData: NewOrderItem[] = [];
      let totalAmount = 0;

      for (const item of items) {
        let productName = "";
        let imageId: number | undefined;
        let sku = "";
        let attributesText = "";
        let unitPrice = 0;

        if (item.variationId) {
          const variation = await tx.query.productVariations.findFirst({
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
              imageFile: true,
              product: {
                with: {
                  images: {
                    with: {
                      file: true,
                    },
                  },
                },
              },
            },
          });

          if (!variation) throw new Error("Variation not found");

          sku = variation.sku || "";
          unitPrice = variation.salePrice ?? variation.price ?? 0;

          // get productName & fallback image
          productName = variation.product.name;
          imageId =
            variation.imageFile?.id ?? variation.product.images?.[0]?.file?.id;

          // build attributes text
          const attrPairs = variation.attributeValues
            .map((v) => {
              const attr = v.attributeValue.attribute?.name;
              const val = v.attributeValue.value;
              return attr && val ? `${attr}: ${val}` : null;
            })
            .filter(Boolean);
          attributesText = attrPairs.join(" • ") || "";
        } else if (item.productId) {
          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.productId),
            with: {
              images: {
                with: {
                  file: true,
                },
              },
            },
          });

          if (!product) throw new Error("Product not found");

          productName = product.name;
          unitPrice = product.salePrice ?? product.regularPrice ?? 0;
          imageId = product.images?.[0]?.file?.id;
        } else {
          throw new Error(
            "Each order item must include either productId or variationId"
          );
        }

        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;

        orderItemsData.push({
          ...item,
          orderId: newOrder.id,
          productName,
          imageId,
          sku,
          attributesText,
          unitPrice,
          totalPrice,
        });
      }

      await tx.insert(orderItems).values(orderItemsData);

      await tx
        .update(orders)
        .set({ totalAmount })
        .where(eq(orders.id, newOrder.id));

      return await this.getOrderById(newOrder.id);
    });
  }

  /**
   * Get order by ID with full details
   */
  async getOrderById(id: number): Promise<OrderWithFullDetails | null> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        user: true,
        shippingAddress: true,
        shippingClass: true,
        notes: true,
        items: {
          with: {
            image: true,
            product: {
              with: {
                images: {
                  with: {
                    file: true,
                  },
                },
              },
            },
            variation: {
              with: {
                attributeValues: {
                  with: {
                    attributeValue: {
                      with: {
                        attribute: true,
                        file: true,
                      },
                    },
                  },
                },
                imageFile: true,
              },
            },
          },
        },
      },
    });

    return order as OrderWithFullDetails | null;
  }

  /**
   * Get orders by user ID
   */
  async getOrdersByUserId(userId: number): Promise<OrderWithFullDetails[]> {
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        user: true,
        shippingAddress: true,
        items: {
          with: {
            product: true,
            variation: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    return userOrders as OrderWithFullDetails[];
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: number, status: any): Promise<Order | null> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    return updatedOrder || null;
  }

  /**
   * Delete an order
   */
  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));

    return (result.rowCount || 0) > 0;
  }

  /**
   * Get order item by ID
   */
  async getOrderItemById(id: number): Promise<OrderItem | null> {
    const [item] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, id));

    return item || null;
  }

  /**
   * Update order item quantity
   */
  async updateOrderItemQuantity(
    id: number,
    quantity: number
  ): Promise<OrderItem | null> {
    const [item] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, id));

    if (!item) return null;

    const [updatedItem] = await db
      .update(orderItems)
      .set({
        quantity,
        totalPrice: item.unitPrice * quantity,
      })
      .where(eq(orderItems.id, id))
      .returning();

    return updatedItem || null;
  }
}

export const orderService = new OrderService();
