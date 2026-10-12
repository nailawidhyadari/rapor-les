"use client";

import { useState } from "react";
import { useApp } from "@/components/Provider";
import { Avatar, Empty, Field, Icon, Konfirmasi, Modal, PageHead, useToast } from "@/components/ui";
import type { Tutor } from "@/lib/types";

interface Form extends Tutor {
  username: string;
  password: string;
}

export default function HalamanPengajar() {
  const { db, token, muatUlang } = useApp();
  const { toast, node } = useToast();
  const [edit, setEdit] = useState<Form | null>(null);
  const [hapus, setHapus] = useState<Tutor | null>(null);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);

  function buka(t?: Tutor) {
    setGalat("");
    if (!t) return setEdit({ id: "", nama: "", telepon: "", mapel: "", aktif: true, username: "", password: "" });
    const u = db.users.find((x) => x.tutorId === t.id);
    setEdit({ ...t, username: u?.username ?? "", password: "" });
  }

  async function panggil(metode: "POST" | "DELETE", body: unknown) {
    const r = await fetch("/api/tutor", {
      method: metode,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.galat ?? "Permintaan gagal.");
  }

  async function simpan() {
    if (!edit) return;
    const punyaAkun = db.users.some((u) => u.tutorId === edit.id);
    if (!edit.nama.trim() || !edit.username.trim()) return setGalat("Nama dan nama pengguna wajib diisi.");
    if (!punyaAkun && edit.password.length < 8) return setGalat("Kata sandi akun baru minimal 8 karakter.");
    setSibuk(true);
    try {
      const { username, password, ...tutor } = edit;
      await panggil("POST", { tutor, username, password });
      await muatUlang();
      setEdit(null);
      toast("Data pengajar tersimpan.");
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal menyimpan.");
    }
    setSibuk(false);
  }

  async function hapusTutor(t: Tutor) {
    try {
      await panggil("DELETE", { id: t.id });
      await muatUlang();
      toast("Pengajar dihapus.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menghapus.");
    }
    setHapus(null);
  }

  const dipakai = (t: Tutor) => db.kelas.filter((k) => k.tutorId === t.id).length;

  return (
    <>
      <PageHead judul="Data Pengajar" deskripsi="Pengajar sekaligus memiliki akun tutor untuk mengisi absensi dan nilai pada kelasnya.">
        <button className="btn primary" onClick={() => buka()}><Icon name="plus" />Tambah pengajar</button>
      </PageHead>

      <div className="panel">
        {db.tutors.length === 0 ? (
          <Empty judul="Belum ada pengajar" teks="Tambahkan pengajar agar dapat ditugaskan ke kelas." />
        ) : (
          <div className="table-wrap">
            <table className="tbl stack">
              <thead><tr><th>Nama</th><th>Mata pelajaran</th><th>Telepon</th><th>Akun</th><th className="num">Kelas</th><th /></tr></thead>
              <tbody>
                {db.tutors.map((t) => (
                  <tr key={t.id}>
                    <td className="nm nm-cell"><div className="who"><Avatar nama={t.nama} /><div>{t.nama}{!t.aktif && <span className="sub">Nonaktif</span>}</div></div></td>
                    <td data-label="Mata pelajaran">{t.mapel || "-"}</td>
                    <td data-label="Telepon">{t.telepon || "-"}</td>
                    <td data-label="Akun">{db.users.find((u) => u.tutorId === t.id)?.username ?? <span className="muted">belum ada</span>}</td>
                    <td data-label="Kelas" className="num">{dipakai(t)}</td>
                    <td className="aksi">
                      <button className="btn sm" onClick={() => buka(t)}>Ubah</button>{" "}
                      <button className="btn sm danger" onClick={() => setHapus(t)} disabled={dipakai(t) > 0} title={dipakai(t) ? "Masih mengajar kelas" : ""}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {edit && (
        <Modal
          judul={edit.id ? "Ubah pengajar" : "Tambah pengajar"}
          onClose={() => setEdit(null)}
          footer={<><button className="btn" onClick={() => setEdit(null)}>Batal</button><button className="btn primary" onClick={simpan} disabled={sibuk}>{sibuk ? "Menyimpan..." : "Simpan"}</button></>}
        >
          <div className="form-grid">
            <Field label="Nama lengkap" full><input className="input" value={edit.nama} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} /></Field>
            <Field label="Mata pelajaran"><input className="input" value={edit.mapel} onChange={(e) => setEdit({ ...edit, mapel: e.target.value })} /></Field>
            <Field label="Nomor telepon"><input className="input" inputMode="tel" value={edit.telepon} onChange={(e) => setEdit({ ...edit, telepon: e.target.value })} /></Field>
            <Field label="Nama pengguna"><input className="input" autoCapitalize="none" value={edit.username} onChange={(e) => setEdit({ ...edit, username: e.target.value })} /></Field>
            <Field label="Kata sandi" hint={db.users.some((u) => u.tutorId === edit.id) ? "Kosongkan bila tidak diubah" : "Minimal 8 karakter"}>
              <input className="input" type="password" autoComplete="new-password" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} />
            </Field>
            <label className="check full"><input type="checkbox" checked={edit.aktif} onChange={(e) => setEdit({ ...edit, aktif: e.target.checked })} />Pengajar aktif</label>
            {galat && <p className="err full" role="alert">{galat}</p>}
          </div>
        </Modal>
      )}
      {hapus && (
        <Konfirmasi
          judul="Hapus pengajar"
          teks={`Pengajar ${hapus.nama} dan akun loginnya akan dihapus. Nilai yang pernah diinput tetap tersimpan. Lanjutkan?`}
          onYa={() => hapusTutor(hapus)}
          onTidak={() => setHapus(null)}
        />
      )}
      {node}
    </>
  );
}
