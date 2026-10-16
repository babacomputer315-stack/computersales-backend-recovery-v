import https from "https";

const url = `https://console.melipayamak.com/api/send/shared/${process.env.SMSTOKEN}`;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const sendSms = async (mobile: string, code: number) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        to: mobile,
        bodyId: process.env.SMS_BODY_ID,
        args: [code.toString()],
      }),
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: headers,
      // @ts-ignore
      agent: httpsAgent,
    });

    await res.json();

    return code;
  } catch (error: any) {
    console.error("Send OTP error:", error);
    console.error("Cause:", error?.cause);
    return code;
  }
};

export default sendSms;
