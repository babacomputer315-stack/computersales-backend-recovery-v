import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { products } from "../product/product";
import { productVariations } from "../product/variations";
import { relations } from "drizzle-orm";
import { files } from "../files";

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),

  variationId: integer("variation_id").references(() => productVariations.id, {
    onDelete: "set null",
  }),

  productName: text("product_name").notNull(),
  imageId: integer("image_id").references(() => files.id, {
    onDelete: "set null",
  }),
  sku: text("sku"),
  attributesText: text("attributes_text"),

  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variation: one(productVariations, {
    fields: [orderItems.variationId],
    references: [productVariations.id],
  }),
  image: one(files, {
    fields: [orderItems.imageId],
    references: [files.id],
  }),
}));

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
