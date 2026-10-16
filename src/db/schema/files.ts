import {
  pgTable,
  varchar,
  integer,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  size: integer("size"),
  type: varchar("type", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
