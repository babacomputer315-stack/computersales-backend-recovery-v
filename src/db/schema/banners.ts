import {
  pgTable,
  varchar,
  integer,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { files } from "./files";

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  imageId: integer("image_id").references(() => files.id, {
    onDelete: "set null",
  }),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bannersRelations = relations(banners, ({ one }) => ({
  image: one(files, {
    fields: [banners.imageId],
    references: [files.id],
  }),
}));

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
