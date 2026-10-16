import { Response } from "express";

interface ApiResponseParams<T = any> {
  res: Response;
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
  errors?: any;
}

const baseApiResponse = <T = any>({
  res,
  statusCode,
  success,
  message,
  data,
  meta,
  errors,
}: ApiResponseParams<T>): Response => {
  return res.status(statusCode).json({
    success,
    message,
    data: data ?? null,
    meta: meta ?? undefined,
    errors: errors ?? null,
  });
};

export const successResponse = <T = any>(
  res: Response,
  data?: T,
  message = "",
  statusCode = 200,
  meta?: any
) => {
  return baseApiResponse({
    res,
    statusCode,
    success: true,
    message,
    data,
    meta,
  });
};

export const errorResponse = (
  res: Response,
  message = "Internal server error",
  errors?: any,
  statusCode = 500
) => {
  return baseApiResponse({ res, statusCode, success: false, message, errors });
};

export class HttpException extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class InternalServerException extends HttpException {
  constructor(message = "Internal server error") {
    super(message, 500);
  }
}
