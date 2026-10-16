import { z } from "zod";

export const createAddressSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(255, "Full name must be less than 255 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters").max(20, "Phone number must be less than 20 characters"),
  province: z.string().min(2, "Province must be at least 2 characters").max(100, "Province must be less than 100 characters"),
  city: z.string().min(2, "City must be at least 2 characters").max(100, "City must be less than 100 characters"),
  addressLine: z.string().min(10, "Address line must be at least 10 characters").max(255, "Address line must be less than 255 characters"),
  postalCode: z.string().optional(),
  plaque: z.string().optional(),
});

export const updateAddressSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(255, "Full name must be less than 255 characters").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 characters").max(20, "Phone number must be less than 20 characters").optional(),
  province: z.string().min(2, "Province must be at least 2 characters").max(100, "Province must be less than 100 characters").optional(),
  city: z.string().min(2, "City must be at least 2 characters").max(100, "City must be less than 100 characters").optional(),
  addressLine: z.string().min(10, "Address line must be at least 10 characters").max(255, "Address line must be less than 255 characters").optional(),
  postalCode: z.string().optional(),
  plaque: z.string().optional(),
});

export const getAddressByIdSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, "Invalid address ID"),
  }),
});
