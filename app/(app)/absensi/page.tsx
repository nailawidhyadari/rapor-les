"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/Provider";
import { Avatar, Empty, Konfirmasi, PageHead, useToast } from "@/components/ui";
import type { StatusHadir } from "@/lib/types";
import { STATUS_LABEL, formatTanggal, todayISO, uid } from "@/lib/util";

const OPSI: StatusHadir[] = ["H", "I", "S", "A"];

export default function HalamanAbsensi() {
  const { db, kelasSaya, update } = useApp();
  const { toast, node } = useToast();
  const kelasAktif = kelasSaya.filter((k) => k.aktif);
  const [kelasId, setKelasId] = useState(kelasAktif[0]?.id ?? "");
  const [tanggal, setTanggal] = useState(todayISO());
  const [topik, setTopik] = useState("");
  const [rec, setRec] = useState<Record<string, StatusHadir>>({});
  const [hapus, setHapus] = useState<string | null>(null);

  const anggota = useMemo(
    () => db.siswa.filter((s) => s.aktif && s.kelasIds.includes(kelasId)).sort((a, b) => a.nama.localeCompare(b.nama)),
    [db.siswa, kelasId],
  );
  const riwayat = useMemo(
    () => db.absensi.filter((a) => a.kelasId === kelasId).sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [db.absensi, kelasId],
  );
  const ada = riwayat.find((a) => a.tanggal === tanggal);
  const pertemuan = ada?.pertemuan ?? (riwayat.reduce((m, a) => Math.max(m, a.pertemuan), 0) + 1);

  useEffect(() => {
    setTopik(ada?.topik ?? "");
    const awal: Record<string, StatusHadir> = {};
    for (const s of anggota) awal[s.id] = ada?.catatan[s.id] ?? "H";
    setRec(awal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId, tanggal, ada?.id, anggota.length]);

  function simpan() {
    if (!kelasId || !anggota.length) return;
    update((d) => {
      const baru = {
        id: ada?.id ?? uid("a"), kelasId, tanggal, pertemuan, topik: topik.trim(), catatan: rec,
      };
      return { ...d, absensi: ada ? d.absensi.map((a) => (a.id === ada.id ? baru : a)) : [...d.absensi, baru] };
    });
    toast(ada ? "Absensi diperbarui." : `Absensi pertemuan ke-${pertemuan} tersimpan.`);
  }

  const hitung = (st: StatusHadir) => Object.values(rec).filter((v) => v === st).length;

  if (!kelasAktif.length) {
    return (
      <>
        <PageHead judul="Absensi" />
        <div className="panel"><Empty judul="Belum ada kelas aktif" teks="Absensi dicatat per kelas. Tambahkan kelas terlebih dahulu." /></div>
      </>
    );
  }

  return (
    <>
      <PageHead judul="Absensi" deskripsi="Catat kehadiran siswa pada setiap pertemuan. Memilih tanggal yang sudah ada akan membuka dan memperbarui data tersebut." />

      <div className="cols">
        <section className="panel">
          <div className="panel-body toolbar" style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="field grow">
              <label htmlFor="kls">Kelas</label>
              <select id="kls" className="input" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
                {kelasAktif.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tgl">Tanggal</label>
              <input id="tgl" type="date" className="input" value={tanggal} onChange={(e) => e.target.value && setTanggal(e.target.value)} />
            </div>
            <div className="field" style={{ minWidth: 110 }}>
              <label>Pertemuan</label>
              <div className="input" style={{ display: "flex", alignItems: "center" }}>ke-{pertemuan}</div>
            </div>
            <div className="field full" style={{ flex: "1 1 100%" }}>
              <label htmlFor="tpk">Topik yang dibahas</label>
              <input id="tpk" className="input" value={topik} onChange={(e) => setTopik(e.target.value)} placeholder="Contoh: Persamaan linear satu variabel" />
            </div>
          </div>

          {anggota.length === 0 ? (
            <Empty judul="Kelas ini belum memiliki siswa aktif" teks="Tambahkan siswa dan pilih kelas ini pada menu Siswa." />
          ) : (
            <>
              <div className="panel-head" style={{ borderBottom: "1px solid var(--line-soft)" }}>
                <div className="small muted">
                  Hadir {hitung("H")}, Izin {hitung("I")}, Sakit {hitung("S")}, Alpa {hitung("A")}
                </div>
                <button className="btn sm" onClick={() => setRec(Object.fromEntries(anggota.map((s) => [s.id, "H" as StatusHadir])))}>Semua hadir</button>
              </div>
              <ul className="list-plain">
                {anggota.map((s) => (
                  <li key={s.id} style={{ flexWrap: "wrap" }}>
                    <div className="who"><Avatar nama={s.nama} /><strong>{s.nama}</strong></div>
                    <div className="seg" role="group" aria-label={`Kehadiran ${s.nama}`}>
                      {OPSI.map((o) => (
                        <button key={o} className={o} aria-pressed={rec[s.id] === o} title={STATUS_LABEL[o]} onClick={() => setRec({ ...rec, [s.id]: o })}>{o}</button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="panel-body" style={{ borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span className="small muted">H hadir, I izin, S sakit, A alpa</span>
                <button className="btn primary" onClick={simpan}>{ada ? "Perbarui absensi" : "Simpan absensi"}</button>
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Riwayat kelas</h2></div>
          {riwayat.length === 0 ? (
            <Empty judul="Belum ada riwayat" teks="Absensi yang disimpan akan tercatat di sini." />
          ) : (
            <ul className="list-plain" style={{ maxHeight: 440, overflow: "auto" }}>
              {riwayat.map((a) => {
                const v = Object.values(a.catatan);
                return (
                  <li key={a.id} style={{ background: a.tanggal === tanggal ? "var(--primary-soft)" : undefined }}>
                    <button className="btn ghost" style={{ textAlign: "left", flex: 1, justifyContent: "flex-start", padding: 0, minHeight: 0 }} onClick={() => setTanggal(a.tanggal)}>
                      <span>
                        <strong>Pertemuan {a.pertemuan}</strong>
                        <span className="small muted" style={{ display: "block", fontWeight: 400 }}>
                          {formatTanggal(a.tanggal)} - hadir {v.filter((x) => x === "H").length}/{v.length}
                        </span>
                      </span>
                    </button>
                    <button className="btn sm danger" onClick={() => setHapus(a.id)}>Hapus</button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {hapus && (
        <Konfirmasi
          judul="Hapus absensi"
          teks="Catatan kehadiran pertemuan ini akan dihapus permanen. Lanjutkan?"
          onYa={() => { update((d) => ({ ...d, absensi: d.absensi.filter((a) => a.id !== hapus) })); setHapus(null); }}
          onTidak={() => setHapus(null)}
        />
      )}
      {node}
    </>
  );
}
