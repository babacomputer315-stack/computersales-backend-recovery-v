import {
  pgTable,
  varchar,
  integer,
  timestamp,
  serial,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { files } from "./files";

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  website: varchar("website", { length: 500 }),
  imageId: integer("image_id").references(() => files.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const brandsRelations = relations(brands, ({ one }) => ({
  image: one(files, {
    fields: [brands.imageId],
    references: [files.id],
  }),
}));

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

