"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "./guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductType, InputFieldType, TicketStatus, BriefingFieldType, ManualServiceStage } from "@/types/database";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || name);
  const productType = String(formData.get("product_type")) as ProductType;
  const platformId = String(formData.get("platform_id") ?? "") || null;
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const productCategoryId = String(formData.get("product_category_id") ?? "") || null;

  const { data, error } = await admin
    .from("products")
    .insert({
      name,
      slug,
      product_type: productType,
      platform_id: productType === "AUTOMATED_SERVICE" ? platformId : null,
      category_id: productType === "AUTOMATED_SERVICE" ? categoryId : null,
      product_category_id: productCategoryId,
      description: String(formData.get("description") ?? ""),
      short_description: String(formData.get("short_description") ?? "") || null,
      input_field_type: String(formData.get("input_field_type") ?? "username") as InputFieldType,
      estimated_time: String(formData.get("estimated_time") ?? "") || null,
      has_refill: formData.get("has_refill") === "on",
      refill_duration_days: formData.get("refill_duration_days")
        ? Number(formData.get("refill_duration_days"))
        : null,
      active: formData.get("active") === "on",
      featured: formData.get("featured") === "on",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível criar o produto.");
  }

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${data.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const productType = String(formData.get("product_type")) as ProductType;
  const platformId = String(formData.get("platform_id") ?? "") || null;
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const productCategoryId = String(formData.get("product_category_id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();

  const { error } = await admin
    .from("products")
    .update({
      name,
      slug: slugify(rawSlug || name),
      product_type: productType,
      platform_id: productType === "AUTOMATED_SERVICE" ? platformId : null,
      category_id: productType === "AUTOMATED_SERVICE" ? categoryId : null,
      product_category_id: productCategoryId,
      description: String(formData.get("description") ?? ""),
      short_description: String(formData.get("short_description") ?? "") || null,
      input_field_type: String(formData.get("input_field_type") ?? "username") as InputFieldType,
      estimated_time: String(formData.get("estimated_time") ?? "") || null,
      has_refill: formData.get("has_refill") === "on",
      refill_duration_days: formData.get("refill_duration_days")
        ? Number(formData.get("refill_duration_days"))
        : null,
      active: formData.get("active") === "on",
      featured: formData.get("featured") === "on",
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${productId}`);
}

export async function deleteProduct(productId: string) {
  await requireStaff();
  const admin = createAdminClient();
  // Soft delete: produtos com pedidos associados não podem ser removidos
  // fisicamente (FK restrict) — desativar é o caminho seguro.
  await admin.from("products").update({ active: false }).eq("id", productId);
  revalidatePath("/admin/produtos");
}

export async function createPackage(productId: string, formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const { error } = await admin.from("packages").insert({
    product_id: productId,
    name: String(formData.get("name") ?? "").trim(),
    quantity: Number(formData.get("quantity")),
    sale_price_cents: Math.round(Number(formData.get("sale_price")) * 100),
    cost_price_cents: Math.round(Number(formData.get("cost_price")) * 100),
    supplier_id: String(formData.get("supplier_id") ?? "") || null,
    supplier_service_id: String(formData.get("supplier_service_id") ?? "") || null,
    badge: String(formData.get("badge") ?? "") || null,
    is_best_seller: formData.get("is_best_seller") === "on",
    active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/produtos/${productId}`);
}

export async function updatePackage(productId: string, packageId: string, formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const { error } = await admin
    .from("packages")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      quantity: Number(formData.get("quantity")),
      sale_price_cents: Math.round(Number(formData.get("sale_price")) * 100),
      cost_price_cents: Math.round(Number(formData.get("cost_price")) * 100),
      supplier_id: String(formData.get("supplier_id") ?? "") || null,
      supplier_service_id: String(formData.get("supplier_service_id") ?? "") || null,
      badge: String(formData.get("badge") ?? "") || null,
      is_best_seller: formData.get("is_best_seller") === "on",
      active: formData.get("active") === "on",
    })
    .eq("id", packageId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/produtos/${productId}`);
}

export async function deletePackage(productId: string, packageId: string) {
  await requireStaff();
  const admin = createAdminClient();
  await admin.from("packages").update({ active: false }).eq("id", packageId);
  revalidatePath(`/admin/produtos/${productId}`);
}

export async function createCoupon(formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const { error } = await admin.from("coupons").insert({
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    type: String(formData.get("type") ?? "PERCENTAGE") as "PERCENTAGE" | "FIXED",
    discount_value: Number(formData.get("discount_value")),
    starts_at: String(formData.get("starts_at") ?? "") || null,
    ends_at: String(formData.get("ends_at") ?? "") || null,
    usage_limit: formData.get("usage_limit") ? Number(formData.get("usage_limit")) : null,
    active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/cupons");
}

export async function toggleCoupon(couponId: string, active: boolean) {
  await requireStaff();
  const admin = createAdminClient();
  await admin.from("coupons").update({ active }).eq("id", couponId);
  revalidatePath("/admin/cupons");
}

export async function replyTicket(ticketId: string, formData: FormData) {
  const { user } = await requireStaff();
  const admin = createAdminClient();

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  await admin.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender: "admin",
    sender_id: user.id,
    message,
  });
  await admin.from("support_tickets").update({ status: "RESPONDIDO" }).eq("id", ticketId);
  revalidatePath(`/admin/suporte/${ticketId}`);
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  await requireStaff();
  const admin = createAdminClient();
  await admin.from("support_tickets").update({ status }).eq("id", ticketId);
  revalidatePath(`/admin/suporte/${ticketId}`);
  revalidatePath("/admin/suporte");
}

// --- MANUAL_SERVICE: formulário de briefing (configurado por produto) ---

export async function ensureBriefingForm(productId: string): Promise<string> {
  await requireStaff();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("briefing_forms")
    .select("id")
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await admin
    .from("briefing_forms")
    .insert({ product_id: productId, title: "Briefing do projeto", active: true })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Não foi possível criar o formulário.");
  return data.id;
}

export async function ensureBriefingFormAction(productId: string) {
  await ensureBriefingForm(productId);
  revalidatePath(`/admin/produtos/${productId}`);
}

export async function createBriefingQuestion(productId: string, briefingFormId: string, formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const fieldType = String(formData.get("field_type") ?? "text") as BriefingFieldType;
  const optionsRaw = String(formData.get("options") ?? "").trim();

  const { error } = await admin.from("briefing_questions").insert({
    briefing_form_id: briefingFormId,
    question_text: String(formData.get("question_text") ?? "").trim(),
    field_type: fieldType,
    options: fieldType === "select" && optionsRaw ? optionsRaw.split(",").map((o) => o.trim()) : null,
    required: formData.get("required") === "on",
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/produtos/${productId}`);
}

export async function deleteBriefingQuestion(productId: string, questionId: string) {
  await requireStaff();
  const admin = createAdminClient();
  await admin.from("briefing_questions").delete().eq("id", questionId);
  revalidatePath(`/admin/produtos/${productId}`);
}

// --- MANUAL_SERVICE: acompanhamento do projeto (pedido) ---

export async function updateManualServiceStage(orderNumber: string, stage: ManualServiceStage) {
  await requireStaff();
  const admin = createAdminClient();
  await admin.from("orders").update({ manual_service_stage: stage }).eq("order_number", orderNumber);
  revalidatePath(`/admin/pedidos/${orderNumber}`);
}

export async function addProjectMessage(orderId: string, orderNumber: string, formData: FormData) {
  const { user } = await requireStaff();
  const admin = createAdminClient();

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  await admin.from("project_messages").insert({
    order_id: orderId,
    sender: "admin",
    sender_id: user.id,
    message,
  });
  await admin.from("orders").update({ manual_service_stage: "WAITING_CLIENT" }).eq("id", orderId);
  revalidatePath(`/admin/pedidos/${orderNumber}`);
}

// --- Order bumps (checkout) e upsells (pós-compra) ---

export async function createOrderBump(formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const { error } = await admin.from("order_bumps").insert({
    trigger_product_id: String(formData.get("trigger_product_id")),
    bump_product_id: String(formData.get("offer_product_id")),
    headline: String(formData.get("headline") ?? "").trim(),
    description: String(formData.get("description") ?? "") || null,
    discount_percent: formData.get("discount_percent") ? Number(formData.get("discount_percent")) : null,
    custom_price_cents: formData.get("custom_price")
      ? Math.round(Number(formData.get("custom_price")) * 100)
      : null,
    active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/ofertas");
}

export async function createUpsellOffer(formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const { error } = await admin.from("upsell_offers").insert({
    trigger_product_id: String(formData.get("trigger_product_id")),
    offer_product_id: String(formData.get("offer_product_id")),
    headline: String(formData.get("headline") ?? "").trim(),
    description: String(formData.get("description") ?? "") || null,
    discount_percent: formData.get("discount_percent") ? Number(formData.get("discount_percent")) : null,
    custom_price_cents: formData.get("custom_price")
      ? Math.round(Number(formData.get("custom_price")) * 100)
      : null,
    active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/ofertas");
}

export async function toggleOrderBump(id: string, active: boolean) {
  await requireStaff();
  const admin = createAdminClient();
  await admin.from("order_bumps").update({ active }).eq("id", id);
  revalidatePath("/admin/ofertas");
}

export async function toggleUpsellOffer(id: string, active: boolean) {
  await requireStaff();
  const admin = createAdminClient();
  await admin.from("upsell_offers").update({ active }).eq("id", id);
  revalidatePath("/admin/ofertas");
}

export async function addProjectDelivery(orderId: string, orderNumber: string, formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await admin.from("project_deliveries").insert({
    order_id: orderId,
    title,
    description: String(formData.get("description") ?? "") || null,
    file_url: String(formData.get("file_url") ?? "") || null,
  });
  await admin.from("orders").update({ manual_service_stage: "DELIVERED" }).eq("id", orderId);
  revalidatePath(`/admin/pedidos/${orderNumber}`);
}
