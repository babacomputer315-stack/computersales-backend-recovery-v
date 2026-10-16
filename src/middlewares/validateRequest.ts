import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { errorResponse } from "../utils/apiResponse";

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(
      res,
      "",
      errors.array().map((err) => err.msg),
      400
    );
  }
  next();
};

export default validateRequest;
