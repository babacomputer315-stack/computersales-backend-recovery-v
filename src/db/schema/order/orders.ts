import {
  pgTable,
  timestamp,
  serial,
  text,
  integer,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { User, users } from "../users";
import { Address, addresses } from "../addresses";
import { relations } from "drizzle-orm";
import { orderItems } from "./orderItems";
import { Product } from "../product/product";
import { productVariations } from "../product/variations";
import { orderNotes } from "./orderNotes";
import { payments } from "../payments";
import { coupons } from "../coupons";
import { shippingClasses } from "../shippingClasses";
import { files } from "../files";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "completed",
  "cancelled",
  "failed",
  "returned",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "gateway",
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: integer("order_number").unique().notNull(),
  userId: integer("user_id").references(() => users.id),
  status: orderStatusEnum("status").default("pending").notNull(),
  totalAmount: integer("total_amount"),
  taxAmount: integer("tax_amount"),
  discountAmount: integer("discount_amount").default(0),
  couponId: integer("coupon_id").references(() => coupons.id),
  isAssembly: boolean("is_assembly").default(false),
  assemblyPrice: integer("assembly_price").default(0),
  shippingAddressId: integer("shipping_address_id").references(
    () => addresses.id
  ),
  shippingClassId: integer("shipping_class_id").references(
    () => shippingClasses.id,
    {
      onDelete: "set null",
    }
  ),
  depositImageId: integer("deposit_image_id").references(() => files.id, {
    onDelete: "set null",
  }),
  paymentMethod: paymentMethodEnum("payment_method").default("gateway"),
  customerNote: text("customer_note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  shippingAddress: one(addresses, {
    fields: [orders.shippingAddressId],
    references: [addresses.id],
    relationName: "shippingAddress",
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  notes: many(orderNotes),
  payment: one(payments, {
    fields: [orders.id],
    references: [payments.orderId],
  }),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  shippingClass: one(shippingClasses, {
    fields: [orders.shippingClassId],
    references: [shippingClasses.id],
  }),
  depositImage: one(files, {
    fields: [orders.depositImageId],
    references: [files.id],
  }),
}));

export type OrderWithFullDetails = typeof orders.$inferSelect & {
  user?: User;
  shippingAddress?: Address;
  items: (typeof orderItems.$inferSelect & {
    product: Product;
    variation?: typeof productVariations.$inferSelect;
  })[];
  notes?: (typeof orderNotes.$inferSelect)[];
  payment?: typeof payments.$inferSelect;
  coupon?: typeof coupons.$inferSelect;
  shippingClass?: typeof shippingClasses.$inferSelect;
  depositImage?: typeof files.$inferSelect;
};

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
