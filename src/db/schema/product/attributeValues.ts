import {
  pgTable,
  timestamp,
  serial,
  integer,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import { attributes } from "./attributes";
import { relations } from "drizzle-orm";
import { variationAttributeValues } from "./variationAttributeValues";
import { files } from "../files";

export const attributeValues = pgTable("attribute_values", {
  id: serial("id").primaryKey(),
  attributeId: integer("attribute_id")
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  value: varchar("value", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  fileId: integer("file_id").references(() => files.id),
  colorCode: varchar("color_code", { length: 10 }),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attributeValuesRelations = relations(
  attributeValues,
  ({ one, many }) => ({
    attribute: one(attributes, {
      fields: [attributeValues.attributeId],
      references: [attributes.id],
    }),
    file: one(files, {
      fields: [attributeValues.fileId],
      references: [files.id],
    }),
    variations: many(variationAttributeValues),
  })
);

export type AttributeValue = typeof attributeValues.$inferSelect;
export type NewAttributeValue = typeof attributeValues.$inferInsert;
