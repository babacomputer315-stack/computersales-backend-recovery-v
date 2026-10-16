import {
  productSpecifications,
  specifications,
  products,
  specificationOptions,
  productSpecificationOptions,
} from "../../../db/schema";
import { db } from "../../../db/client";
import { eq, inArray } from "drizzle-orm";

export const productSpecificationService = {
  async getByProductId(productId: number) {
    return db.query.productSpecifications.findMany({
      where: eq(productSpecifications.productId, productId),
      with: {
        specification: {
          with: {
            options: true,
          },
        },
        option: true,
        selectedOptions: {
          with: {
            option: true,
          },
        },
      },
    });
  },

  async setProductSpecifications(
    productId: number,
    specs: Array<{ 
      specificationId: number; 
      value?: string; 
      optionId?: number;
      optionIds?: number[];
    }>
  ) {
    // Handle empty specifications array
    if (!specs || specs.length === 0) {
      await db.transaction(async (tx) => {
        await tx
          .delete(productSpecifications)
          .where(eq(productSpecifications.productId, productId));
      });
      return;
    }

    // Validate that all specification IDs exist
    const specificationIds = specs.map((spec) => spec.specificationId);

    const existingSpecifications = await db
      .select({ id: specifications.id })
      .from(specifications)
      .where(inArray(specifications.id, specificationIds));

    const existingIds = existingSpecifications.map((spec) => spec.id);
    const invalidIds = specificationIds.filter(
      (id) => !existingIds.includes(id)
    );

    if (invalidIds.length > 0) {
      throw new Error(`Specification IDs not found: ${invalidIds.join(", ")}`);
    }

    // Validate product existence to avoid FK violations on insert
    const productExists = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId));

    if (productExists.length === 0) {
      throw new Error("Product not found");
    }

    // Validate that provided optionIds (if any) belong to the given specificationIds
    const allOptionIds: number[] = [];
    
    // Collect all option IDs (both single and multi-select)
    for (const spec of specs) {
      if (typeof spec.optionId === "number") {
        allOptionIds.push(spec.optionId);
      }
      if (Array.isArray(spec.optionIds)) {
        allOptionIds.push(...spec.optionIds);
      }
    }

    if (allOptionIds.length > 0) {
      const options = await db
        .select({
          id: specificationOptions.id,
          specificationId: specificationOptions.specificationId,
        })
        .from(specificationOptions)
        .where(inArray(specificationOptions.id, allOptionIds));

      const validOptionSpecIdByOptionId = new Map<number, number>(
        options.map((o) => [o.id, o.specificationId])
      );

      const invalidOptionIds: number[] = [];
      
      // Validate single select options
      for (const s of specs) {
        if (typeof s.optionId === "number") {
          const specIdOfOption = validOptionSpecIdByOptionId.get(s.optionId);
          if (!specIdOfOption || specIdOfOption !== s.specificationId) {
            invalidOptionIds.push(s.optionId);
          }
        }
        
        // Validate multi-select options
        if (Array.isArray(s.optionIds)) {
          for (const optId of s.optionIds) {
            const specIdOfOption = validOptionSpecIdByOptionId.get(optId);
            if (!specIdOfOption || specIdOfOption !== s.specificationId) {
              invalidOptionIds.push(optId);
            }
          }
        }
      }

      if (invalidOptionIds.length > 0) {
        throw new Error(
          `Option IDs invalid for their specifications: ${invalidOptionIds.join(
            ", "
          )}`
        );
      }
    }

    await db.transaction(async (tx) => {
      // Delete existing specifications for this product
      await tx
        .delete(productSpecifications)
        .where(eq(productSpecifications.productId, productId));

      // Insert new specifications
      for (const spec of specs) {
        // For text type or single select
        if (spec.value || spec.optionId) {
          const [insertedSpec] = await tx.insert(productSpecifications).values({
            productId,
            specificationId: spec.specificationId,
            value: spec.value || null,
            optionId: spec.optionId || null,
          }).returning();
          
          // If there are multiple options (multi-select), insert them
          if (Array.isArray(spec.optionIds) && spec.optionIds.length > 0) {
            for (const optionId of spec.optionIds) {
              await tx.insert(productSpecificationOptions).values({
                productSpecificationId: insertedSpec.id,
                optionId,
              });
            }
          }
        }
        // For multi-select only (no value or single optionId)
        else if (Array.isArray(spec.optionIds) && spec.optionIds.length > 0) {
          const [insertedSpec] = await tx.insert(productSpecifications).values({
            productId,
            specificationId: spec.specificationId,
            value: null,
            optionId: null,
          }).returning();
          
          // Insert all selected options
          for (const optionId of spec.optionIds) {
            await tx.insert(productSpecificationOptions).values({
              productSpecificationId: insertedSpec.id,
              optionId,
            });
          }
        }
      }
    });
  },
};
