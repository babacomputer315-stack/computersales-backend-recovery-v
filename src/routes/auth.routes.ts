import { Router } from "express";
import {
  AuthController,
  registerValidation,
  verifyOTPValidation,
  resendOTPValidation,
  refreshTokenValidation,
  updateProfileValidation,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

/**
 * @route POST /auth/register
 * @desc Register user and send OTP
 * @access Public
 */
router.post("/register", AuthController.register);

/**
 * @route POST /auth/verify-otp
 * @desc Verify OTP and login user
 * @access Public
 */
router.post(
  "/verify-otp",
  verifyOTPValidation,
  AuthController.verifyOTPAndLogin
);

/**
 * @route POST /auth/resend-otp
 * @desc Resend OTP to user
 * @access Public
 */
router.post("/resend-otp", resendOTPValidation, AuthController.resendOTP);

/**
 * @route POST /auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post(
  "/refresh-token",
  refreshTokenValidation,
  AuthController.refreshToken
);

/**
 * @route GET /auth/profile
 * @desc Get user profile
 * @access Private
 */
router.get("/profile", authenticateToken, AuthController.getProfile);

/**
 * @route PUT /auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  "/profile",
  authenticateToken,
  updateProfileValidation,
  AuthController.updateProfile
);

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Private
 */
router.post("/logout", authenticateToken, AuthController.logout);

export default router;
