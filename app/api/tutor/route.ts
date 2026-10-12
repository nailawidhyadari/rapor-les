import { NextResponse } from "next/server";
import { keEmail } from "@/lib/supabase";
import { wajibAdmin } from "@/lib/server";

export const dynamic = "force-dynamic";

const tolak = (galat: string, status = 400) => NextResponse.json({ galat }, { status });

export async function POST(req: Request) {
  try {
    const ctx = await wajibAdmin(req);
    if (!ctx) return tolak("Hanya admin yang diizinkan.", 403);
    const { sb } = ctx;
    const { tutor, username, password } = await req.json();
    const nama = String(tutor?.nama ?? "").trim();
    const un = String(username ?? "").trim().toLowerCase();
    const sandi = String(password ?? "");
    if (!nama || !un) return tolak("Nama dan nama pengguna wajib diisi.");
    if (sandi && sandi.length < 8) return tolak("Kata sandi minimal 8 karakter.");

    const id: string = tutor.id || `t_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const { data: ada } = await sb.from("profiles").select("id, username").eq("tutor_id", id).maybeSingle();
    const { data: bentrok } = await sb.from("profiles").select("id").eq("username", un).neq("tutor_id", id).maybeSingle();
    if (bentrok) return tolak("Nama pengguna sudah dipakai akun lain.", 409);
    if (!ada && !sandi) return tolak("Kata sandi wajib diisi untuk akun baru.");

    const { error: eT } = await sb.from("tutors").upsert({
      id, nama, telepon: tutor.telepon ?? "", mapel: tutor.mapel ?? "", aktif: !!tutor.aktif,
    });
    if (eT) return tolak(eT.message);

    if (ada) {
      const ubah: { email?: string; password?: string } = {};
      if (ada.username !== un) ubah.email = keEmail(un);
      if (sandi) ubah.password = sandi;
      if (Object.keys(ubah).length) {
        const { error } = await sb.auth.admin.updateUserById(ada.id, { ...ubah, email_confirm: true });
        if (error) return tolak(error.message);
      }
      await sb.from("profiles").update({ nama, username: un }).eq("id", ada.id);
    } else {
      const { data, error } = await sb.auth.admin.createUser({ email: keEmail(un), password: sandi, email_confirm: true });
      if (error || !data.user) return tolak(error?.message ?? "Gagal membuat akun.");
      const { error: eP } = await sb.from("profiles").insert({ id: data.user.id, nama, username: un, role: "tutor", tutor_id: id });
      if (eP) {
        await sb.auth.admin.deleteUser(data.user.id);
        return tolak(eP.message);
      }
    }
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return tolak(e instanceof Error ? e.message : "Terjadi kesalahan.", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const ctx = await wajibAdmin(req);
    if (!ctx) return tolak("Hanya admin yang diizinkan.", 403);
    const { sb } = ctx;
    const { id } = await req.json();
    const { count } = await sb.from("kelas").select("id", { count: "exact", head: true }).eq("tutor_id", id);
    if ((count ?? 0) > 0) return tolak("Pengajar masih mengajar kelas. Pindahkan kelasnya terlebih dahulu.", 409);
    const { data: p } = await sb.from("profiles").select("id").eq("tutor_id", id).maybeSingle();
    if (p) await sb.auth.admin.deleteUser(p.id);
    await sb.from("tutors").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return tolak(e instanceof Error ? e.message : "Terjadi kesalahan.", 500);
  }
}
