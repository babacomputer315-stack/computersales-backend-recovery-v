import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  pgEnum,
  bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productCategories } from "./productCategories";
import { shippingClasses } from "../shippingClasses";
import { productToTags } from "./productToTags";
import { productImages } from "./productImages";
import { productTags } from "./productTags";
import { files } from "../files";
import { productVariations } from "./variations";
import { variationAttributeValues } from "./variationAttributeValues";
import { attributeValues } from "./attributeValues";
import { attributes } from "./attributes";
import { productToCategories } from "./productToCategories";
import { productSpecifications } from "./productSpecifications";
import { brands } from "../brands";
import { productBundleItems } from "./productBundleItems";
import { productBundles } from "./productBundles";

export const stockStatusEnum = pgEnum("product_stock_status", [
  "outofstock",
  "instock",
  "preorder",
]);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 100 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  isPublished: boolean("is_published").default(false),
  shortDescription: text("short_description"),
  longDescription: text("long_description"),
  htmlDescription: text("html_description"),
  // regularPrice: integer("regular_price"),
  // salePrice: integer("sale_price"),
  regularPrice: bigint("regular_price", { mode: "number" }),
  salePrice: bigint("sale_price", { mode: "number" }),
  saleStartDate: timestamp("sale_start_date"),
  saleEndDate: timestamp("sale_end_date"),
  stockQuantity: integer("stock_quantity").default(0),
  stockStatus: stockStatusEnum("stock_status").default("instock"),
  showStock: boolean("show_stock").default(true),
  isFeatured: boolean("is_featured").default(false),
  isSinglePurchase: boolean("is_single_purchase").default(false),
  purchaseLimit: integer("purchase_limit"),

  shippingClassId: integer("shipping_class_id").references(
    () => shippingClasses.id
  ),
  weight: integer("weight"),
  length: integer("length"),
  width: integer("width"),
  height: integer("height"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  slug: varchar("slug", { length: 255 }).unique(),

  brandId: integer("brand_id").references(() => brands.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  shippingClass: one(shippingClasses, {
    fields: [products.shippingClassId],
    references: [shippingClasses.id],
  }),
  tags: many(productToTags),
  images: many(productImages),
  categories: many(productToCategories),
  variations: many(productVariations),
  specifications: many(productSpecifications),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  bundle: one(productBundles, {
    fields: [products.id],
    references: [productBundles.mainProductId],
  }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductWithRelations = Product & {
  brand?: typeof brands.$inferSelect;
  category?: typeof productCategories.$inferSelect;
  shippingClass?: typeof shippingClasses.$inferSelect;
  tags?: (typeof productToTags.$inferSelect & {
    tag: typeof productTags.$inferSelect;
  })[];
  images?: (typeof productImages.$inferSelect & {
    file: typeof files.$inferSelect;
  })[];
  variations?: (typeof productVariations.$inferSelect & {
    attributeValues: (typeof variationAttributeValues.$inferSelect & {
      attributeValue: typeof attributeValues.$inferSelect & {
        attribute: typeof attributes.$inferSelect;
      };
      imageFile?: typeof files.$inferSelect;
      imageAlt?: string;
    })[];
  })[];
  bundle?: typeof productBundles.$inferSelect & {
    bundleItems?: (typeof productBundleItems.$inferSelect & {
      product: typeof products.$inferSelect;
    })[];
  };
};
