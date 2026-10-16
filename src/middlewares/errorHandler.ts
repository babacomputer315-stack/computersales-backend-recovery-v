import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/apiResponse";
import { HttpException } from "../utils/apiResponse";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isHttpError = err instanceof HttpException;
  const statusCode = isHttpError ? err.statusCode : 500;
  const message = err.message || "Internal server error";
  const stack = process.env.NODE_ENV === "development" ? err.stack : undefined;

  return errorResponse(res, message, stack, statusCode);
};
