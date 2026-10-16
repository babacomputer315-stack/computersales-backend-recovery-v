import { and, eq, ne, SQL } from "drizzle-orm";
import { db } from "../../db/client";
import { BadRequestException } from "../../utils/apiResponse";
import { fetchPaginatedList } from "../../utils/queryBuilder";
import { PgTableWithColumns, TableConfig } from "drizzle-orm/pg-core";

export interface JoinConfig {
  alias: any;
  condition: SQL;
  select: Record<string, any>;
  key: string;
  isGrouped?: boolean;
}

export function createCrudService<
  TTable extends PgTableWithColumns<TableConfig>,
  TInsert extends Record<string, any>,
  TUpdate extends Partial<TInsert>
>({
  table,
  getId,
  slugColumn,
  searchableFields,
  sortableFields,
  joins = [],
  getTreeFn,
}: {
  table: TTable;
  getId: (table: TTable) => any;
  slugColumn?: any;
  searchableFields: string[];
  sortableFields: string[];
  joins?: JoinConfig[];
  getTreeFn?: (filters: any) => Promise<any[]>;
}) {
  return {
    async getAll(filters: any) {
      if (filters.tree === "true") {
        if (getTreeFn) {
          const tree = await getTreeFn(filters);
          return { data: tree };
        }
        throw new BadRequestException(
          "Tree view is not supported for this resource."
        );
      }
      return fetchPaginatedList({
        table,
        filters,
        searchableFields,
        sortableFields,
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc",
        page: filters.page,
        limit: filters.limit,
        joins,
      });
    },

    async getById(id: number) {
      const result = await db
        .select()
        .from(table as any)
        .where(eq(getId(table), id));
      return result[0] || null;
    },

    async create(data: TInsert) {
      if (slugColumn) {
        if (
          await isSlugTakenGeneric(table, slugColumn, getId(table), data.slug)
        ) {
          throw new BadRequestException("Slug already exists.");
        }
      }
      const [inserted] = await db.insert(table).values(data).returning();
      return inserted;
    },

    async update(id: number, data: TUpdate) {
      const result = await db
        .update(table)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(getId(table), id))
        .returning();

      if (!Array.isArray(result) || result.length === 0) return null;
      return result[0];
    },

    async delete(id: number) {
      await db.delete(table).where(eq(getId(table), id));
    },
  };
}

export async function isSlugTakenGeneric(
  table: any,
  slugColumn: any,
  idColumn: any,
  slug: string,
  excludeId?: number
) {
  const condition = excludeId
    ? and(eq(slugColumn, slug), ne(idColumn, excludeId))
    : eq(slugColumn, slug);

  const result = await db
    .select({ id: idColumn })
    .from(table)
    .where(condition)
    .limit(1);

  return result.length > 0;
}
