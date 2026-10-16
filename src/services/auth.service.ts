import { db } from "../db/client";
import { users } from "../db/schema/users";
import { and, eq } from "drizzle-orm";
import {
  BadRequestException,
  UnauthorizedException,
  InternalServerException,
} from "../utils/apiResponse";
import jwt from "jsonwebtoken";
import sendOtp from "../utils/sendOtp";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OTPData {
  code: string;
  expiresAt: Date;
  attempts: number;
}

export class AuthService {
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key";
  private static readonly JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
  private static readonly OTP_EXPIRY_MINUTES = 5;
  private static readonly MAX_OTP_ATTEMPTS = 3;

  // In-memory storage for OTP codes (in production, use Redis or database)
  private static otpStore = new Map<string, OTPData>();

  /**
   * Generate a random 4-digit OTP code
   */
  private static generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Generate JWT tokens for user
   */
  private static generateTokens(
    userId: number,
    mobile: string,
    role: string
  ): AuthTokens {
    const accessToken = jwt.sign({ userId, mobile, role }, this.JWT_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign(
      { userId, mobile, role },
      this.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user and send OTP
   */
  static async register(
    mobile: string,
    role: "user" | "admin" | "super_admin"
  ): Promise<{ message: string; userId?: number }> {
    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.mobile, mobile))
        .limit(1);

      if (role === "admin" || role === "super_admin") {
        if (
          !existingUser.length ||
          (existingUser[0].role !== "admin" &&
            existingUser[0].role !== "super_admin")
        ) {
          throw new BadRequestException("شما دسترسی به این بخش را ندارید");
        }
      }

      if (existingUser.length > 0) {
        // User exists, send new OTP
        const otpCode = this.generateOTP();
        const expiresAt = new Date(
          Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000
        );

        // Update user's OTP code
        await db
          .update(users)
          .set({ code: otpCode })
          .where(eq(users.mobile, mobile));

        // Store OTP data
        this.otpStore.set(mobile, {
          code: otpCode,
          expiresAt,
          attempts: 0,
        });

        // Send OTP
        await sendOtp(mobile, Number(otpCode));

        return {
          message: "کد تایید برای شماره موبایل شما ارسال شد",
          userId: existingUser[0].id,
        };
      }

      // Create new user
      const otpCode = this.generateOTP();
      const expiresAt = new Date(
        Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000
      );

      const [newUser] = await db
        .insert(users)
        .values({
          mobile,
          code: otpCode,
          role: "user",
          status: "active",
        })
        .returning();

      // Store OTP data
      this.otpStore.set(mobile, {
        code: otpCode,
        expiresAt,
        attempts: 0,
      });

      // Send OTP
      await sendOtp(mobile, Number(otpCode));

      return {
        message: "کد تایید برای شماره موبایل شما ارسال شد",
        userId: newUser.id,
      };
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new InternalServerException(
        error.message || "Failed to register user"
      );
    }
  }

  /**
   * Verify OTP and login user
   */
  static async verifyOTPAndLogin(
    mobile: string,
    otpCode: string
  ): Promise<{ user: any; tokens: AuthTokens }> {
    try {
      // Get user
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.mobile, mobile))
        .limit(1);

      if (userResult.length === 0) {
        throw new BadRequestException("User not found");
      }

      const user = userResult[0];

      // Check if user is blocked
      if (user.status === "blocked") {
        throw new UnauthorizedException("Account is blocked");
      }

      // Get stored OTP data
      const storedOTP = this.otpStore.get(mobile);

      if (!storedOTP) {
        throw new BadRequestException("OTP expired or not found");
      }

      // Check if OTP is expired
      if (new Date() > storedOTP.expiresAt) {
        this.otpStore.delete(mobile);
        throw new BadRequestException("کد تایید منقضی شده است");
      }

      // Check if max attempts exceeded
      if (storedOTP.attempts >= this.MAX_OTP_ATTEMPTS) {
        this.otpStore.delete(mobile);
        throw new BadRequestException(
          "تعداد دفعات ارسال کد تایید بیشتر از حد مجاز است"
        );
      }

