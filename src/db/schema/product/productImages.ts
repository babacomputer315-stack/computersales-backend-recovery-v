import {
  pgTable,
  integer,
  boolean,
  timestamp,
  serial,
  varchar,
} from "drizzle-orm/pg-core";
import { products } from "./product";
import { files } from "../files";
import { relations } from "drizzle-orm";

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  fileId: integer("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  isThumbnail: boolean("is_thumbnail").default(false),
  order: integer("order").default(0),
  alt: varchar("alt", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  file: one(files, {
    fields: [productImages.fileId],
    references: [files.id],
  }),
}));

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
