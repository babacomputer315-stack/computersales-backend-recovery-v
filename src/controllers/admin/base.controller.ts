import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import {
  successResponse,
  errorResponse,
  NotFoundException,
} from "../../utils/apiResponse";
import {
  getNumber,
  getNumberOrUndefined,
  getString,
  isValidSortBy,
  isValidSortOrder,
} from "../../utils/filterFormatter";

interface CrudService<T> {
  getAll: (filters: any) => Promise<{ data: T[]; meta?: any }>;
  getById: (id: number) => Promise<T | null>;
  create: (data: any) => Promise<T>;
  update: (id: number, data: any) => Promise<T>;
  delete: (id: number) => Promise<any>;
}

interface ControllerOptions {
  messages?: {
    notFound?: string;
    created?: string;
    updated?: string;
    deleted?: string;
  };
  buildFilters?: (req: Request) => any;
}

export function createCrudController<T>(
  service: CrudService<T>,
  options: ControllerOptions = {}
) {
  const {
    notFound = "موردی با این شناسه یافت نشد",
    created = "با موفقیت ثبت شد",
    updated = "با موفقیت ویرایش شد",
    deleted = "با موفقیت حذف شد",
  } = options.messages || {};

  return {
    getAll: asyncHandler(async (req: Request, res: Response) => {
      const filters = options.buildFilters
        ? options.buildFilters(req)
        : {
            name: getString(req.query.name),
            slug: getString(req.query.slug),
            sortBy: isValidSortBy(req.query.sortBy)
              ? req.query.sortBy
              : undefined,
            sortOrder: isValidSortOrder(req.query.sortOrder)
              ? req.query.sortOrder
              : undefined,
            page: getNumberOrUndefined(req.query.page),
            limit: getNumberOrUndefined(req.query.limit),
          };

      const result = await service.getAll(filters);
      return successResponse(res, result.data, "", 200, result.meta);
    }),

    getById: asyncHandler(async (req: Request, res: Response) => {
      const id = getNumber(req.params.id);

      if (!id) return errorResponse(res, "", null, 400);

      const item = await service.getById(id);

      if (!item) throw new NotFoundException(notFound);
      return successResponse(res, item);
    }),

    create: asyncHandler(async (req: Request, res: Response) => {
      const item = await service.create(req.body);
      return successResponse(res, item, created, 201);
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
      const id = getNumber(req.params.id);
      if (!id) return errorResponse(res, "Invalid ID", 400);

      const updatedItem = await service.update(id, req.body);
      return successResponse(res, updatedItem, updated, 200);
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
      const id = getNumber(req.params.id);
      if (!id) return errorResponse(res, "Invalid ID", 400);

      await service.delete(id);
      return successResponse(res, null, deleted, 200);
    }),
  };
}
