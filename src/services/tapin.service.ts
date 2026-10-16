import axios, { AxiosInstance } from "axios";

const DEFAULT_BASE_URL =
    process.env.TAPIN_BASE_URL || "https://api.tapin.ir/api/v2/public";
const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_ACCESS_TOKEN =
    process.env.TAPIN_ACCESS_TOKEN || process.env.TAPIN_TOKEN;

// const shopId = process.env.TAPIN_SHOP_ID;
const shopId = "956dcbc2-e527-434d-9ad0-2ccbe4f6742f";

const buildHeaders = (accessToken?: string) => {
    // const token = accessToken ?? DEFAULT_ACCESS_TOKEN;
    const token = `jwt eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYTFkM2FmZmEtZDdjYS00MTExLTliYWQtZmNjMmY0ZjBiN2FiIiwidXNlcm5hbWUiOiIwOTEyMTEyMDcwNyIsImVtYWlsIjoic2hheWFua2FyaW1pMjAwMDVAZ21haWwuY29tIiwiZXhwIjoyNjI0MTc3MDk0LCJvcmlnX2lhdCI6MTc2MDE3NzA5NH0.qw-m4dqBx0RNQZGQfMEMH3v4CWbD5vwziD2kNVJwO6s`;
    return token
        ? {
            // Authorization: `${token}`,
            Authorization: `jwt eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYTFkM2FmZmEtZDdjYS00MTExLTliYWQtZmNjMmY0ZjBiN2FiIiwidXNlcm5hbWUiOiIwOTEyMTEyMDcwNyIsImVtYWlsIjoic2hheWFua2FyaW1pMjAwMDVAZ21haWwuY29tIiwiZXhwIjoyNjI0MTc3MDk0LCJvcmlnX2lhdCI6MTc2MDE3NzA5NH0.qw-m4dqBx0RNQZGQfMEMH3v4CWbD5vwziD2kNVJwO6s`,
            "Content-Type": "application/json",
        }
        : { "Content-Type": "application/json" };
};

const createClient = (token?: string): AxiosInstance =>
    axios.create({
        baseURL: DEFAULT_BASE_URL,
        timeout: DEFAULT_TIMEOUT,
        headers: buildHeaders(token),
    });

export interface TapinOrderProductPayload {
    count: number;
    discount: number;
    price: number;
    title: string;
    weight: number;
    product_id?: number | null;
}

export interface TapinOrderPayload {
    register_type: number;
    address: string;
    city_code: number | string;
    province_code: number | string;
    description?: string | null;
    email?: string | null;
    employee_code: number | string;
    first_name: string;
    last_name: string;
    mobile: string;
    phone?: string | null;
    postal_code: string;
    pay_type: number | string;
    order_type: number | string;
    box_id: number;
    kiosk_id: number;
    pre_paid_price?: number;
    package_weight: number;
    presenter_code?: number;
    manual_id: string;
    has_insurance?: boolean | "true" | "false";
    content_type?: number;
    count: number;
    // price: number;
    // discount: number;
    title: string;
    weight: number;
    products: TapinOrderProductPayload[];
}

export interface TapinOrderResponse {
    returns: {
        status: number;
        message: string;
        [key: string]: unknown;
    };
    entries: {
        id: string;
        barcode: string;
        order_id: number;
        status: number;
        first_name: string;
        last_name: string;
        state_code: string;
        city_code: string;
        insurance_price: number;
        insurance_tax: number;
        [key: string]: unknown;
    };
}

export interface TapinPackingBox {
    pk: number;
    length: number;
    width: number;
    height: number;
    title: string;
}

export interface TapinPackingBoxListResponse {
    returns: {
        status: number;
        message: string;
        [key: string]: unknown;
    };
    entries: {
        list: TapinPackingBox[];
        count: number;
        page: number;
        total_count: number;
    };
}

export interface TapinKiosk {
    pk: number;
    post_unit_id: number;
    company: string;
    address: string;
    lat: number;
    lon: number;
}

export interface TapinKioskListResponse {
    returns: {
        status: number;
        message: string;
        [key: string]: unknown;
    };
    entries: {
        list: TapinKiosk[];
        count: number;
        page: number;
        total_count: number;
    };
}

export class TapinService {
    static async registerOrder(
        payload: TapinOrderPayload,
        accessToken?: string
    ): Promise<TapinOrderResponse> {
        const client = createClient(accessToken);
        const { data } = await client.post<TapinOrderResponse>(
            "/order/post/register/",
            { ...payload, shop_id: shopId }
        );
        return data;
    }

    static async getPackingBoxes(
        shopId: string,
        accessToken?: string
    ): Promise<TapinPackingBoxListResponse> {
        const client = createClient(accessToken);
        const data = await client.post<TapinPackingBoxListResponse>(
            "/order/post/packing-box/",
            { shop_id: shopId }
        );
        return data.data;
    }

    static async getKioskList(
        shopId: string,
        provinceCode: number,
        cityCode: number,
        accessToken?: string
    ): Promise<TapinKioskListResponse> {
        const client = createClient(accessToken);
        const { data } = await client.post<TapinKioskListResponse>(
            "/order/post/kiosk/",
            {
                shop_id: shopId,
                province_code: provinceCode,
                city_code: cityCode,
            }
        );
        return data;
    }

    static async findSuitableBox(
        products: { id: number, length: number, width: number, height: number }[],
    ): Promise<TapinPackingBox | null> {

        const { entries: boxes } = await this.getPackingBoxes(shopId);

        if (!products.length) return null

        const requiredLength = Math.max(...products.map(p => p.length ?? 0))
        const requiredWidth = Math.max(...products.map(p => p.width ?? 0))
        const requiredHeight = products.reduce((sum, p) => sum + (p.height ?? 0), 0)

        const suitableBoxes = boxes.list.filter(box =>
            box.length >= requiredLength &&
            box.width >= requiredWidth &&
            box.height >= requiredHeight
        )

        if (!suitableBoxes.length) return null

        return suitableBoxes.sort((a, b) =>
            a.length * a.width * a.height -
            b.length * b.width * b.height
        )[0]
    }
}

