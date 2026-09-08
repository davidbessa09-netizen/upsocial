export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return url.length > 0 && !url.includes("YOUR_PROJECT_REF") && key.length > 0 && !key.includes("your_anon_key");
}
