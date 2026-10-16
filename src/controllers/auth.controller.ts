import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { body, validationResult } from "express-validator";

export class AuthController {
  /**
   * Register user and send OTP
   */
  static async register(req: Request, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Validation failed", errors.array(), 400);
      }
      const { mobile, role = "user" } = req.body;
      const result = await AuthService.register(mobile, role);

      return successResponse(res, result, result.message, 201);
    } catch (error: any) {
      return errorResponse(res, error.message, null, error.statusCode || 500);
    }
  }

  /**
   * Verify OTP and login user
   */
  static async verifyOTPAndLogin(req: Request, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Validation failed", errors.array(), 400);
      }

      const { mobile, otpCode } = req.body;

      const result = await AuthService.verifyOTPAndLogin(mobile, otpCode);

      return successResponse(res, result, "با موفقیت وارد حساب کاربری شدید");
    } catch (error: any) {
      return errorResponse(res, error.message, null, error.statusCode || 500);
    }
  }

  /**
   * Resend OTP to user
   */
  static async resendOTP(req: Request, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Validation failed", errors.array(), 400);
      }

      const { mobile } = req.body;

      const result = await AuthService.resendOTP(mobile);

      return successResponse(res, result, result.message);
    } catch (error: any) {
      return errorResponse(res, error.message, null, error.statusCode || 500);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Validation failed", errors.array(), 400);
      }

      const { refreshToken } = req.body;

      const result = await AuthService.refreshToken(refreshToken);

      return successResponse(res, result);
    } catch (error: any) {
      return errorResponse(res, error.message, null, error.statusCode || 500);
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return errorResponse(res, "لطفا وارد حساب کاربری خود شوید", null, 401);
      }

      const user = await AuthService.getProfile(userId);

      return successResponse(res, user);
    } catch (error: any) {
      return errorResponse(res, error.message, null, error.statusCode || 500);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Validation failed", errors.array(), 400);
      }

      const userId = (req as any).user?.id;

      if (!userId) {
        return errorResponse(res, "لطفا وارد حساب کاربری خود شوید", null, 401);
      }

      const { firstName, lastName, nationalCode, email, phone, birthDate } =
        req.body;

      const user = await AuthService.updateProfile(userId, {
        firstName,
        lastName,
        nationalCode,
        email,
        phone,
        birthDate,
      });

      return successResponse(res, user, "اطلاعات شما با موفقیت ویرایش شد");
    } catch (error: any) {
      return errorResponse(res, error.message, null, error.statusCode || 500);
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return errorResponse(res, "User not authenticated", null, 401);
      }

      const result = await AuthService.logout(userId);

      return successResponse(res, result, result.message);
    } catch (error: any) {
      return errorResponse(res, error.message, null, error.statusCode || 500);
    }
  }
}

// Validation rules
export const registerValidation = [
  body("mobile")
    .isMobilePhone("fa-IR")
    .withMessage("لطفا شماره موبایل معتبر وارد کنید"),
  body("name")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage(
      "نام و نام خانوادگی باید بیشتر از 2 و کمتر از 50 کاراکتر باشد"
    ),
];

export const verifyOTPValidation = [
  body("mobile")
    .isMobilePhone("fa-IR")
    .withMessage("لطفا شماره موبایل معتبر وارد کنید"),
  body("otpCode")
    .isLength({ min: 4, max: 4 })
    .isNumeric()
    .withMessage("کد تایید باید 4 رقمی باشد"),
];

export const resendOTPValidation = [
  body("mobile")
    .isMobilePhone("fa-IR")
    .withMessage("لطفا شماره موبایل معتبر وارد کنید"),
];

export const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("توکن رفرش باید وارد شود"),
];

export const updateProfileValidation = [
  body("firstName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("نام باید بیشتر از 2 و کمتر از 50 کاراکتر باشد"),
  body("lastName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("نام خانوادگی باید بیشتر از 2 و کمتر از 50 کاراکتر باشد"),
];
