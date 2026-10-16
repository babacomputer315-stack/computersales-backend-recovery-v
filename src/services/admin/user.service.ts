import { users } from "../../db/schema";
import { createCrudService } from "./base.service";
import { db } from "../../db/client";

export const userService = {
  ...createCrudService({
    table: users as any,
    getId: (users) => users.id,
    searchableFields: ["name", "mobile"],
    sortableFields: ["name", "createdAt"],
  }),

  async getById(id: number) {
    const result = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
      with: {
        addresses: true,
        comments: true,
      },
    });
    return result;
  },
};
