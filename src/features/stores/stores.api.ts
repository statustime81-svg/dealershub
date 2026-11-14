import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  storeSettingsSchema, storeWorkspaceSchema, storeBannerSchema,
  storeBannerFormSchema, taxonomyItemSchema,
  type StoreSettingsValues, type StoreBannerValues, type StoreTaxonomyKind,
} from "./stores.schemas";

export async function getStoreWorkspace(
  businessId: string, storeId: string, signal?: AbortSignal,
) {
  const supabase = getSupabaseClient();
  let request = supabase.from("stores").select(`
    id, business_id, name, slug, description, is_published, updated_at,
    business:businesses(company_name, logo_path, business_type, verification_status)
  `).eq("business_id", businessId).eq("id", storeId);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request.single();
  if (error) throw error;
  return storeWorkspaceSchema.parse(data);
}

export async function saveStoreSettings(input: {
  businessId: string; storeId: string; expectedUpdatedAt: string;
  values: StoreSettingsValues;
}) {
  const values = storeSettingsSchema.parse(input.values);
  const { data, error } = await getSupabaseClient().from("stores")
    .update({ name: values.name, slug: values.slug,
      description: values.description || null,
      is_published: values.isPublished })
    .eq("business_id", input.businessId).eq("id", input.storeId)
    .eq("updated_at", input.expectedUpdatedAt)
    .select("id").single();
  if (error) throw error;
  return z.object({ id: z.string().uuid() }).parse(data);
}

export async function saveBusinessLogo(businessId: string, imagePath: string) {
  if (imagePath.split("/")[0] !== businessId) {
    throw new Error("Invalid business logo path.");
  }
  const { error } = await getSupabaseClient().from("businesses")
    .update({ logo_path: imagePath }).eq("id", businessId)
    .select("id").single();
  if (error) throw error;
}

export async function getStoreBanners(storeId: string, signal?: AbortSignal) {
  let request = getSupabaseClient().from("store_banners")
    .select("id, store_id, image_path, heading, description, sort_order, is_active")
    .eq("store_id", storeId).order("sort_order").order("id");
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return z.array(storeBannerSchema).parse(data ?? []);
}

export async function saveStoreBanner(input: {
  storeId: string; bannerId: string; create: boolean;
  values: StoreBannerValues;
}) {
  const values = storeBannerFormSchema.parse(input.values);
  if (values.imagePath.split("/")[0] !== input.storeId) {
    throw new Error("Invalid store banner path.");
  }
  const row = {
    image_path: values.imagePath,
    heading: values.heading || null,
    description: values.description || null,
    sort_order: values.sortOrder,
    is_active: values.isActive,
  };
  const supabase = getSupabaseClient();
  const request = input.create
    ? supabase.from("store_banners").insert({
        ...row, id: input.bannerId, store_id: input.storeId,
      })
    : supabase.from("store_banners").update(row)
        .eq("id", input.bannerId).eq("store_id", input.storeId);
  const { error } = await request.select("id").single();
  if (error) throw error;
}

export async function setBannerActive(
  storeId: string, bannerId: string, isActive: boolean,
) {
  const { error } = await getSupabaseClient().from("store_banners")
    .update({ is_active: isActive }).eq("id", bannerId)
    .eq("store_id", storeId).select("id").single();
  if (error) throw error;
}

export async function getStoreTaxonomy(
  storeId: string, kind: StoreTaxonomyKind, signal?: AbortSignal,
) {
  const source = kind === "categories" ? "product_categories" : "brands";
  const mapping = kind === "categories" ? "store_categories" : "store_brands";
  const field = kind === "categories" ? "category_id" : "brand_id";
  const supabase = getSupabaseClient();
  let all = supabase.from(source).select("id, name, is_active")
    .eq("is_active", true).order("name");
  if (kind === "categories") {
    const {data: store, error} = await supabase.from("stores").select("business_id").eq("id", storeId).single();
    if (error) throw error;
    const businessId = z.string().uuid().parse(store?.business_id);
    all = all.or(`owner_business_id.is.null,owner_business_id.eq.${businessId}`);
  }
  let assigned = supabase.from(mapping).select(field).eq("store_id", storeId);
  if (signal) {
    all = all.abortSignal(signal);
    assigned = assigned.abortSignal(signal);
  }
  const [allResult, assignedResult] = await Promise.all([all, assigned]);
  if (allResult.error) throw allResult.error;
  if (assignedResult.error) throw assignedResult.error;
  const links = z.array(z.record(z.string().uuid())).parse(assignedResult.data ?? []);
  return {
    items: z.array(taxonomyItemSchema).parse(allResult.data ?? []),
    assignedIds: links.map((link) => link[field]),
  };
}

export async function setStoreTaxonomy(input: {
  storeId: string; kind: StoreTaxonomyKind; itemId: string; enabled: boolean;
}) {
  const mapping = input.kind === "categories" ? "store_categories" : "store_brands";
  const field = input.kind === "categories" ? "category_id" : "brand_id";
  z.string().uuid().parse(input.itemId);
  const supabase = getSupabaseClient();
  const request = input.enabled
    ? supabase.from(mapping).upsert({ store_id: input.storeId, [field]: input.itemId })
    : supabase.from(mapping).delete().eq("store_id", input.storeId).eq(field, input.itemId);
  const { error } = await request;
  if (error) throw error;
}
