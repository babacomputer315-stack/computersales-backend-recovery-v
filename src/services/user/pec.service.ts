import axios from "axios";

// PEC (Parsian) Payment Gateway Service
// Documentation: https://pec.shaparak.ir

// ============== INTERFACES ==============

export interface PecSaleRequest {
  LoginAccount: string; // Merchant PIN (پین فروشنده)
  Amount: number; // Amount in Rials (مبلغ پرداخت)
  OrderId: number; // Unique order ID (شماره سفارش - یکتا برای تمامی تراکنش‌ها)
  CallBackUrl: string; // Callback URL after payment
  AdditionalData?: string; // Additional data
}

export interface PecSaleResponse {
  Token: number; // Payment token (0 or negative = error)
  Status: number; // 0 = success, other = error code
  Message?: string;
}

export interface PecConfirmRequest {
  LoginAccount: string; // Merchant PIN
  Token: number; // Token from callback
}

export interface PecConfirmResponse {
  Status: number; // 0 = success
  RRN: number; // Reference number
  CardNumberMasked: string; // Masked card number
  Token: number;
}

export interface PecReversalRequest {
  LoginAccount: string;
  Token: number;
}

export interface PecReversalResponse {
  Status: number;
  Token: number;
  Message?: string;
}

export interface PecCallbackData {
  Token: string;
  status: string;
  OrderId: string;
  TerminalNo: string;
  RRN: string;
  HashCardNumber: string;
  Amount: string;
}

// ============== STATUS CODES ==============

export const PEC_STATUS_CODES: Record<number, string> = {
  0: "عملیات موفق",
  "-1": "خطای سرور",
  "-100": "پذیرنده غیرفعال می باشد",
  "-101": "پذیرنده احراز هویت نشد",
  "-102": "تراکنش با موفقیت برگشت داده شد",
  "-103": "قابلیت خرید برای پذیرنده غیر فعال می باشد",
  "-104": "قابلیت پرداخت قبض برای پذیرنده غیر فعال می باشد",
  "-105": "قابلیت تاپ آپ برای پذیرنده غیر فعال می باشد",
  "-106": "قابلیت شارژ برای پذیرنده غیر فعال می باشد",
  "-107": "قابلیت ارسال تاییده تراکنش برای پذیرنده غیر فعال می باشد",
  "-108": "قابلیت برگشت تراکنش برای پذیرنده غیر فعال می باشد",
  "-111": "مبلغ تراکنش بیش از حد مجاز پذیرنده می باشد",
  "-112": "شماره سفارش تکراری است",
  "-113": "پارامتر ورودی خالی می باشد",
  "-114": "شناسه قبض نامعتبر می باشد",
  "-115": "شناسه پرداخت نامعتبر می باشد",
  "-116": "طول رشته بیش از حد مجاز می باشد",
  "-117": "طول رشته کم تر از حد مجاز می باشد",
  "-118": "مقدار ارسال شده عدد نمی باشد",
  "-119": "سازمان نامعتبر می باشد",
  "-120": "طول داده ورودی معتبر نمی باشد",
  "-121": "رشته داده شده بطور کامل عددی نمی باشد",
  "-126": "کد شناسایی پذیرنده معتبر نمی باشد",
  "-127": "آدرس اینترنتی معتبر نمی باشد",
  "-128": "قالب آدرس IP معتبر نمی باشد",
  "-130": "Token زمان منقضی شده است",
  "-131": "Token نامعتبر می باشد",
  "-132": "مبلغ تراکنش کمتر از حداقل مجاز می‌باشد",
  "-138": "عملیات پرداخت توسط کاربر لغو شد",
  1: "صادرکننده کارت از انجام تراکنش صرف نظر کرد",
  2: "عملیات تاییدیه این تراکنش قبلا باموفقیت صورت پذیرفته است",
  3: "پذیرنده فروشگاهی نامعتبر می باشد",
  5: "از انجام تراکنش صرف نظر شد",
  6: "بروز خطایی ناشناخته",
  8: "با تشخیص هویت دارنده کارت، تراکنش موفق می باشد",
  9: "درخواست رسیده در حال پیگیری و انجام است",
  10: "تراکنش با مبلغی پایین تر از مبلغ درخواستی کمبود حساب مشتری پذیرفته شده است",
  12: "تراکنش نامعتبر است",
  13: "مبلغ تراکنش نادرست است",
  14: "شماره کارت ارسالی نامعتبر است (وجود ندارد)",
  15: "صادرکننده کارت نامعتبر است (وجود ندارد)",
  17: "مشتری درخواست کننده حذف شده است",
  20: "در موقعیتی که سوئیچ جهت پذیرش تراکنش نیازمند پرس و جو از کارت است ممکن است این پیام را داشته باشیم",
  21: "در صورتی که پاسخ به درخواست ترمینال نیازمند هیچ پاسخ خاص یا عملکردی نباشیم این پیام را خواهیم داشت",
  22: "تراکنش مشکوک به بد عمل کردن (کارت، ترمینال، دارنده کارت) بوده است لذا پذیرفته نشده است",
  30: "قالب پیام دارای اشکال است",
  31: "پذیرنده توسط سوئیچ پشتیبانی نمی گردد",
  32: "تراکنش به صورت غیر قطعی کامل شده است (به عنوان مثال تراکنش سپرده گذاری که دید مشتری کامل شده است ولی می بایست تکمیل گردد)",
  33: "تاریخ انقضای کارت سپری شده است. کارت توسط دستگاه ضبط گردد",
  38: "تعداد دفعات ورود رمزغلط بیش از حدمجاز است. کارت توسط دستگاه ضبط شود",
  39: "کارت حساب اعتباری ندارد",
  40: "عملیات درخواستی پشتیبانی نمی گردد",
  41: "کارت مفقودی می باشد",
  43: "کارت مسروقه می باشد",
  45: "قبض قابل پرداخت نمی باشد",
  51: "موجودی کافی نمی باشد",
  54: "تاریخ انقضای کارت سپری شده است",
  55: "رمز کارت نا معتبر است",
  56: "کارت نا معتبر است",
  57: "انجام تراکنش مربوطه توسط دارنده کارت مجاز نمی باشد",
  58: "انجام تراکنش مربوطه توسط پایانه انجام دهنده مجاز نمی باشد",
  59: "کارت مظنون به تقلب است",
  61: "مبلغ تراکنش بیش از حد مجاز می باشد",
  62: "کارت محدود شده است",
  63: "تمهیدات امنیتی نقض گردیده است",
  65: "تعداد درخواست تراکنش بیش از حد مجاز می باشد",
  68: "پاسخ لازم برای تکمیل یا انجام تراکنش خیلی دیر رسیده است",
  69: "تعداد دفعات تکرار رمز از حد مجاز گذشته است",
  75: "تعداد دفعات ورود رمزغلط بیش از حدمجاز است",
  78: "کارت فعال نیست",
  79: "حساب متصل به کارت نا معتبر است یا دارای اشکال است",
  80: "درخواست تراکنش رد شده است",
  81: "کارت پذیرفته نشد",
  83: "سرویس دهنده سوئیچ کارت تراکنش را نپذیرفته است",
  84: "در تراکنشهایی که انجام آن مستلزم ارتباط با صادر کننده است در صورت فعال نبودن صادر کننده این پیام در پاسخ ارسال خواهد شد",
  91: "سیستم صدور مجوز انجام تراکنش موقتا غیر فعال است و یا زمان تعیین شده برای صدور مجوز به پایان رسیده است",
  92: "مقصد تراکنش پیدا نشد",
  93: "امکان تکمیل تراکنش وجود ندارد",
};

