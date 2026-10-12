import { createClient } from "@supabase/supabase-js";

export function klienAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Konfigurasi Supabase di server belum lengkap.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Memastikan pemanggil adalah admin yang sudah masuk. Mengembalikan null bila tidak. */
export async function wajibAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const sb = klienAdmin();
  const { data } = await sb.auth.getUser(token);
  if (!data.user) return null;
  const { data: p } = await sb.from("profiles").select("role").eq("id", data.user.id).single();
  return p?.role === "admin" ? { sb, userId: data.user.id } : null;
}
