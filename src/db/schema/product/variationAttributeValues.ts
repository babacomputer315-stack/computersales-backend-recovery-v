import { pgTable, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { productVariations } from "./variations";
import { attributeValues } from "./attributeValues";
import { relations } from "drizzle-orm";

export const variationAttributeValues = pgTable("variation_attribute_values", {
  id: serial("id").primaryKey(),
  variationId: integer("variation_id")
    .notNull()
    .references(() => productVariations.id, { onDelete: "cascade" }),
  attributeValueId: integer("attribute_value_id")
    .notNull()
    .references(() => attributeValues.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const variationAttributeValuesRelations = relations(
  variationAttributeValues,
  ({ one }) => ({
    variation: one(productVariations, {
      fields: [variationAttributeValues.variationId],
      references: [productVariations.id],
    }),
    attributeValue: one(attributeValues, {
      fields: [variationAttributeValues.attributeValueId],
      references: [attributeValues.id],
    }),
  })
);

export type VariationAttributeValue =
  typeof variationAttributeValues.$inferSelect;
export type NewVariationAttributeValue =
  typeof variationAttributeValues.$inferInsert;
