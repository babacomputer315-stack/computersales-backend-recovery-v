import {
  pgTable,
  timestamp,
  serial,
  integer,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./product";
import { User, users } from "../users";

export const productComments = pgTable("product_comments", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  authorId: integer("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull(),
  isApproved: boolean("is_approved").default(false),
  rating: integer("rating").default(0),
  answer: text("answer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productCommentsRelations = relations(
  productComments,
  ({ one }) => ({
    product: one(products, {
      fields: [productComments.productId],
      references: [products.id],
    }),
    author: one(users, {
      fields: [productComments.authorId],
      references: [users.id],
    }),
  })
);

export type ProductCommentWithRelations = ProductComment & {
  author?: User;
};

export type ProductComment = typeof productComments.$inferSelect;
export type NewProductComment = typeof productComments.$inferInsert;
