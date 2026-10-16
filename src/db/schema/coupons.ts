import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { products } from "./product/product";
import { productCategories } from "./product/productCategories";
import { relations } from "drizzle-orm";

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed",
]);

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: discountTypeEnum("type").notNull(),
  value: integer("value").notNull(),
  maxUsage: integer("max_usage").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => productCategories.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const couponsRelations = relations(coupons, ({ one }) => ({
  product: one(products, {
    fields: [coupons.productId],
    references: [products.id],
  }),
  category: one(productCategories, {
    fields: [coupons.categoryId],
    references: [productCategories.id],
  }),
}));

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
