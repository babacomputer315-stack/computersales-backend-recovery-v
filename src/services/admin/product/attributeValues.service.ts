import { eq } from "drizzle-orm";
import { attributeValues, files } from "../../../db/schema";
import { createCrudService } from "../base.service";

export const attributeValuesService = createCrudService({
  table: attributeValues as any,
  getId: (t) => t.id,
  searchableFields: ["value"],
  sortableFields: ["name", "createdAt", "updatedAt"],
  joins: [
    {
      alias: files,
      condition: eq(files.id, attributeValues.fileId),
      select: {
        id: files.id,
        name: files.name,
      },
      key: "file",
    },
  ],
});
