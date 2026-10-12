"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "@/components/Provider";
import { Empty, PageHead, Persen } from "@/components/ui";
import {
  HARI, avg, formatBulan, formatTanggal, fmtSkor, monthISO, ringkasHadir,
} from "@/lib/util";

export default function Dashboard() {
  const { db, user, kelasSaya, siswaSaya } = useApp();
  const bulan = monthISO();
  const hariIni = HARI[(new Date().getDay() + 6) % 7];

  const d = useMemo(() => {
    const idKelas = new Set(kelasSaya.map((k) => k.id));
    const absBulan = db.absensi.filter((a) => idKelas.has(a.kelasId) && a.tanggal.startsWith(bulan));
    const nilaiBulan = db.nilai.filter((n) => idKelas.has(n.kelasId) && n.tanggal.startsWith(bulan));
    const aktif = siswaSaya.filter((s) => s.aktif);
    let h = 0, t = 0;
    for (const a of absBulan) for (const v of Object.values(a.catatan)) { t++; if (v === "H") h++; }

    const perhatian = aktif
      .map((s) => {
        const hd = ringkasHadir(db.absensi, s.id, (a) => a.tanggal.startsWith(bulan) && idKelas.has(a.kelasId));
        const rn = avg(nilaiBulan.filter((n) => n.siswaId === s.id).map((n) => n.skor));
        return { s, hd, rn };
      })
      .filter((x) => (x.hd.persen !== null && x.hd.persen < 75) || (x.rn !== null && x.rn < 70));

    const terbaru = [...db.absensi]
      .filter((a) => idKelas.has(a.kelasId))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .slice(0, 5);

    return {
      aktif: aktif.length,
      pertemuan: absBulan.length,
      hadir: t ? (h / t) * 100 : null,
      rata: avg(nilaiBulan.map((n) => n.skor)),
      perhatian,
      terbaru,
    };
  }, [db, kelasSaya, siswaSaya, bulan]);

  const jadwalHariIni = kelasSaya.filter((k) => k.aktif && k.hari === hariIni);

  return (
    <>
      <PageHead
        judul={`Selamat datang, ${user?.nama.split(",")[0]}`}
        deskripsi={`Ringkasan ${formatBulan(bulan)}. Data yang tampil sesuai hak akses akun Anda.`}
      />

      <div className="stats">
        <div className="stat"><div className="k">Siswa aktif</div><div className="v">{d.aktif}</div><div className="s">{kelasSaya.length} kelas</div></div>
        <div className="stat"><div className="k">Pertemuan bulan ini</div><div className="v">{d.pertemuan}</div><div className="s">tercatat di absensi</div></div>
        <div className="stat"><div className="k">Rata-rata kehadiran</div><div className="v">{d.hadir === null ? "-" : `${d.hadir.toFixed(0)}%`}</div><div className="s">{formatBulan(bulan)}</div></div>
        <div className="stat"><div className="k">Rata-rata nilai</div><div className="v">{fmtSkor(d.rata)}</div><div className="s">{formatBulan(bulan)}</div></div>
      </div>

      <div className="cols">
        <div className="stack-y">
          <section className="panel">
            <div className="panel-head"><h2>Kelas hari ini ({hariIni})</h2><Link href="/absensi" className="btn sm">Isi absensi</Link></div>
            {jadwalHariIni.length === 0 ? (
              <Empty judul="Tidak ada kelas terjadwal hari ini" teks="Jadwal mengikuti hari pada data kelas." />
            ) : (
              <ul className="list-plain">
                {jadwalHariIni.map((k) => (
                  <li key={k.id}>
                    <div><strong>{k.nama}</strong><div className="small muted">{db.tutors.find((t) => t.id === k.tutorId)?.nama}</div></div>
                    <span className="badge pri">{k.jam}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Absensi terbaru</h2></div>
            {d.terbaru.length === 0 ? (
              <Empty judul="Belum ada absensi" teks="Absensi yang disimpan akan tampil di sini." />
            ) : (
              <div className="table-wrap">
                <table className="tbl stack">
                  <thead><tr><th>Tanggal</th><th>Kelas</th><th>Topik</th><th className="num">Hadir</th></tr></thead>
                  <tbody>
                    {d.terbaru.map((a) => {
                      const v = Object.values(a.catatan);
                      return (
                        <tr key={a.id}>
                          <td data-label="Tanggal">{formatTanggal(a.tanggal)}</td>
                          <td data-label="Kelas" className="nm">{db.kelas.find((k) => k.id === a.kelasId)?.nama}</td>
                          <td data-label="Topik">{a.topik || "-"}</td>
                          <td data-label="Hadir" className="num">{v.filter((x) => x === "H").length}/{v.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section className="panel">
          <div className="panel-head"><h2>Perlu perhatian</h2></div>
          {d.perhatian.length === 0 ? (
            <Empty judul="Tidak ada catatan" teks="Muncul bila kehadiran bulan ini di bawah 75% atau rata-rata nilai di bawah 70." />
          ) : (
            <ul className="list-plain">
              {d.perhatian.map(({ s, hd, rn }) => (
                <li key={s.id}>
                  <div>
                    <strong>{s.nama}</strong>
                    <div className="small muted">Hadir {hd.persen === null ? "-" : `${hd.persen.toFixed(0)}%`}, nilai {fmtSkor(rn)}</div>
                  </div>
                  <Link href={`/laporan?siswa=${s.id}`} className="btn sm">Laporan</Link>
                </li>
              ))}
            </ul>
          )}
          <div className="panel-body small muted" style={{ borderTop: "1px solid var(--line-soft)" }}>
            Batas: kehadiran di bawah 75% atau rata-rata nilai di bawah 70 pada bulan berjalan.
          </div>
        </section>
      </div>
    </>
  );
}
