// Shared schema value types. The current client intentionally does not depend on
// a hand-written generated Database interface. Generate authoritative Supabase
// client types from the deployed schema after migrations during integration.
export type Json = string | number | boolean | null | { [key:string]: Json | undefined } | Json[];
export type { Business } from "@/types/business";
export type { BusinessMembership } from "@/types/auth";
export type { Product, ProductVariant, ProductCategory, Brand } from "@/types/catalog";
