const url = `https://console.melipayamak.com/api/send/shared/${process.env.SMSTOKEN}`;

export const sendOrderSms = async (
  mobile: string,
  data: { name: string; orderNumber: string; status: string }
) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      to: mobile,
      bodyId: process.env.ORDER_SMS_BODY_ID,
      args: [
        data.name,
        // data.orderNumber,
        toPersianDigits(data.orderNumber),
        data.status === "pending"
          ? "در انتظار پرداخت"
          : data.status === "processing"
          ? "در حال پردازش"
          : data.status === "completed"
          ? "تحویل داده شده"
          : data.status === "cancelled"
          ? "لغو شده"
          : data.status === "failed"
          ? "پرداخت ناموفق"
          : data.status === "returned"
          ? "مرجوع شده"
          : "",
      ],
    }),
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: headers,
  });

  await res.json();

  return true;
};

const toPersianDigits = (value: string | number) => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return value.toString().replace(/\d/g, (d) => persianDigits[Number(d)]);
};
