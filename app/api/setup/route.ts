import { NextResponse } from "next/server";
import { keEmail } from "@/lib/supabase";
import { klienAdmin } from "@/lib/server";

export const dynamic = "force-dynamic";

async function adaAdmin() {
  const sb = klienAdmin();
  const { count, error } = await sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function GET() {
  try {
    return NextResponse.json({ perlu: !(await adaAdmin()) });
  } catch {
    return NextResponse.json({ perlu: false, galat: "Basis data belum siap. Pastikan skema SQL sudah dijalankan." });
  }
}

export async function POST(req: Request) {
  try {
    if (await adaAdmin()) return NextResponse.json({ galat: "Akun admin sudah ada." }, { status: 403 });
    const { nama, username, password, lembaga } = await req.json();
    const un = String(username ?? "").trim().toLowerCase();
    if (!String(nama ?? "").trim() || !un || String(password ?? "").length < 8) {
      return NextResponse.json({ galat: "Nama, nama pengguna, dan kata sandi (minimal 8 karakter) wajib diisi." }, { status: 400 });
    }
    const sb = klienAdmin();
    const { data, error } = await sb.auth.admin.createUser({ email: keEmail(un), password, email_confirm: true });
    if (error || !data.user) return NextResponse.json({ galat: error?.message ?? "Gagal membuat akun." }, { status: 400 });
    const { error: e2 } = await sb.from("profiles").insert({ id: data.user.id, nama: String(nama).trim(), username: un, role: "admin" });
    if (e2) {
      await sb.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ galat: e2.message }, { status: 400 });
    }
    if (String(lembaga ?? "").trim()) {
      await sb.from("lembaga").upsert({ id: 1, nama: String(lembaga).trim(), tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ galat: e instanceof Error ? e.message : "Terjadi kesalahan." }, { status: 500 });
  }
}
