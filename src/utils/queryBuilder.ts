import { and, asc, desc, eq, ilike, sql, SQL } from "drizzle-orm";
import { db } from "../db/client";
import { JoinConfig } from "../services/admin/base.service";

type SortOrder = "asc" | "desc";

interface PaginationOptions<TTable> {
  table: any;
  filters?: Record<string, any>;
  searchableFields?: string[];
  sortableFields?: string[];
  defaultSortBy?: string;
  defaultSortOrder?: SortOrder;
  page?: number;
  limit?: number;
  joins?: JoinConfig[];
  additionalWhereClauses?: SQL[];
}

export async function fetchPaginatedList<TTable>({
  table,
  filters = {},
  searchableFields = [],
  sortableFields = [],
  defaultSortBy = "createdAt",
  defaultSortOrder = "desc",
  page = 1,
  limit = 20,
  joins = [],
  additionalWhereClauses = [],
}: PaginationOptions<TTable>) {
  const whereClauses: SQL[] = [];

  const excludedKeys = ["page", "limit", "sortBy", "sortOrder"];
  const realFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) =>
        !excludedKeys.includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

  // Handle searchable fields
  for (const field of searchableFields) {
    if (realFilters[field]) {
      whereClauses.push(ilike(table[field], `%${realFilters[field]}%`));
    }
  }

  // Handle equality fields (other filters)
  for (const key in realFilters) {
    const value = realFilters[key];
    if (value !== undefined && !searchableFields.includes(key)) {
      if (value === null) {
        whereClauses.push(sql`${table[key]} IS NULL`);
      } else {
        whereClauses.push(eq(table[key], value));
      }
    }
  }

  const filteredAdditionalClauses = additionalWhereClauses.filter(Boolean);
  if (filteredAdditionalClauses.length) {
    whereClauses.push(...filteredAdditionalClauses);
  }

  const where = whereClauses.length ? and(...whereClauses) : undefined;
  const offset = (page - 1) * limit;

  // --- Calculate total rows ---
  const isGrouped = joins.some((j) => j.isGrouped);
  let total = 0;

  if (isGrouped && table.id) {
    // Use COUNT(DISTINCT) to avoid duplicated rows due to JOIN
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${table.id})` })
      .from(table)
      .where(where);
    total = Number(totalResult.count);
  } else {
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(table)
      .where(where);
    total = Number(totalResult.count);
  }

  const pages = Math.ceil(total / limit);

  // --- Build base select fields ---
  const baseFields = Object.fromEntries(
    Object.keys(table).map((key) => [key, table[key]])
  );

  const joinFields = joins.reduce((acc, join) => {
    acc[join.key] = join.select;
    return acc;
  }, {} as Record<string, any>);

  // --- Build query ---
  let query: any = db
    .select({
      ...baseFields,
      ...joinFields,
    })
    .from(table);

  // Apply joins first
  for (const join of joins) {
    query = query.leftJoin(join.alias, join.condition);
  }

  query = query.where(where).limit(limit).offset(offset);

  // Apply group by if any grouped join
  if (isGrouped) {
    query = query.groupBy(...Object.keys(table).map((key) => table[key]));
  }

  // Apply sorting
  const sortBy =
    filters.sortBy && sortableFields.includes(filters.sortBy)
      ? filters.sortBy
      : defaultSortBy;

  const sortOrder =
    filters.sortOrder && filters.sortOrder === "asc"
      ? asc
      : defaultSortOrder === "asc"
      ? asc
      : desc;

  query = query.orderBy(sortOrder(table[sortBy]));

  // Execute query
  const data = await query;

  return {
    data,
    meta: {
      total,
      page,
      limit,
      pages,
    },
  };
}

// import { and, asc, desc, eq, ilike, sql, SQL } from "drizzle-orm";
// import { db } from "../db/client";
// import { JoinConfig } from "../services/admin/base.service";

// type SortOrder = "asc" | "desc";

// interface PaginationOptions<TTable> {
//   table: any;
//   filters?: Record<string, any>;
//   searchableFields?: string[];
//   sortableFields?: string[];
//   defaultSortBy?: string;
//   defaultSortOrder?: SortOrder;
//   page?: number;
//   limit?: number;
//   joins?: JoinConfig[];
// }

// export async function fetchPaginatedList<TTable>({
//   table,
//   filters = {},
//   searchableFields = [],
//   sortableFields = [],
//   defaultSortBy = "createdAt",
//   defaultSortOrder = "desc",
//   page = 1,
//   limit = 20,
//   joins = [],
// }: PaginationOptions<TTable>) {
//   const whereClauses: SQL[] = [];

//   const excludedKeys = ["page", "limit", "sortBy", "sortOrder"];
//   // const realFilters = Object.fromEntries(
//   //   Object.entries(filters).filter(([key]) => !excludedKeys.includes(key))
//   // );
//   const realFilters = Object.fromEntries(
//     Object.entries(filters).filter(
//       ([key, value]) =>
//         !excludedKeys.includes(key) &&
//         value !== undefined &&
//         value !== null &&
//         value !== ""
//     )
//   );

//   // Handle searchable fields
//   for (const field of searchableFields) {
//     if (realFilters[field]) {
//       whereClauses.push(ilike(table[field], `%${realFilters[field]}%`));
//     }
//   }

//   // Handle equality fields (other filters)
//   for (const key in realFilters) {
//     const value = realFilters[key];
//     if (value !== undefined && !searchableFields.includes(key)) {
//       if (value === null) {
//         whereClauses.push(sql`${table[key]} IS NULL`);
//       } else {
//         whereClauses.push(eq(table[key], value));
//       }
//     }
//   }

//   const where = whereClauses.length ? and(...whereClauses) : undefined;
//   const offset = (page - 1) * limit;

//   // Count total rows
//   const [totalResult] = await db
//     .select({ count: sql<number>`count(*)` })
//     .from(table)
//     .where(where);

//   const total = Number(totalResult.count);
//   const pages = Math.ceil(total / limit);

//   // Build base select
//   const baseFields = Object.fromEntries(
//     Object.keys(table).map((key) => [key, table[key]])
//   );

//   const joinFields = joins.reduce((acc, join) => {
//     acc[join.key] = join.select;
//     return acc;
//   }, {} as Record<string, any>);

//   let query: any = db
//     .select({
//       ...baseFields,
//       ...joinFields,
//     })
//     .from(table)
//     .where(where)
//     .limit(limit)
//     .offset(offset);

//   // Apply joins
//   for (const join of joins) {
//     query = query.leftJoin(join.alias, join.condition);
//   }

//   const groupedJoins = joins.filter((j) => j.isGrouped);
//   if (groupedJoins.length > 0) {
//     query = query.groupBy(
//       // Group by all columns from the main table
//       ...Object.keys(table).map((key) => table[key])
//     );
//   }

//   // Apply sorting
//   const sortBy =
//     filters.sortBy && sortableFields.includes(filters.sortBy)
//       ? filters.sortBy
//       : defaultSortBy;

//   const sortOrder =
//     filters.sortOrder && filters.sortOrder === "asc"
//       ? asc
//       : defaultSortOrder === "asc"
//       ? asc
//       : desc;

//   query = query.orderBy(sortOrder(table[sortBy]));

//   const data = await query;

//   return {
//     data,
//     meta: {
//       total,
//       page,
//       limit,
//       pages,
//     },
//   };
// }
