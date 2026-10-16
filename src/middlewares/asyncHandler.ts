import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/apiResponse";

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error) => {
      return errorResponse(
        res,
        error.message || "Internal server error",
        error,
        error.statusCode || 500
      );
    });
  };
};