export class PecService {
  private static readonly SALE_URL =
    "https://pec.shaparak.ir/NewIPGServices/Sale/SaleService.asmx";
  private static readonly CONFIRM_URL =
    "https://pec.shaparak.ir/NewIPGServices/Confirm/ConfirmService.asmx";
  private static readonly REVERSAL_URL =
    "https://pec.shaparak.ir/NewIPGServices/Reverse/ReversalService.asmx";
  private static readonly GATEWAY_URL = "https://pec.shaparak.ir/NewIPG/";

  // Use getters to access env vars at runtime (not at class load time)
  private static get PEC_PIN(): string {
    return process.env.PEC_PIN || "";
  }

  private static get CALLBACK_URL(): string {
    return process.env.CALLBACK_BASE_URL || "http://localhost:3000/cart/checkout";
  }

  // ============== SOAP REQUEST BUILDERS ==============

  private static buildSaleRequestXml(params: PecSaleRequest): string {
    return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><SalePaymentRequest xmlns="https://pec.Shaparak.ir/NewIPGServices/Sale/SaleService"><requestData><LoginAccount>${params.LoginAccount}</LoginAccount><Amount>${params.Amount}</Amount><OrderId>${params.OrderId}</OrderId><CallBackUrl>${params.CallBackUrl}</CallBackUrl><AdditionalData>${params.AdditionalData || ""}</AdditionalData></requestData></SalePaymentRequest></soap:Body></soap:Envelope>`;
  }

  private static buildConfirmRequestXml(params: PecConfirmRequest): string {
    return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><ConfirmPayment xmlns="https://pec.Shaparak.ir/NewIPGServices/Confirm/ConfirmService"><requestData><LoginAccount>${params.LoginAccount}</LoginAccount><Token>${params.Token}</Token></requestData></ConfirmPayment></soap:Body></soap:Envelope>`;
  }