      // Verify OTP
      if (storedOTP.code !== otpCode) {
        // Increment attempts
        storedOTP.attempts++;
        this.otpStore.set(mobile, storedOTP);

        throw new BadRequestException("کد تایید معتبر نیست");
      }

      // OTP is valid - clear OTP data
      this.otpStore.delete(mobile);

      // Clear OTP code from database
      await db
        .update(users)
        .set({ code: null })
        .where(eq(users.mobile, mobile));

      // Generate tokens
      const tokens = this.generateTokens(user.id, user.mobile, user.role);

      // Remove sensitive data from user object
      const { code, ...userWithoutCode } = user;

      return {
        user: userWithoutCode,
        tokens,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error("OTP verification error:", error);
      throw new InternalServerException("Failed to verify OTP");
    }
  }

  /**
   * Resend OTP to user
   */
  static async resendOTP(mobile: string): Promise<{ message: string }> {
    try {
      // Check if user exists
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.mobile, mobile))
        .limit(1);

      if (userResult.length === 0) {
        throw new BadRequestException("User not found");
      }

      const user = userResult[0];

      // Check if user is blocked
      if (user.status === "blocked") {
        throw new UnauthorizedException("Account is blocked");
      }

      // Generate new OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date(
        Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000
      );

      // Update user's OTP code
      await db
        .update(users)
        .set({ code: otpCode })
        .where(eq(users.mobile, mobile));

      // Store new OTP data
      this.otpStore.set(mobile, {
        code: otpCode,
        expiresAt,
        attempts: 0,
      });

      // Send OTP
      await sendOtp(mobile, Number(otpCode));

      return {
        message: "کد تایید برای شماره موبایل شما ارسال شد",
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error("Resend OTP error:", error);
      throw new InternalServerException("Failed to resend OTP");
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(
    refreshToken: string
  ): Promise<{ tokens: AuthTokens }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;

      // Get user
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (userResult.length === 0) {
        throw new UnauthorizedException("User not found");
      }

      const user = userResult[0];

      // Check if user is blocked
      if (user.status === "blocked") {
        throw new UnauthorizedException("Account is blocked");
      }

      // Generate new tokens
      const tokens = this.generateTokens(user.id, user.mobile, user.role);

      return { tokens };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException("Invalid refresh token");
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error("Token refresh error:", error);
      throw new InternalServerException("Failed to refresh token");
    }
  }

  /**
   * Verify access token and get user data
   */
  static async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;

      // Get user
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (userResult.length === 0) {
        throw new UnauthorizedException("User not found");
      }

      const user = userResult[0];

      // Check if user is blocked
      if (user.status === "blocked") {
        throw new UnauthorizedException("Account is blocked");
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException("Invalid token");
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error("Token verification error:", error);
      throw new InternalServerException("Failed to verify token");
    }
  }

  /**
   * Logout user (invalidate refresh token)
   * In production, maintain a blacklist of invalidated tokens
   */
  static async logout(userId: number): Promise<{ message: string }> {
    try {
      // In a real implementation, you would add the refresh token to a blacklist
      // or use Redis to track invalidated tokens

      return {
        message: "خروج با موفقیت انجام شد",
      };
    } catch (error) {
      console.error("Logout error:", error);
      throw new InternalServerException("Failed to logout");
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: number): Promise<any> {
    try {
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        throw new BadRequestException("User not found");
      }

      const user = userResult[0];

      // Remove sensitive data
      const { code, ...userProfile } = user;

      return userProfile;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error("Get profile error:", error);
      throw new InternalServerException("Failed to get user profile");
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: number,
    data: {
      // name?: string;
      firstName?: string;
      lastName?: string;
      nationalCode?: string;
      email?: string;
      phone?: string;
      birthDate?: string;
    }
  ): Promise<any> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...data,
          name: `${data.firstName} ${data.lastName}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new BadRequestException("User not found");
      }

      // Remove sensitive data
      const { code, ...userProfile } = updatedUser;

      return userProfile;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error("Update profile error:", error);
      throw new InternalServerException("Failed to update user profile");
    }
  }

  /**
   * Clean up expired OTP codes (should be called periodically)
   */
  static cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [mobile, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(mobile);
      }
    }
  }
}
