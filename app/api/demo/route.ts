import { NextResponse } from "next/server";
import { AKUN_DEMO } from "@/lib/demo";
import { dataContoh } from "@/lib/seed";
import { keBaris, keEmail } from "@/lib/supabase";
import { klienAdmin } from "@/lib/server";

export const dynamic = "force-dynamic";

/** Menyiapkan akun demo (dan data contoh bila database masih kosong). Idempoten. */
export async function POST() {
  if (process.env.NEXT_PUBLIC_MODE_DEMO !== "1") return NextResponse.json({ galat: "Mode demo tidak aktif." }, { status: 404 });
  try {
    const sb = klienAdmin();

    const { count } = await sb.from("tutors").select("id", { count: "exact", head: true });
    if (!count) {
      const d = dataContoh();
      const tulis = async (tabel: string, baris: object[]) => {
        for (let i = 0; i < baris.length; i += 200) {
          const { error } = await sb.from(tabel).upsert(baris.slice(i, i + 200).map((r) => keBaris(r)));
          if (error) throw error;
        }
      };
      await tulis("tutors", d.tutors);
      await tulis("kelas", d.kelas);
      await tulis("siswa", d.siswa);
      await tulis("absensi", d.absensi);
      await tulis("nilai", d.nilai);
    }
    const { data: t } = await sb.from("tutors").select("id").order("id").limit(1);
    const tutorId = t?.[0]?.id ?? null;

    for (const a of AKUN_DEMO) {
      const { data: ada } = await sb.from("profiles").select("id").eq("username", a.username).maybeSingle();
      if (ada) continue;
      const { data, error } = await sb.auth.admin.createUser({ email: keEmail(a.username), password: a.password, email_confirm: true });
      if (error || !data.user) throw error ?? new Error("Gagal membuat akun demo.");
      const { error: e2 } = await sb.from("profiles").insert({
        id: data.user.id, nama: a.nama, username: a.username, role: a.role, tutor_id: a.role === "tutor" ? tutorId : null,
      });
      if (e2) {
        await sb.auth.admin.deleteUser(data.user.id);
        throw e2;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ galat: e instanceof Error ? e.message : "Gagal menyiapkan demo." }, { status: 500 });
  }
}
