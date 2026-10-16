import { Request, Response } from "express";
import {
  UserPaymentService,
  PaymentProvider,
} from "../../services/user/payment.service";
import { PecCallbackData } from "../../services/user/pec.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export const getPaymentByOrderId = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const orderId = parseInt(req.params.orderId, 10);

    const payment = await UserPaymentService.getPaymentByOrderId(
      userId,
      orderId
    );
    return successResponse(res, payment, "");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getUserPayments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page = "1", limit = "10" } = req.query;

    const result = await UserPaymentService.getUserPayments(
      userId,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    return successResponse(res, result.payments, "", 200, result.pagination);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch payments", err);
  }
};

/**
 * Initiate payment for an order
 * @body provider - Payment provider: "zibal" or "pec" (default: "zibal")
 */
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const orderId = parseInt(req.params.orderId, 10);
    const provider = (req.body.provider as PaymentProvider) || "zibal";

    // Validate provider
    if (!["zibal", "pec"].includes(provider)) {
      return errorResponse(
        res,
        "Invalid payment provider. Use 'zibal' or 'pec'",
        null,
        400
      );
    }

    const result = await UserPaymentService.initiatePayment(
      userId,
      orderId,
      provider
    );
    return successResponse(res, result, "");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const orderId = parseInt(req.params.orderId, 10);
    const { trackingCode, provider } = req.body;

    if (!trackingCode) {
      return errorResponse(res, "Tracking code is required", null, 400);
    }

    if (!provider) {
      return errorResponse(res, "Payment provider is required", null, 400);
    }

    // Validate provider
    if (!["zibal", "pec"].includes(provider)) {
      return errorResponse(
        res,
        "Invalid payment provider. Use 'zibal' or 'pec'",
        null,
        400
      );
    }

    const result = await UserPaymentService.verifyPayment(userId, orderId, {
      trackingCode,
      provider,
    });

    return successResponse(res, result, result.message);
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const orderId = parseInt(req.params.orderId, 10);

    const status = await UserPaymentService.getPaymentStatus(userId, orderId);
    return successResponse(res, status, "");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const refundPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const orderId = parseInt(req.params.orderId, 10);

    const result = await UserPaymentService.refundPayment(userId, orderId);
    return successResponse(res, result, result.message);
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

/**
 * Handle Zibal payment gateway callback
 * Called when user returns from Zibal payment page
 */
export const handleZibalCallback = async (req: Request, res: Response) => {
  try {
    const { trackId, success, orderId } = req.body;

    if (!trackId) {
      return errorResponse(res, "Track ID is required", null, 400);
    }

    const result = await UserPaymentService.handleZibalCallback(
      trackId,
      success === true || success === "true",
      orderId
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "",
      });
    } else {
      return errorResponse(
        res,
        result.error || "Callback processing failed",
        null,
        500
      );
    }
  } catch (err: any) {
    console.error("Zibal callback error:", err);
    return errorResponse(res, "Callback processing failed", err, 500);
  }
};

/**
 * Handle PEC (Parsian) payment gateway callback
 * Called when user returns from PEC payment page
 * PEC sends data via POST with form data
 */
export const handlePecCallback = async (req: Request, res: Response) => {
  try {
    // PEC callback data comes as form data
    const callbackData: PecCallbackData = {
      Token: req.body.Token || req.query.Token,
      status: req.body.status || req.query.status,
      OrderId: req.body.OrderId || req.query.OrderId,
      TerminalNo: req.body.TerminalNo || req.query.TerminalNo,
      RRN: req.body.RRN || req.query.RRN,
      HashCardNumber: req.body.HashCardNumber || req.query.HashCardNumber,
      Amount: req.body.Amount || req.query.Amount,
    };

    if (!callbackData.Token) {
      return errorResponse(res, "Token is required", null, 400);
    }

    const result = await UserPaymentService.handlePecCallback(callbackData);

    if (result.success) {
      // Redirect to success page or return success response
      // You can customize the redirect URL based on your frontend
      // const successUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/cart/checkout?status=success&orderId=${result.orderId}&rrn=${result.rrn}`;
      // return res.redirect(successUrl);
      return successResponse(res, result);
    } else {
      // Redirect to failure page
      // const failureUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/cart/checkout?status=failed&orderId=${result.orderId}&message=${encodeURIComponent(result.message || "پرداخت ناموفق بود")}`;
      // return res.redirect(failureUrl);
      return errorResponse(res, "پرداخت ناموفق بود");
    }
  } catch (err: any) {
    console.error("PEC callback error:", err);
    // const failureUrl = `${
    //   process.env.FRONTEND_URL || "http://localhost:3000"
    // }/cart/checkout?status=error&message=${encodeURIComponent(
    //   "خطا در پردازش نتیجه پرداخت"
    // )}`;
    // return res.redirect(failureUrl);
    return errorResponse(res, "خطا در پردازش نتیجه پرداخت");
  }
};

/**
 * Get available payment providers
 */
export const getAvailableProviders = async (req: Request, res: Response) => {
  try {
    const providers = [
      {
        id: "zibal",
        name: "زیبال",
        nameEn: "Zibal",
        logo: "/images/payment/zibal.png",
        enabled: !!process.env.ZIBAL_MERCHANT_ID,
      },
      {
        id: "pec",
        name: "پارسیان",
        nameEn: "Parsian (PEC)",
        logo: "/images/payment/parsian.png",
        enabled: !!process.env.PEC_PIN,
      },
    ];

    return successResponse(
      res,
      providers.filter((p) => p.enabled),
      ""
    );
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};
