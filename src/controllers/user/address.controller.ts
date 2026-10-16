import { Request, Response } from "express";
import { UserAddressService } from "../../services/user/address.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export const getUserAddresses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const data = await UserAddressService.getUserAddresses(userId);
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch user addresses", err);
  }
};

export const getAddressById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const data = await UserAddressService.getAddressById(id, userId);
    return successResponse(res, data, "Address retrieved successfully");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const createAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      fullName,
      phone,
      province,
      provinceCode,
      city,
      cityCode,
      addressLine,
      postalCode,
      plaque,
    } = req.body;

    const data = await UserAddressService.createAddress(
      {
        fullName,
        phone,
        province,
        provinceCode,
        city,
        cityCode,
        addressLine,
        postalCode,
        plaque,
      },
      userId
    );

    return successResponse(res, data, "آدرس با موفقیت ثبت شد");
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to create address", err);
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const {
      fullName,
      phone,
      province,
      provinceCode,
      city,
      cityCode,
      addressLine,
      postalCode,
      plaque,
    } = req.body;

    const data = await UserAddressService.updateAddress(id, userId, {
      fullName,
      phone,
      province,
      provinceCode,
      cityCode,
      city,
      addressLine,
      postalCode,
      plaque,
    });

    return successResponse(res, data, "آدرس با موفقیت ویرایش شد");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;

    await UserAddressService.deleteAddress(id, userId);

    return successResponse(res, null, "آدرس با موفقیت حذف شد");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getAddressCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const count = await UserAddressService.getAddressCount(userId);
    return successResponse(res, { count });
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch address count", err);
  }
};
