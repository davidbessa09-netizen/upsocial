import { createClient } from "@/lib/supabase/server";
import type { Platform, Category, Product, PackagePublic } from "@/types/database";

/**
 * Camada de leitura do catálogo público. Sempre seleciona colunas
 * explicitamente para garantir que campos sensíveis (custo, fornecedor)
 * nunca sejam expostos, mesmo que a tabela ganhe novas colunas no futuro.
 */

export async function getActivePlatforms(): Promise<Platform[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platforms")
    .select("id, name, slug, icon, color, display_order, active, created_at, updated_at")
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPlatformBySlug(slug: string): Promise<Platform | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platforms")
    .select("id, name, slug, icon, color, display_order, active, created_at, updated_at")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCategoriesByPlatform(platformId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, platform_id, name, slug, icon, description, display_order, active, created_at, updated_at")
    .eq("platform_id", platformId)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCategoryBySlug(
  platformId: string,
  categorySlug: string,
): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, platform_id, name, slug, icon, description, display_order, active, created_at, updated_at")
    .eq("platform_id", platformId)
    .eq("slug", categorySlug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, product_type, platform_id, category_id, product_category_id, name, slug, description, short_description, input_field_type, estimated_time, has_refill, refill_duration_days, download_limit, access_duration_days, delivery_type, active, featured, display_order, created_at, updated_at",
    )
    .eq("category_id", categoryId)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, product_type, platform_id, category_id, product_category_id, name, slug, description, short_description, input_field_type, estimated_time, has_refill, refill_duration_days, download_limit, access_duration_days, delivery_type, active, featured, display_order, created_at, updated_at",
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Pacotes de um produto — SEM cost_price_cents / supplier_id / supplier_service_id. */
export async function getPackagesByProduct(productId: string): Promise<PackagePublic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("id, product_id, name, quantity, sale_price_cents, badge, is_best_seller, active, display_order")
    .eq("product_id", productId)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, product_type, platform_id, category_id, product_category_id, name, slug, description, short_description, input_field_type, estimated_time, has_refill, refill_duration_days, download_limit, access_duration_days, delivery_type, active, featured, display_order, created_at, updated_at",
    )
    .eq("active", true)
    .eq("featured", true)
    .order("display_order", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
