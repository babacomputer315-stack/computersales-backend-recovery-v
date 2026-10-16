import {
  pgTable,
  integer,
  timestamp,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./product";
import { productBundles } from "./productBundles";

export const productBundleItems = pgTable("product_bundle_items", {
  id: serial("id").primaryKey(),
  bundleId: integer("bundle_id")
    .notNull()
    .references(() => productBundles.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  // isRequired: boolean("is_required").default(true),
  // displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productBundleItemsRelations = relations(
  productBundleItems,
  ({ one }) => ({
    bundle: one(productBundles, {
      fields: [productBundleItems.bundleId],
      references: [productBundles.id],
    }),
    product: one(products, {
      fields: [productBundleItems.productId],
      references: [products.id],
    }),
  })
);

export type ProductBundleItem = typeof productBundleItems.$inferSelect;
export type NewProductBundleItem = typeof productBundleItems.$inferInsert;
