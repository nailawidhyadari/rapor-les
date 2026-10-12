"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/Provider";
import { Empty, Konfirmasi, PageHead, useToast } from "@/components/ui";
import type { JenisNilai, Nilai } from "@/lib/types";
import { formatTanggal, todayISO, uid } from "@/lib/util";

const JENIS: JenisNilai[] = ["Tugas", "Kuis", "Ulangan Harian", "UTS", "UAS"];
type Baris = { skor: string; catatan: string };

export default function HalamanNilai() {
  const { db, user, kelasSaya, update } = useApp();
  const { toast, node } = useToast();
  const kelasAktif = kelasSaya.filter((k) => k.aktif);
  const [kelasId, setKelasId] = useState(kelasAktif[0]?.id ?? "");
  const [tanggal, setTanggal] = useState(todayISO());
  const [jenis, setJenis] = useState<JenisNilai>("Kuis");
  const [topik, setTopik] = useState("");
  const [baris, setBaris] = useState<Record<string, Baris>>({});
  const [hapus, setHapus] = useState<Nilai | null>(null);

  const kelas = db.kelas.find((k) => k.id === kelasId);
  const anggota = useMemo(
    () => db.siswa.filter((s) => s.aktif && s.kelasIds.includes(kelasId)).sort((a, b) => a.nama.localeCompare(b.nama)),
    [db.siswa, kelasId],
  );
  const cocok = useMemo(
    () => db.nilai.filter((n) => n.kelasId === kelasId && n.tanggal === tanggal && n.jenis === jenis),
    [db.nilai, kelasId, tanggal, jenis],
  );
  const riwayat = useMemo(
    () => db.nilai.filter((n) => n.kelasId === kelasId).sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 40),
    [db.nilai, kelasId],
  );

  useEffect(() => {
    const awal: Record<string, Baris> = {};
    for (const s of anggota) {
      const n = cocok.find((x) => x.siswaId === s.id);
      awal[s.id] = { skor: n ? String(n.skor) : "", catatan: n?.catatan ?? "" };
    }
    setBaris(awal);
    setTopik(cocok[0]?.topik ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId, tanggal, jenis, anggota.length, cocok.map((c) => c.id).join()]);

  const salah = (v: string) => v !== "" && (Number.isNaN(Number(v)) || Number(v) < 0 || Number(v) > 100);
  const adaSalah = Object.values(baris).some((b) => salah(b.skor));

  function simpan() {
    if (adaSalah || !kelas) return;
    update((d) => {
      let nilai = d.nilai.filter(
        (n) => !(n.kelasId === kelasId && n.tanggal === tanggal && n.jenis === jenis && anggota.some((s) => s.id === n.siswaId)),
      );
      for (const s of anggota) {
        const b = baris[s.id];
        if (!b || b.skor === "") continue;
        const lama = cocok.find((x) => x.siswaId === s.id);
        nilai = [...nilai, {
          id: lama?.id ?? uid("n"), siswaId: s.id, kelasId, tanggal, jenis,
          topik: topik.trim(), skor: Number(b.skor), catatan: b.catatan.trim(),
          tutorId: user?.tutorId ?? kelas.tutorId,
        }];
      }
      return { ...d, nilai };
    });
    toast("Nilai dan catatan tersimpan.");
  }

  if (!kelasAktif.length) {
    return (
      <>
        <PageHead judul="Nilai dan Catatan" />
        <div className="panel"><Empty judul="Belum ada kelas aktif" /></div>
      </>
    );
  }

  return (
    <>
      <PageHead judul="Nilai dan Catatan Tutor" deskripsi="Input nilai per penilaian beserta catatan singkat untuk tiap siswa. Kolom nilai yang dikosongkan tidak disimpan." />

      <section className="panel">
        <div className="panel-body toolbar" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="field grow">
            <label htmlFor="kls">Kelas</label>
            <select id="kls" className="input" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
              {kelasAktif.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="tg">Tanggal</label>
            <input id="tg" type="date" className="input" value={tanggal} onChange={(e) => e.target.value && setTanggal(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="js">Jenis penilaian</label>
            <select id="js" className="input" value={jenis} onChange={(e) => setJenis(e.target.value as JenisNilai)}>
              {JENIS.map((j) => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div className="field grow">
            <label htmlFor="tp">Materi / topik</label>
            <input id="tp" className="input" value={topik} onChange={(e) => setTopik(e.target.value)} />
          </div>
        </div>

        {anggota.length === 0 ? (
          <Empty judul="Kelas ini belum memiliki siswa aktif" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="tbl stack">
                <thead><tr><th>Siswa</th><th style={{ width: 120 }}>Nilai (0-100)</th><th>Catatan tutor</th></tr></thead>
                <tbody>
                  {anggota.map((s) => {
                    const b = baris[s.id] ?? { skor: "", catatan: "" };
                    return (
                      <tr key={s.id}>
                        <td className="nm nm-cell">{s.nama}</td>
                        <td data-label="Nilai">
                          <input
                            className="input" inputMode="decimal" aria-label={`Nilai ${s.nama}`}
                            style={{ width: 96, borderColor: salah(b.skor) ? "var(--danger)" : undefined }}
                            value={b.skor}
                            onChange={(e) => setBaris({ ...baris, [s.id]: { ...b, skor: e.target.value.replace(",", ".") } })}
                          />
                        </td>
                        <td data-label="Catatan">
                          <input
                            className="input" aria-label={`Catatan ${s.nama}`} placeholder="Opsional"
                            value={b.catatan}
                            onChange={(e) => setBaris({ ...baris, [s.id]: { ...b, catatan: e.target.value } })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="panel-body" style={{ borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span className={adaSalah ? "err" : "small muted"}>{adaSalah ? "Nilai harus berupa angka 0 sampai 100." : cocok.length ? "Data tanggal dan jenis ini sudah ada, simpan untuk memperbarui." : "Belum ada data untuk tanggal dan jenis ini."}</span>
              <button className="btn primary" onClick={simpan} disabled={adaSalah}>Simpan nilai</button>
            </div>
          </>
        )}
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head"><h2>Riwayat nilai kelas</h2><span className="small muted">40 data terakhir</span></div>
        {riwayat.length === 0 ? (
          <Empty judul="Belum ada nilai tersimpan" />
        ) : (
          <div className="table-wrap">
            <table className="tbl stack">
              <thead><tr><th>Tanggal</th><th>Siswa</th><th>Jenis</th><th>Topik</th><th className="num">Nilai</th><th /></tr></thead>
              <tbody>
                {riwayat.map((n) => (
                  <tr key={n.id}>
                    <td data-label="Tanggal">{formatTanggal(n.tanggal)}</td>
                    <td data-label="Siswa" className="nm">{db.siswa.find((s) => s.id === n.siswaId)?.nama ?? "-"}</td>
                    <td data-label="Jenis">{n.jenis}</td>
                    <td data-label="Topik"><span>{n.topik || "-"}{n.catatan && <span className="sub">{n.catatan}</span>}</span></td>
                    <td data-label="Nilai" className="num">{n.skor}</td>
                    <td className="aksi"><button className="btn sm danger" onClick={() => setHapus(n)}>Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {hapus && (
        <Konfirmasi
          judul="Hapus nilai"
          teks="Data nilai ini akan dihapus permanen. Lanjutkan?"
          onYa={() => { update((d) => ({ ...d, nilai: d.nilai.filter((n) => n.id !== hapus.id) })); setHapus(null); }}
          onTidak={() => setHapus(null)}
        />
      )}
      {node}
    </>
  );
}
