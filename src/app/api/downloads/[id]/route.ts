import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerDownload } from "@/types/database";

type Params = { id: string };

type CustomerDownloadRow = CustomerDownload & {
  digital_files: { storage_path: string; file_name: string } | null;
};

/**
 * Gera uma signed URL de curta duração para um download do cliente e
 * redireciona pra ela. Nunca expõe storage_path/URL pública direto —
 * cada acesso passa por aqui, valida dono/limite/expiração e só então
 * assina a URL (service role, bucket privado).
 */
export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const admin = createAdminClient();

  const { data: download } = await admin
    .from("customer_downloads")
    .select("*, digital_files(storage_path, file_name)")
    .eq("id", id)
    .maybeSingle()
    .returns<CustomerDownloadRow>();

  if (!download || download.user_id !== user.id) {
    return NextResponse.json({ error: "Download não encontrado." }, { status: 404 });
  }

  if (download.expires_at && new Date(download.expires_at) < new Date()) {
    return NextResponse.json({ error: "Este download expirou." }, { status: 410 });
  }

  if (download.download_limit !== null && download.download_count >= download.download_limit) {
    return NextResponse.json({ error: "Limite de downloads atingido." }, { status: 403 });
  }

  const file = download.digital_files;
  if (!file) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });

  const { data: signed, error: signError } = await admin.storage
    .from("digital-products")
    .createSignedUrl(file.storage_path, 60, { download: file.file_name });

  if (signError || !signed) {
    return NextResponse.json({ error: "Não foi possível gerar o link de download." }, { status: 500 });
  }

  const now = new Date().toISOString();
  await admin
    .from("customer_downloads")
    .update({
      download_count: download.download_count + 1,
      first_downloaded_at: download.first_downloaded_at ?? now,
      last_downloaded_at: now,
    })
    .eq("id", id);

  return NextResponse.redirect(signed.signedUrl);
}