  private static buildReversalRequestXml(params: PecReversalRequest): string {
    return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><ReversalRequest xmlns="https://pec.Shaparak.ir/NewIPGServices/Reverse/ReversalService"><requestData><LoginAccount>${params.LoginAccount}</LoginAccount><Token>${params.Token}</Token></requestData></ReversalRequest></soap:Body></soap:Envelope>`;
  }

  // ============== SOAP RESPONSE PARSERS ==============

  private static parseSaleResponse(xmlResponse: string): PecSaleResponse {
    // Parse Token
    const tokenMatch = xmlResponse.match(/<Token>(-?\d+)<\/Token>/);
    const statusMatch = xmlResponse.match(/<Status>(-?\d+)<\/Status>/);
    const messageMatch = xmlResponse.match(/<Message>([^<]*)<\/Message>/);

    return {
      Token: tokenMatch ? parseInt(tokenMatch[1], 10) : 0,
      Status: statusMatch ? parseInt(statusMatch[1], 10) : -1,
      Message: messageMatch ? messageMatch[1] : undefined,
    };
  }

  private static parseConfirmResponse(xmlResponse: string): PecConfirmResponse {
    const statusMatch = xmlResponse.match(/<Status>(-?\d+)<\/Status>/);
    const rrnMatch = xmlResponse.match(/<RRN>(\d+)<\/RRN>/);
    const cardMatch = xmlResponse.match(/<CardNumberMasked>([^<]*)<\/CardNumberMasked>/);
    const tokenMatch = xmlResponse.match(/<Token>(-?\d+)<\/Token>/);

    return {
      Status: statusMatch ? parseInt(statusMatch[1], 10) : -1,
      RRN: rrnMatch ? parseInt(rrnMatch[1], 10) : 0,
      CardNumberMasked: cardMatch ? cardMatch[1] : "",
      Token: tokenMatch ? parseInt(tokenMatch[1], 10) : 0,
    };
  }

  private static parseReversalResponse(xmlResponse: string): PecReversalResponse {
    const statusMatch = xmlResponse.match(/<Status>(-?\d+)<\/Status>/);
    const tokenMatch = xmlResponse.match(/<Token>(-?\d+)<\/Token>/);
    const messageMatch = xmlResponse.match(/<Message>([^<]*)<\/Message>/);

    return {
      Status: statusMatch ? parseInt(statusMatch[1], 10) : -1,
      Token: tokenMatch ? parseInt(tokenMatch[1], 10) : 0,
      Message: messageMatch ? messageMatch[1] : undefined,
    };
  }

  // ============== API METHODS ==============

  /**
   * Request a new payment token from PEC gateway
   * Step 1: Call SalePaymentRequest to get a Token
   */
  static async requestSale(
    amount: number,
    orderId: number,
    callbackUrl?: string,
    additionalData?: string
  ): Promise<PecSaleResponse> {
    const effectiveCallbackUrl = callbackUrl || this.CALLBACK_URL;

    // Debug logging
    // console.log("[PEC] Initiating sale request:", {
    //   amount,
    //   orderId,
    //   callbackUrl: effectiveCallbackUrl,
    //   pecPinSet: !!this.PEC_PIN,
    //   pecPinLength: this.PEC_PIN.length,
    // });

    const soapXml = this.buildSaleRequestXml({
      LoginAccount: this.PEC_PIN,
      Amount: amount,
      OrderId: orderId,
      CallBackUrl: effectiveCallbackUrl,
      AdditionalData: additionalData,
    });

    try {
      const { data } = await axios.post(this.SALE_URL, soapXml, {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction:
            "https://pec.Shaparak.ir/NewIPGServices/Sale/SaleService/SalePaymentRequest",
        },
        timeout: 30000,
      });

      const response = this.parseSaleResponse(data);
      // console.log("[PEC] Sale response:", response);
      return response;
    } catch (error) {
      console.error("[PEC] Sale Request Error:", error);
      throw new Error(
        `PEC payment request failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Confirm payment after successful callback
   * Step 4: If Status=0 and Token>0, call ConfirmPayment
   */
  static async confirmPayment(token: number): Promise<PecConfirmResponse> {
    const soapXml = this.buildConfirmRequestXml({
      LoginAccount: this.PEC_PIN,
      Token: token,
    });

    try {
      const { data } = await axios.post(this.CONFIRM_URL, soapXml, {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction:
            "https://pec.Shaparak.ir/NewIPGServices/Confirm/ConfirmService/ConfirmPayment",
        },
        timeout: 30000,
      });

      return this.parseConfirmResponse(data);
    } catch (error) {
      console.error("PEC Confirm Payment Error:", error);
      throw new Error(
        `PEC payment confirmation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Reversal request for failed or cancelled transactions
   */
  static async reversalRequest(token: number): Promise<PecReversalResponse> {
    const soapXml = this.buildReversalRequestXml({
      LoginAccount: this.PEC_PIN,
      Token: token,
    });

    try {
      const { data } = await axios.post(this.REVERSAL_URL, soapXml, {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction:
            "https://pec.Shaparak.ir/NewIPGServices/Reverse/ReversalService/ReversalRequest",
        },
        timeout: 30000,
      });

      return this.parseReversalResponse(data);
    } catch (error) {
      console.error("PEC Reversal Request Error:", error);
      throw new Error(
        `PEC reversal request failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get the payment gateway URL for redirecting user
   */
  static getPaymentUrl(token: number): string {
    return `${this.GATEWAY_URL}?Token=${token}`;
  }

  /**
   * Get status message from status code
   */
  static getStatusMessage(status: number): string {
    return PEC_STATUS_CODES[status] || `کد خطا: ${status}`;
  }

  /**
   * Check if the transaction was successful
   */
  static isSuccessful(status: number, token: number): boolean {
    return status === 0 && token > 0;
  }
}

