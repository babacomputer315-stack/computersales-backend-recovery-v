import { db } from "../../../db/client";
import { Attribute, attributeValues, attributes } from "../../../db/schema";
import { createCrudService } from "../base.service";
import { inArray } from "drizzle-orm";
import { fetchPaginatedList } from "../../../utils/queryBuilder";

export const attributeService = {
  ...createCrudService({
    table: attributes as any,
    getId: (t) => t.id,
    slugColumn: attributes.slug,
    searchableFields: ["name", "slug"],
    sortableFields: ["name", "createdAt", "updatedAt"],
  }),

  async getAll(filters: any) {
    const result = await fetchPaginatedList({
      table: attributes,
      filters,
      searchableFields: ["name", "slug"],
      sortableFields: ["name", "createdAt", "updatedAt"],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
      page: filters.page,
      limit: filters.limit,
    });

    const attributeIds = result.data.map((attr: Attribute) => attr.id);

    if (attributeIds.length === 0) {
      return { data: [], meta: result.meta };
    }

    const attributeValuesResult = await db
      .select()
      .from(attributeValues)
      .where(inArray(attributeValues.attributeId, attributeIds));

    const valuesMap = new Map<number, any[]>();
    for (const val of attributeValuesResult) {
      if (!valuesMap.has(val.attributeId)) {
        valuesMap.set(val.attributeId, []);
      }
      valuesMap.get(val.attributeId)!.push(val);
    }

    const finalData = result.data.map((attr: Attribute) => ({
      ...attr,
      values: valuesMap.get(attr.id) || [],
    }));

    return {
      data: finalData,
      meta: result.meta,
    };
  },
};
