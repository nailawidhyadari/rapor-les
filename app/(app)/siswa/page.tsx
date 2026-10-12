"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/Provider";
import { Empty, Field, Icon, Konfirmasi, Modal, PageHead } from "@/components/ui";
import type { Jenjang, Siswa } from "@/lib/types";
import { namaKelas, uid } from "@/lib/util";

const KOSONG: Siswa = {
  id: "", nama: "", sekolah: "", jenjang: "SD", namaOrtu: "", waOrtu: "", kelasIds: [], aktif: true,
};

export default function HalamanSiswa() {
  const { db, siswaSaya, kelasSaya, isAdmin, update } = useApp();
  const [cari, setCari] = useState("");
  const [fKelas, setFKelas] = useState("");
  const [edit, setEdit] = useState<Siswa | null>(null);
  const [hapus, setHapus] = useState<Siswa | null>(null);

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return siswaSaya
      .filter((s) => (!q || s.nama.toLowerCase().includes(q) || s.sekolah.toLowerCase().includes(q)))
      .filter((s) => !fKelas || s.kelasIds.includes(fKelas))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [siswaSaya, cari, fKelas]);

  function simpan() {
    if (!edit || !edit.nama.trim()) return;
    update((d) => {
      const ada = d.siswa.some((s) => s.id === edit.id);
      const lama = d.siswa.find((s) => s.id === edit.id);
      // tutor hanya mengubah kelas miliknya; keanggotaan kelas lain dipertahankan
      const idSaya = new Set(kelasSaya.map((k) => k.id));
      const kelasIds = isAdmin
        ? edit.kelasIds
        : [...(lama?.kelasIds ?? []).filter((id) => !idSaya.has(id)), ...edit.kelasIds];
      const baru = { ...edit, kelasIds, id: edit.id || uid("s"), nama: edit.nama.trim() };
      return { ...d, siswa: ada ? d.siswa.map((s) => (s.id === baru.id ? baru : s)) : [...d.siswa, baru] };
    });
    setEdit(null);
  }

  function hapusSiswa(s: Siswa) {
    update((d) => ({
      ...d,
      siswa: d.siswa.filter((x) => x.id !== s.id),
      nilai: d.nilai.filter((n) => n.siswaId !== s.id),
      absensi: d.absensi.map((a) => {
        const { [s.id]: _, ...sisa } = a.catatan;
        return { ...a, catatan: sisa };
      }),
    }));
    setHapus(null);
  }

  const pilihKelas = isAdmin ? db.kelas : kelasSaya;

  return (
    <>
      <PageHead judul="Data Siswa" deskripsi="Identitas siswa, kontak orang tua, dan kelas yang diikuti.">
        <button className="btn primary" onClick={() => setEdit({ ...KOSONG })}><Icon name="plus" />Tambah siswa</button>
      </PageHead>

      <div className="panel">
        <div className="panel-body toolbar" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="field grow">
            <label htmlFor="cari">Cari</label>
            <input id="cari" className="input" placeholder="Nama siswa atau sekolah" value={cari} onChange={(e) => setCari(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="fk">Kelas</label>
            <select id="fk" className="input" value={fKelas} onChange={(e) => setFKelas(e.target.value)}>
              <option value="">Semua kelas</option>
              {pilihKelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
        </div>
        {daftar.length === 0 ? (
          <Empty judul="Belum ada siswa" teks="Tambahkan siswa atau ubah kata pencarian." />
        ) : (
          <div className="table-wrap">
            <table className="tbl stack">
              <thead><tr><th>Nama</th><th>Sekolah</th><th>Kelas</th><th>Orang tua</th><th>Status</th><th /></tr></thead>
              <tbody>
                {daftar.map((s) => (
                  <tr key={s.id}>
                    <td className="nm nm-cell">{s.nama}<span className="sub">{s.jenjang}</span></td>
                    <td data-label="Sekolah">{s.sekolah || "-"}</td>
                    <td data-label="Kelas">{s.kelasIds.length ? s.kelasIds.map((id) => namaKelas(db, id)).join(", ") : "-"}</td>
                    <td data-label="Orang tua"><span>{s.namaOrtu || "-"}<span className="sub">{s.waOrtu}</span></span></td>
                    <td data-label="Status"><span className={`badge ${s.aktif ? "ok" : ""}`}>{s.aktif ? "Aktif" : "Nonaktif"}</span></td>
                    <td className="aksi">
                      <button className="btn sm" onClick={() => setEdit({ ...s })}>Ubah</button>{" "}
                      {isAdmin && <button className="btn sm danger" onClick={() => setHapus(s)}>Hapus</button>}
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
          judul={edit.id ? "Ubah data siswa" : "Tambah siswa"}
          onClose={() => setEdit(null)}
          footer={<><button className="btn" onClick={() => setEdit(null)}>Batal</button><button className="btn primary" onClick={simpan} disabled={!edit.nama.trim()}>Simpan</button></>}
        >
          <div className="form-grid">
            <Field label="Nama lengkap" full><input className="input" value={edit.nama} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} /></Field>
            <Field label="Sekolah"><input className="input" value={edit.sekolah} onChange={(e) => setEdit({ ...edit, sekolah: e.target.value })} /></Field>
            <Field label="Jenjang">
              <select className="input" value={edit.jenjang} onChange={(e) => setEdit({ ...edit, jenjang: e.target.value as Jenjang })}>
                {["SD", "SMP", "SMA", "Umum"].map((j) => <option key={j}>{j}</option>)}
              </select>
            </Field>
            <Field label="Nama orang tua/wali"><input className="input" value={edit.namaOrtu} onChange={(e) => setEdit({ ...edit, namaOrtu: e.target.value })} /></Field>
            <Field label="Nomor WhatsApp orang tua" hint="Contoh: 081234567890"><input className="input" inputMode="tel" value={edit.waOrtu} onChange={(e) => setEdit({ ...edit, waOrtu: e.target.value })} /></Field>
            <Field label="Kelas yang diikuti" full>
              {pilihKelas.length === 0 ? <span className="muted small">Belum ada kelas.</span> : (
                <div className="check-list">
                  {pilihKelas.map((k) => (
                    <label className="check" key={k.id}>
                      <input
                        type="checkbox"
                        checked={edit.kelasIds.includes(k.id)}
                        onChange={(e) => setEdit({ ...edit, kelasIds: e.target.checked ? [...edit.kelasIds, k.id] : edit.kelasIds.filter((x) => x !== k.id) })}
                      />
                      {k.nama}
                    </label>
                  ))}
                </div>
              )}
            </Field>
            <label className="check full"><input type="checkbox" checked={edit.aktif} onChange={(e) => setEdit({ ...edit, aktif: e.target.checked })} />Siswa aktif</label>
          </div>
        </Modal>
      )}
      {hapus && (
        <Konfirmasi
          judul="Hapus siswa"
          teks={`Data ${hapus.nama} beserta nilai dan catatan kehadirannya akan dihapus permanen. Lanjutkan?`}
          onYa={() => hapusSiswa(hapus)}
          onTidak={() => setHapus(null)}
        />
      )}
    </>
  );
}
