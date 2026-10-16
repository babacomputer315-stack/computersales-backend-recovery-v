import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
  pgEnum,
  boolean,
  bigint,
} from "drizzle-orm/pg-core";
import { products } from "./product";
import { relations } from "drizzle-orm";
import { variationAttributeValues } from "./variationAttributeValues";
import { files } from "../files";
import { attributeValues } from "./attributeValues";

const stockStatusEnum = pgEnum("product_stock_status", [
  "outofstock",
  "instock",
]);

export const productVariations = pgTable("product_variations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  sku: varchar("sku", { length: 100 }).unique(),
  price: bigint("price", { mode: "number" }),
  salePrice: bigint("sale_price", { mode: "number" }),
  saleStartDate: timestamp("sale_start_date"),
  saleEndDate: timestamp("sale_end_date"),
  stockQuantity: integer("stock_quantity").default(0),
  purchaseLimit: integer("purchase_limit"),
  stockStatus: stockStatusEnum("stock_status").notNull().default("outofstock"),
  imageFileId: integer("image_file_id").references(() => files.id),
  imageAlt: varchar("image_alt", { length: 255 }),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productVariationsRelations = relations(
  productVariations,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariations.productId],
      references: [products.id],
    }),
    attributeValues: many(variationAttributeValues),
    imageFile: one(files, {
      fields: [productVariations.imageFileId],
      references: [files.id],
    }),
  })
);

export type ProductVariationWithAttributes =
  typeof productVariations.$inferSelect & {
    attributeValues: (typeof variationAttributeValues.$inferSelect & {
      attributeValue: (typeof attributeValues.$inferSelect)[];
    })[];
  };

export type ProductVariation = typeof productVariations.$inferSelect;
export type NewProductVariation = typeof productVariations.$inferInsert;
