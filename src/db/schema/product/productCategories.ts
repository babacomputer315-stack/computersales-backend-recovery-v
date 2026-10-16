import {
  pgTable,
  varchar,
  integer,
  timestamp,
  serial,
  AnyPgColumn,
  text,
} from "drizzle-orm/pg-core";
import { files } from "../files";
import { relations } from "drizzle-orm";

export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  parentId: integer("parent_id").references(
    (): AnyPgColumn => productCategories.id,
    {
      onDelete: "set null",
    }
  ),

  imageId: integer("image_id").references(() => files.id, {
    onDelete: "set null",
  }),
  bannerId: integer("banner_id").references(() => files.id, {
    onDelete: "set null",
  }),

  description: text("description"),

  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),

  order: integer("order").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Category = typeof productCategories.$inferSelect;
export type NewCategory = typeof productCategories.$inferInsert;

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    image: one(files, {
      fields: [productCategories.imageId],
      references: [files.id],
    }),
    banner: one(files, {
      fields: [productCategories.bannerId],
      references: [files.id],
    }),
    parent: one(productCategories, {
      fields: [productCategories.parentId],
      references: [productCategories.id],
    }),
  })
);
