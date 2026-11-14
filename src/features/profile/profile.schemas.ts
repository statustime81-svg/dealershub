import { z } from "zod";
export const accountProfileSchema=z.object({id:z.string().uuid(),full_name:z.string(),phone:z.string().nullable(),updated_at:z.string()});
export const dealerProfileSchema=z.object({user_id:z.string().uuid(),company_name:z.string(),contact_phone:z.string().nullable(),address:z.string().nullable(),gstin:z.string().nullable(),updated_at:z.string()});
export const profileValuesSchema=z.object({fullName:z.string().trim().min(1).max(200),phone:z.string().trim().max(30)});
export const dealerValuesSchema=z.object({companyName:z.string().trim().min(1).max(200),contactPhone:z.string().trim().max(30),address:z.string().trim().max(2000),gstin:z.string().trim().max(30)});
export type AccountProfile=z.infer<typeof accountProfileSchema>;
export type DealerProfile=z.infer<typeof dealerProfileSchema>;
