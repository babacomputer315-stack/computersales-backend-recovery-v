import { db } from "../../db/client";
import { products, productVariations } from "../../db/schema/index";
import { eq } from "drizzle-orm";
import { NotFoundException } from "../../utils/apiResponse";

export class SheetService {
  static async getAllProducts() {
    const products = await db.query.products.findMany({
      with: {
        variations: {
          columns: {
            id: true,
            price: true,
            salePrice: true,
            stockQuantity: true,
            stockStatus: true,
            productId: true,
          },
          with: {
            attributeValues: {
              columns: {
                id: true,
                attributeValueId: true,
              },
              with: {
                attributeValue: {
                  columns: {
                    id: true,
                    value: true,
                  },
                  with: { attribute: true },
                },
              },
            },
          },
        },
      },
      columns: {
        id: true,
        name: true,
        regularPrice: true,
        salePrice: true,
        stockQuantity: true,
        stockStatus: true,
      },
    });
    return products;
  }

  static async update(data: {
    productId: number;
    variationId?: number | null;
    regularPrice?: number;
    salePrice?: number;
    stockQuantity?: number;
    stockStatus?: "instock" | "outofstock";
  }) {
    const {
      productId,
      variationId,
      regularPrice,
      salePrice,
      stockQuantity,
      stockStatus,
    } = data;

    // If variationId is provided, update the variation
    if (variationId) {
      const existingVariation = await db.query.productVariations.findFirst({
        where: (variations, { eq }) => eq(variations.id, variationId),
      });

      if (!existingVariation)
        throw new NotFoundException("Product variation not found");

      await db
        .update(productVariations)
        .set({
          price: regularPrice ?? existingVariation.price,
          salePrice: salePrice ?? existingVariation.salePrice,
          stockQuantity: stockQuantity ?? existingVariation.stockQuantity,
          stockStatus: stockStatus ?? existingVariation.stockStatus,
          updatedAt: new Date(),
        })
        .where(eq(productVariations.id, variationId));

      return true;
    }

    // Otherwise, update the product
    const existingProduct = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
    });

    if (!existingProduct) throw new NotFoundException("Product not found");

    await db
      .update(products)
      .set({
        regularPrice: regularPrice ?? existingProduct.regularPrice,
        salePrice: salePrice ?? existingProduct.salePrice,
        stockQuantity: stockQuantity ?? existingProduct.stockQuantity,
        stockStatus: stockStatus ?? existingProduct.stockStatus,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return true;
  }
}
