import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { UnauthorizedException } from "../utils/apiResponse";

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      throw new UnauthorizedException("Access token is required");
    }

    // Verify token and get user
    const user = await AuthService.verifyToken(token);

    // Add user to request object
    (req as any).user = user;

    next();
  } catch (error: any) {
    if (error instanceof UnauthorizedException) {
      return res.status(401).json({
        success: false,
        message: error.message,
        data: null,
        errors: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: "خطا در ورود به حساب کاربری",
      data: null,
      errors: null,
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      throw new UnauthorizedException("User not authenticated");
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Super Admin role required",
        data: null,
        errors: null,
      });
    }

    next();
  } catch (error: any) {
    if (error instanceof UnauthorizedException) {
      return res.status(401).json({
        success: false,
        message: error.message,
        data: null,
        errors: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      errors: null,
    });
  }
};

/**
 * Middleware to check if user has super_admin role
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      throw new UnauthorizedException("User not authenticated");
    }

    if (user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin role required",
        data: null,
        errors: null,
      });
    }

    next();
  } catch (error: any) {
    if (error instanceof UnauthorizedException) {
      return res.status(401).json({
        success: false,
        message: error.message,
        data: null,
        errors: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      errors: null,
    });
  }
};
/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      try {
        const user = await AuthService.verifyToken(token);
        (req as any).user = user;
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.warn("Invalid token in optional auth:", error);
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
