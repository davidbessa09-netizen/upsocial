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

export type ProductCardData = Product & {
  from_price_cents: number;
  has_best_seller: boolean;
  category_name: string | null;
};

/**
 * Produtos com o preço do pacote mais barato (para exibir "a partir de")
 * e um indicador de "mais vendido" — usado nos grids da home/catálogo,
 * onde cada card representa um produto (não um pacote específico).
 */
async function attachPricing(products: Product[]): Promise<ProductCardData[]> {
  if (products.length === 0) return [];
  const supabase = await createClient();

  const productIds = products.map((p) => p.id);
  const [{ data: packages }, { data: categories }] = await Promise.all([
    supabase
      .from("packages")
      .select("product_id, sale_price_cents, is_best_seller")
      .in("product_id", productIds)
      .eq("active", true),
    supabase.from("product_categories").select("id, name"),
  ]);

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  return products.map((product) => {
    const productPackages = (packages ?? []).filter((pk) => pk.product_id === product.id);
    const fromPrice = productPackages.length
      ? Math.min(...productPackages.map((pk) => pk.sale_price_cents))
      : 0;
    return {
      ...product,
      from_price_cents: fromPrice,
      has_best_seller: productPackages.some((pk) => pk.is_best_seller),
      category_name: product.product_category_id
        ? (categoryNameById.get(product.product_category_id) ?? null)
        : null,
    };
  });
}

export async function getFeaturedProductsWithPricing(limit = 8): Promise<ProductCardData[]> {
  const products = await getFeaturedProducts(limit);
  return attachPricing(products);
}

export async function getNewestProductsWithPricing(limit = 8): Promise<ProductCardData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, product_type, platform_id, category_id, product_category_id, name, slug, description, short_description, input_field_type, estimated_time, has_refill, refill_duration_days, download_limit, access_duration_days, delivery_type, active, featured, display_order, created_at, updated_at",
    )
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return attachPricing(data ?? []);
}

/** Packs/bundles em destaque (produtos marcados como bundle em `bundles`). */
export async function getFeaturedBundlesWithPricing(limit = 3): Promise<ProductCardData[]> {
  const supabase = await createClient();
  const { data: bundleRows, error } = await supabase
    .from("bundles")
    .select("product_id")
    .limit(limit);

  if (error) throw error;
  const productIds = (bundleRows ?? []).map((b) => b.product_id);
  if (productIds.length === 0) return [];

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      "id, product_type, platform_id, category_id, product_category_id, name, slug, description, short_description, input_field_type, estimated_time, has_refill, refill_duration_days, download_limit, access_duration_days, delivery_type, active, featured, display_order, created_at, updated_at",
    )
    .in("id", productIds)
    .eq("active", true);

  if (productsError) throw productsError;
  return attachPricing(products ?? []);
}

export async function searchProductsWithPricing(opts: {
  categorySlug?: string;
  query?: string;
  limit?: number;
}): Promise<ProductCardData[]> {
  const supabase = await createClient();
  let queryBuilder = supabase
    .from("products")
    .select(
      "id, product_type, platform_id, category_id, product_category_id, name, slug, description, short_description, input_field_type, estimated_time, has_refill, refill_duration_days, download_limit, access_duration_days, delivery_type, active, featured, display_order, created_at, updated_at",
    )
    .eq("active", true);

  if (opts.query) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${opts.query}%,short_description.ilike.%${opts.query}%,description.ilike.%${opts.query}%`,
    );
  }

  if (opts.categorySlug && opts.categorySlug !== "todos") {
    const { data: category } = await supabase
      .from("product_categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle();
    if (category) queryBuilder = queryBuilder.eq("product_category_id", category.id);
  }

  const { data, error } = await queryBuilder
    .order("display_order", { ascending: true })
    .limit(opts.limit ?? 60);

  if (error) throw error;
  return attachPricing(data ?? []);
}

export async function getActiveProductCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, parent_id, name, slug, description, icon, display_order, active, created_at, updated_at")
    .eq("active", true)
    .is("parent_id", null)
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
