import { db } from "../../db/client";
import { addresses } from "../../db/schema/addresses";
import { eq, and, count } from "drizzle-orm";
import { BadRequestException } from "../../utils/apiResponse";

export class UserAddressService {
  static async getUserAddresses(userId: number) {
    return db.query.addresses.findMany({
      where: eq(addresses.userId, userId),
      orderBy: (fields, { desc }) => desc(fields.createdAt),
    });
  }

  static async getAddressById(id: number, userId: number) {
    const result = await db.query.addresses.findFirst({
      where: and(eq(addresses.id, id), eq(addresses.userId, userId)),
    });

    if (!result) {
      throw new BadRequestException("Address not found");
    }

    return result;
  }

  static async createAddress(
    data: {
      fullName: string;
      phone: string;
      province: string;
      provinceCode: string;
      city: string;
      cityCode: string;
      addressLine: string;
      postalCode?: string;
      plaque?: string;
    },
    userId: number
  ) {
    const [inserted] = await db
      .insert(addresses)
      .values({
        ...data,
        userId,
      })
      .returning();

    return inserted;
  }

  static async updateAddress(
    id: number,
    userId: number,
    data: {
      fullName?: string;
      phone?: string;
      province?: string;
      provinceCode?: string;
      cityCode?: string;
      city?: string;
      addressLine?: string;
      postalCode?: string;
      plaque?: string;
    }
  ) {
    // First check if address belongs to user
    await this.getAddressById(id, userId);

    const [updated] = await db
      .update(addresses)
      .set(data)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();

    return updated;
  }

  static async deleteAddress(id: number, userId: number) {
    await this.getAddressById(id, userId);

    await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));

    return { success: true };
  }

  static async getAddressCount(userId: number) {
    const result = await db
      .select({ count: count() })
      .from(addresses)
      .where(eq(addresses.userId, userId));

    return Number(result[0]?.count ?? 0);
  }
}
