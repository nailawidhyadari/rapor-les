"use client";

import { useState } from "react";
import { useApp } from "@/components/Provider";
import { Empty, Field, Icon, Konfirmasi, Modal, PageHead } from "@/components/ui";
import type { Jenjang, Kelas } from "@/lib/types";
import { HARI, namaTutor, uid } from "@/lib/util";

export default function HalamanKelas() {
  const { db, kelasSaya, isAdmin, update } = useApp();
  const [edit, setEdit] = useState<Kelas | null>(null);
  const [hapus, setHapus] = useState<Kelas | null>(null);

  const kosong = (): Kelas => ({
    id: "", nama: "", mapel: "", jenjang: "SD", tutorId: db.tutors[0]?.id ?? "", hari: "Senin", jam: "15.00 - 16.30", aktif: true,
  });

  function simpan() {
    if (!edit || !edit.nama.trim()) return;
    update((d) => {
      const ada = d.kelas.some((k) => k.id === edit.id);
      const baru = { ...edit, id: edit.id || uid("k"), nama: edit.nama.trim() };
      return { ...d, kelas: ada ? d.kelas.map((k) => (k.id === baru.id ? baru : k)) : [...d.kelas, baru] };
    });
    setEdit(null);
  }

  function hapusKelas(k: Kelas) {
    update((d) => ({
      ...d,
      kelas: d.kelas.filter((x) => x.id !== k.id),
      absensi: d.absensi.filter((a) => a.kelasId !== k.id),
      nilai: d.nilai.filter((n) => n.kelasId !== k.id),
      siswa: d.siswa.map((s) => ({ ...s, kelasIds: s.kelasIds.filter((id) => id !== k.id) })),
    }));
    setHapus(null);
  }

  return (
    <>
      <PageHead judul="Data Kelas" deskripsi="Daftar kelas, jadwal, dan pengajar yang bertugas.">
        {isAdmin && <button className="btn primary" onClick={() => setEdit(kosong())}><Icon name="plus" />Tambah kelas</button>}
      </PageHead>

      <div className="panel">
        {kelasSaya.length === 0 ? (
          <Empty judul="Belum ada kelas" teks={isAdmin ? "Tambahkan kelas pertama untuk mulai mencatat absensi." : "Belum ada kelas yang ditugaskan kepada Anda."} />
        ) : (
          <div className="table-wrap">
            <table className="tbl stack">
              <thead><tr><th>Kelas</th><th>Mata pelajaran</th><th>Jadwal</th><th>Pengajar</th><th className="num">Siswa</th>{isAdmin && <th />}</tr></thead>
              <tbody>
                {kelasSaya.map((k) => (
                  <tr key={k.id}>
                    <td className="nm nm-cell">{k.nama}<span className="sub">{k.jenjang}{k.aktif ? "" : " - nonaktif"}</span></td>
                    <td data-label="Mata pelajaran">{k.mapel}</td>
                    <td data-label="Jadwal">{k.hari}, {k.jam}</td>
                    <td data-label="Pengajar">{namaTutor(db, k.tutorId)}</td>
                    <td data-label="Siswa" className="num">{db.siswa.filter((s) => s.kelasIds.includes(k.id)).length}</td>
                    {isAdmin && (
                      <td className="aksi">
                        <button className="btn sm" onClick={() => setEdit({ ...k })}>Ubah</button>{" "}
                        <button className="btn sm danger" onClick={() => setHapus(k)}>Hapus</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {edit && (
        <Modal
          judul={edit.id ? "Ubah kelas" : "Tambah kelas"}
          onClose={() => setEdit(null)}
          footer={<><button className="btn" onClick={() => setEdit(null)}>Batal</button><button className="btn primary" onClick={simpan} disabled={!edit.nama.trim() || !edit.tutorId}>Simpan</button></>}
        >
          <div className="form-grid">
            <Field label="Nama kelas" full><input className="input" placeholder="Contoh: Matematika SMP 8A" value={edit.nama} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} /></Field>
            <Field label="Mata pelajaran"><input className="input" value={edit.mapel} onChange={(e) => setEdit({ ...edit, mapel: e.target.value })} /></Field>
            <Field label="Jenjang">
              <select className="input" value={edit.jenjang} onChange={(e) => setEdit({ ...edit, jenjang: e.target.value as Jenjang })}>
                {["SD", "SMP", "SMA", "Umum"].map((j) => <option key={j}>{j}</option>)}
              </select>
            </Field>
            <Field label="Hari">
              <select className="input" value={edit.hari} onChange={(e) => setEdit({ ...edit, hari: e.target.value })}>
                {HARI.map((h) => <option key={h}>{h}</option>)}
              </select>
            </Field>
            <Field label="Jam"><input className="input" value={edit.jam} onChange={(e) => setEdit({ ...edit, jam: e.target.value })} /></Field>
            <Field label="Pengajar" full hint={db.tutors.length ? undefined : "Tambahkan pengajar terlebih dahulu di menu Pengajar."}>
              <select className="input" value={edit.tutorId} onChange={(e) => setEdit({ ...edit, tutorId: e.target.value })}>
                {db.tutors.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
              </select>
            </Field>
            <label className="check full"><input type="checkbox" checked={edit.aktif} onChange={(e) => setEdit({ ...edit, aktif: e.target.checked })} />Kelas aktif</label>
          </div>
        </Modal>
      )}
      {hapus && (
        <Konfirmasi
          judul="Hapus kelas"
          teks={`Kelas ${hapus.nama} beserta seluruh absensi dan nilainya akan dihapus permanen. Lanjutkan?`}
          onYa={() => hapusKelas(hapus)}
          onTidak={() => setHapus(null)}
        />
      )}
    </>
  );
}
