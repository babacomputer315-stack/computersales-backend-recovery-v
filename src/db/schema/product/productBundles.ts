import {
  pgTable,
  integer,
  timestamp,
  serial,
  decimal,
  boolean,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./product";
import { productBundleItems } from "./productBundleItems";

export const productBundles = pgTable("product_bundles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  mainProductId: integer("main_product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  discountType: text("discount_type").notNull().default("percentage"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productBundlesRelations = relations(
  productBundles,
  ({ one, many }) => ({
    mainProduct: one(products, {
      fields: [productBundles.mainProductId],
      references: [products.id],
    }),
    bundleItems: many(productBundleItems),
  })
);

export type ProductBundle = typeof productBundles.$inferSelect;
export type NewProductBundle = typeof productBundles.$inferInsert;
