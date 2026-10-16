import {
  pgTable,
  varchar,
  timestamp,
  serial,
  text,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { categoryToSpecifications } from "./categoryToSpecifications";
import { productSpecifications } from "./productSpecifications";
import { specificationOptions } from "./specificationOptions";

export const specificationTypeEnum = pgEnum("specification_type", [
  "text",
  "select",
  "multi_select",
]);

export const specifications = pgTable("specifications", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  description: text("description"),
  type: specificationTypeEnum("type").default("text").notNull(),
  unit: varchar("unit", { length: 50 }),
  isSearchable: boolean("is_searchable").default(true),
  isFilterable: boolean("is_filterable").default(true),
  isComparable: boolean("is_comparable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const specificationsRelations = relations(
  specifications,
  ({ many }) => ({
    categorySpecs: many(categoryToSpecifications),
    productSpecs: many(productSpecifications),
    options: many(specificationOptions),
  })
);

export type Specification = typeof specifications.$inferSelect;
export type NewSpecification = typeof specifications.$inferInsert;
