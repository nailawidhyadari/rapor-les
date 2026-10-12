"use client";

import { useRef, useState } from "react";
import { useApp } from "@/components/Provider";
import { Field, Icon, Konfirmasi, PageHead, useToast } from "@/components/ui";
import { eksporSemua } from "@/lib/exporter";
import { getSupabase } from "@/lib/supabase";
import { DB_VERSI, dataContoh, dataKosong } from "@/lib/seed";
import type { Database, Lembaga } from "@/lib/types";
import { todayISO, unduhBlob } from "@/lib/util";

export default function Pengaturan() {
  const { db, update, ganti } = useApp();
  const { toast, node } = useToast();
  const [profil, setProfil] = useState<Lembaga>(db.lembaga);
  const [sandi, setSandi] = useState("");
  const [reset, setReset] = useState<"kosong" | "contoh" | null>(null);
  const [pulih, setPulih] = useState<Database | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function simpanProfil() {
    update((d) => ({ ...d, lembaga: { ...profil, nama: profil.nama.trim() || d.lembaga.nama } }));
    toast("Profil lembaga disimpan.");
  }

  async function gantiSandi() {
    if (sandi.length < 8) return toast("Kata sandi minimal 8 karakter.");
    const { error } = (await getSupabase()?.auth.updateUser({ password: sandi })) ?? { error: { message: "x" } };
    if (error) return toast("Kata sandi gagal diperbarui.");
    setSandi("");
    toast("Kata sandi diperbarui.");
  }

  function cadangkan() {
    unduhBlob(new Blob([JSON.stringify({ ...db, users: [] }, null, 2)], { type: "application/json" }), `cadangan-rapor-${todayISO()}.json`);
    toast("Cadangan data diunduh.");
  }

  async function bacaBerkas(f: File) {
    try {
      const p = JSON.parse(await f.text()) as Database;
      const sah = p && p.versi === DB_VERSI && Array.isArray(p.siswa) && Array.isArray(p.kelas);
      if (!sah) return toast("Berkas bukan cadangan yang valid.");
      setPulih(p);
    } catch {
      toast("Berkas tidak dapat dibaca.");
    }
  }

  return (
    <>
      <PageHead judul="Pengaturan dan Data" deskripsi="Profil lembaga, ekspor Excel, serta pencadangan dan pemulihan data." />

      <div className="cols">
        <div className="stack-y">
          <section className="panel">
            <div className="panel-head"><h2>Profil lembaga</h2></div>
            <div className="panel-body">
              <div className="form-grid">
                <Field label="Nama lembaga" full hint="Tampil pada menu, laporan PDF, dan pesan WhatsApp."><input className="input" value={profil.nama} onChange={(e) => setProfil({ ...profil, nama: e.target.value })} /></Field>
                <Field label="Alamat" full><input className="input" value={profil.alamat} onChange={(e) => setProfil({ ...profil, alamat: e.target.value })} /></Field>
                <Field label="Telepon"><input className="input" inputMode="tel" value={profil.telepon} onChange={(e) => setProfil({ ...profil, telepon: e.target.value })} /></Field>
                <Field label="Tahun ajaran"><input className="input" value={profil.tahunAjaran} onChange={(e) => setProfil({ ...profil, tahunAjaran: e.target.value })} /></Field>
                <Field label="Kode negara WhatsApp" hint="Indonesia: 62"><input className="input" inputMode="numeric" value={profil.kodeNegara} onChange={(e) => setProfil({ ...profil, kodeNegara: e.target.value.replace(/\D/g, "") })} /></Field>
              </div>
              <button className="btn primary" style={{ marginTop: 16 }} onClick={simpanProfil}>Simpan profil</button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Kata sandi akun ini</h2></div>
            <div className="panel-body toolbar">
              <div className="field grow">
                <label htmlFor="sd">Kata sandi baru (minimal 8 karakter)</label>
                <input id="sd" type="password" className="input" autoComplete="new-password" value={sandi} onChange={(e) => setSandi(e.target.value)} />
              </div>
              <button className="btn" onClick={gantiSandi}>Perbarui</button>
            </div>
          </section>
        </div>

        <div className="stack-y">
          <section className="panel">
            <div className="panel-head"><h2>Ekspor dan cadangan</h2></div>
            <div className="panel-body stack-y">
              <div>
                <button className="btn primary" style={{ width: "100%" }} onClick={() => eksporSemua(db).catch(() => toast("Berkas Excel gagal dibuat."))}><Icon name="download" />Ekspor semua data ke Excel</button>
                <p className="small muted" style={{ marginTop: 6 }}>Lembar: Siswa, Kelas, Pengajar, Absensi, dan Nilai.</p>
              </div>
              <div>
                <button className="btn" style={{ width: "100%" }} onClick={cadangkan}><Icon name="download" />Unduh cadangan (JSON)</button>
                <p className="small muted" style={{ marginTop: 6 }}>Berisi data siswa, kelas, absensi, dan nilai (tanpa akun login). Simpan di tempat yang aman.</p>
              </div>
              <div>
                <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) bacaBerkas(f); e.target.value = ""; }} />
                <button className="btn" style={{ width: "100%" }} onClick={() => fileRef.current?.click()}>Pulihkan dari cadangan</button>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Atur ulang data</h2></div>
            <div className="panel-body stack-y">
              <button className="btn danger" style={{ width: "100%" }} onClick={() => setReset("kosong")}>Kosongkan semua data</button>
              <button className="btn" style={{ width: "100%" }} onClick={() => setReset("contoh")}>Muat ulang data contoh</button>
              <p className="small muted">Tindakan ini menggantikan seluruh data. Unduh cadangan terlebih dahulu bila diperlukan.</p>
            </div>
          </section>
        </div>
      </div>

      {reset && (
        <Konfirmasi
          judul={reset === "kosong" ? "Kosongkan semua data" : "Muat ulang data contoh"}
          teks={reset === "kosong" ? "Seluruh pengajar, siswa, kelas, absensi, dan nilai akan dihapus dari database. Akun login tetap ada." : "Seluruh data saat ini akan diganti dengan data contoh."}
          label={reset === "kosong" ? "Kosongkan" : "Muat ulang"}
          onTidak={() => setReset(null)}
          onYa={() => { ganti(reset === "kosong" ? dataKosong() : dataContoh()); setProfil((reset === "kosong" ? dataKosong() : dataContoh()).lembaga); setReset(null); toast("Data telah diatur ulang."); }}
        />
      )}
      {pulih && (
        <Konfirmasi
          judul="Pulihkan cadangan"
          teks={`Cadangan berisi ${pulih.siswa.length} siswa, ${pulih.kelas.length} kelas, dan ${pulih.nilai.length} nilai. Data saat ini akan diganti. Lanjutkan?`}
          label="Pulihkan"
          onTidak={() => setPulih(null)}
          onYa={() => { ganti(pulih); setProfil(pulih.lembaga); setPulih(null); toast("Data berhasil dipulihkan."); }}
        />
      )}
      {node}
    </>
  );
}
