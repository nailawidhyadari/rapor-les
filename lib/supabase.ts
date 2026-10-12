import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let klien: SupabaseClient | null | undefined;

export function adaKonfigurasi() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (klien !== undefined) return klien;
  klien = adaKonfigurasi()
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;
  return klien;
}

export const DOMAIN_AKUN = "rapor.les";

/** Nama pengguna tanpa "@" dipetakan ke email internal. */
export function keEmail(masukan: string) {
  const m = masukan.trim().toLowerCase();
  return m.includes("@") ? m : `${m}@${DOMAIN_AKUN}`;
}

const snake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export function keBaris<T extends object>(o: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [snake(k), v]));
}

export function dariBaris<T>(o: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [camel(k), v])) as T;
}

/** Ambil seluruh baris tabel (PostgREST membatasi 1000 baris per permintaan). */
export async function ambilSemua(sb: SupabaseClient, tabel: string) {
  const hasil: Record<string, unknown>[] = [];
  for (let dari = 0; ; dari += 1000) {
    const { data, error } = await sb.from(tabel).select("*").range(dari, dari + 999);
    if (error) throw error;
    hasil.push(...(data as Record<string, unknown>[]));
    if (!data || data.length < 1000) break;
  }
  return hasil;
}
