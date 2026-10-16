import { Request, Response } from "express";
import { SheetService } from "../../services/admin/sheet.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const data = await SheetService.getAllProducts();
    return res.json(data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const {
      productId,
      variationId,
      regularPrice,
      salePrice,
      stockQuantity,
      stockStatus,
    } = req.body;

    const data = await SheetService.update({
      productId,
      variationId,
      regularPrice,
      salePrice,
      stockQuantity,
      stockStatus,
    });

    return successResponse(
      res,
      data,
      variationId
        ? "Product variation updated successfully"
        : "Product updated successfully"
    );
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};
