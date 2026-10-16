import { db } from "../../db/client";
import { payments, Payment, NewPayment, orders, users } from "../../db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { fetchPaginatedList } from "../../utils/queryBuilder";

export class PaymentService {
  async getPaginatedPayments(filters: any) {
    // Create a modified filters object for the query builder
    const queryFilters = { ...filters };

    // Remove custom filters that need special handling
    delete queryFilters.startDate;
    delete queryFilters.endDate;
    // delete queryFilters.orderId;
    delete queryFilters.userId;

    return fetchPaginatedList({
      table: payments,
      filters: queryFilters,
      searchableFields: [
        "trackingCode",
        "refNumber",
        "cardNumber",
        "description",
      ],
      sortableFields: [
        "createdAt",
        "updatedAt",
        "amount",
        "status",
        "provider",
      ],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
      page: filters.page,
      limit: filters.limit,
      joins: [
        {
          alias: orders,
          condition: eq(orders.id, payments.orderId),
          select: {
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
          },
          key: "order",
        },
        {
          alias: users,
          condition: eq(users.id, orders.userId),
          select: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
          key: "user",
        },
      ],
    });
  }

  async getPaymentById(id: number): Promise<Payment | null> {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0] || null;
  }

  async getPaymentWithDetails(id: number) {
    const result = await db.query.payments.findFirst({
      where: eq(payments.id, id),
      with: {
        order: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              with: {
                variation: {
                  with: {
                    product: {
                      columns: {
                        id: true,
                        name: true,
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
    return result;
  }

  async getPaymentsByOrderId(orderId: number) {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));
    return result;
  }

  async getPaymentsByStatus(status: string) {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.status, status as any))
      .orderBy(desc(payments.createdAt));
    return result;
  }

  async getPaymentsByProvider(provider: string) {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.provider, provider))
      .orderBy(desc(payments.createdAt));
    return result;
  }

  async getPaymentsByDateRange(startDate: Date, endDate: Date) {
    const result = await db
      .select()
      .from(payments)
      //   .where(
      //     and(
      //       payments.createdAt >= sql`${startDate}`,
      //       payments.createdAt <= sql`${endDate}`
      //     )
      //   )
      .orderBy(desc(payments.createdAt));
    return result;
  }

  async updatePaymentStatus(
    id: number,
    status: string
  ): Promise<Payment | null> {
    const updateData: any = { status: status as any };

    if (status === "paid") {
      updateData.paidAt = new Date();
    }

    const result = await db
      .update(payments)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();

    if (!Array.isArray(result) || result.length === 0) return null;
    return result[0];
  }

  async updatePayment(
    id: number,
    data: Partial<NewPayment>
  ): Promise<Payment | null> {
    const result = await db
      .update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();

    if (!Array.isArray(result) || result.length === 0) return null;
    return result[0];
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  async getPaymentStats() {
    const stats = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        pending: sql<number>`COUNT(*)::int`,
        paid: sql<number>`COUNT(*)::int`,
        failed: sql<number>`COUNT(*)::int`,
        cancelled: sql<number>`COUNT(*)::int`,
        totalAmount: sql<number>`SUM(amount)`,
      })
      .from(payments);

    const statusStats = await db
      .select({
        status: payments.status,
        count: sql<number>`COUNT(*)::int`,
        totalAmount: sql<number>`SUM(amount)`,
      })
      .from(payments)
      .groupBy(payments.status);

    return {
      overall: stats[0],
      byStatus: statusStats,
    };
  }
}

export const paymentService = new PaymentService();
