"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "@/components/Provider";
import { AngkaHitung, Avatar, Donat, Empty, GrafikBatang, Icon, PageHead } from "@/components/ui";
import { HARI, avg, formatBulan, formatTanggal, fmtSkor, monthISO, ringkasHadir, todayISO } from "@/lib/util";

function sapaan() {
  const j = new Date().getHours();
  return j < 11 ? "Selamat pagi" : j < 15 ? "Selamat siang" : j < 19 ? "Selamat sore" : "Selamat malam";
}

export default function Dashboard() {
  const { db, user, kelasSaya, siswaSaya } = useApp();
  const bulan = monthISO();
  const hariIni = HARI[(new Date().getDay() + 6) % 7];

  const d = useMemo(() => {
    const idKelas = new Set(kelasSaya.map((k) => k.id));
    const absAll = db.absensi.filter((a) => idKelas.has(a.kelasId));
    const absBulan = absAll.filter((a) => a.tanggal.startsWith(bulan));
    const nilaiBulan = db.nilai.filter((n) => idKelas.has(n.kelasId) && n.tanggal.startsWith(bulan));
    const aktif = siswaSaya.filter((s) => s.aktif);

    const status = { H: 0, I: 0, S: 0, A: 0 };
    for (const a of absBulan) for (const v of Object.values(a.catatan)) status[v]++;
    const total = status.H + status.I + status.S + status.A;

    // tren kehadiran per tanggal (8 tanggal terakhir)
    const perTgl = new Map<string, { h: number; t: number }>();
    for (const a of absAll) {
      const e = perTgl.get(a.tanggal) ?? { h: 0, t: 0 };
      for (const v of Object.values(a.catatan)) { e.t++; if (v === "H") e.h++; }
      perTgl.set(a.tanggal, e);
    }
    const tren = [...perTgl.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8).map(([tgl, e]) => ({
      label: tgl.slice(8) + "/" + tgl.slice(5, 7),
      nilai: e.t ? (e.h / e.t) * 100 : 0,
      detail: `${e.h}/${e.t} hadir, ${formatTanggal(tgl)}`,
    }));

    const perKelas = kelasSaya.map((k) => ({
      k,
      rata: avg(db.nilai.filter((n) => n.kelasId === k.id && n.tanggal.startsWith(bulan)).map((n) => n.skor)),
    })).filter((x) => x.rata !== null);

    const perhatian = aktif
      .map((s) => {
        const hd = ringkasHadir(db.absensi, s.id, (a) => a.tanggal.startsWith(bulan) && idKelas.has(a.kelasId));
        const rn = avg(nilaiBulan.filter((n) => n.siswaId === s.id).map((n) => n.skor));
        return { s, hd, rn };
      })
      .filter((x) => (x.hd.persen !== null && x.hd.persen < 75) || (x.rn !== null && x.rn < 70));

    return {
      aktif: aktif.length, pertemuan: absBulan.length,
      hadir: total ? (status.H / total) * 100 : null,
      rata: avg(nilaiBulan.map((n) => n.skor)),
      status, total, tren, perKelas, perhatian,
    };
  }, [db, kelasSaya, siswaSaya, bulan]);

  const jadwalHariIni = kelasSaya.filter((k) => k.aktif && k.hari === hariIni);
  const nama = user?.nama.split(",")[0] ?? "";

  return (
    <>
      <PageHead
        judul={`${sapaan()}, ${nama}`}
        deskripsi={`${hariIni}, ${formatTanggal(todayISO())}. Ringkasan ${formatBulan(bulan)} sesuai hak akses akun Anda.`}
      />

      <div className="stats">
        <div className="stat">
          <div className="ic"><Icon name="users" /></div>
          <div className="k">Siswa aktif</div>
          <div className="v"><AngkaHitung nilai={d.aktif} /></div>
          <div className="s">di {kelasSaya.length} kelas</div>
        </div>
        <div className="stat t-amber">
          <div className="ic"><Icon name="calendar" /></div>
          <div className="k">Pertemuan bulan ini</div>
          <div className="v"><AngkaHitung nilai={d.pertemuan} /></div>
          <div className="s">tercatat di absensi</div>
        </div>
        <div className="stat t-teal">
          <div className="ic"><Icon name="check" /></div>
          <div className="k">Rata-rata kehadiran</div>
          <div className="v"><AngkaHitung nilai={d.hadir} akhiran="%" /></div>
          <div className="s">{formatBulan(bulan)}</div>
        </div>
        <div className="stat t-rose">
          <div className="ic"><Icon name="award" /></div>
          <div className="k">Rata-rata nilai</div>
          <div className="v"><AngkaHitung nilai={d.rata} desimal={1} /></div>
          <div className="s">{formatBulan(bulan)}</div>
        </div>
      </div>

      <div className="aksi-cepat">
        <Link href="/absensi"><span className="ic"><Icon name="check" /></span><span>Isi absensi<small>Catat kehadiran</small></span></Link>
        <Link href="/nilai"><span className="ic"><Icon name="edit" /></span><span>Input nilai<small>Nilai dan catatan</small></span></Link>
        <Link href="/laporan"><span className="ic"><Icon name="file" /></span><span>Buat laporan<small>PDF dan WhatsApp</small></span></Link>
        <Link href="/rekap"><span className="ic"><Icon name="table" /></span><span>Rekap bulanan<small>Siswa dan kelas</small></span></Link>
      </div>

      <div className="cols">
        <section className="panel">
          <div className="panel-head"><h2>Tren kehadiran</h2><span className="small muted">Arahkan kursor ke batang untuk detail</span></div>
          {d.tren.length === 0 ? <Empty judul="Belum ada data absensi" teks="Grafik muncul setelah absensi tersimpan." /> : <GrafikBatang data={d.tren} />}
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Status kehadiran</h2><span className="badge pri">{formatBulan(bulan)}</span></div>
          <Donat
            tengah={d.hadir === null ? "-" : `${d.hadir.toFixed(0)}%`}
            label="hadir"
            bagian={[
              { nama: "Hadir", nilai: d.status.H, warna: "#0f9d8a" },
              { nama: "Izin", nilai: d.status.I, warna: "#0ea5e9" },
              { nama: "Sakit", nilai: d.status.S, warna: "#f59e0b" },
              { nama: "Alpa", nilai: d.status.A, warna: "#e5484d" },
            ]}
          />
        </section>
      </div>

      <div className="cols sama" style={{ marginTop: 20 }}>
        <section className="panel">
          <div className="panel-head"><h2>Kelas hari ini</h2><span className="badge live">{hariIni}</span></div>
          {jadwalHariIni.length === 0 ? (
            <Empty judul="Tidak ada kelas hari ini" teks="Jadwal mengikuti hari pada data kelas." />
          ) : (
            <ul className="list-plain">
              {jadwalHariIni.map((k) => (
                <li key={k.id}>
                  <div>
                    <strong>{k.nama}</strong>
                    <div className="small muted">{db.tutors.find((t) => t.id === k.tutorId)?.nama}</div>
                  </div>
                  <span className="badge pri"><Icon name="clock" />{k.jam}</span>
                </li>
              ))}
            </ul>
          )}
          {d.perKelas.length > 0 && (
            <>
              <div className="panel-head" style={{ borderTop: "1px solid var(--line-soft)" }}><h3>Rata-rata nilai per kelas</h3></div>
              <div className="hbar">
                {d.perKelas.map(({ k, rata }) => (
                  <div className="r" key={k.id}>
                    <div><span>{k.nama}</span><b>{fmtSkor(rata)}</b></div>
                    <div className={`bar ${(rata ?? 0) < 70 ? "low" : (rata ?? 0) < 80 ? "mid" : ""}`}><span style={{ width: `${rata}%` }} /></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Perlu perhatian</h2>{d.perhatian.length > 0 && <span className="badge bad">{d.perhatian.length} siswa</span>}</div>
          {d.perhatian.length === 0 ? (
            <Empty judul="Semua dalam kondisi baik" teks="Muncul bila kehadiran bulan ini di bawah 75% atau rata-rata nilai di bawah 70." />
          ) : (
            <ul className="list-plain">
              {d.perhatian.map(({ s, hd, rn }) => (
                <li key={s.id}>
                  <div className="who">
                    <Avatar nama={s.nama} />
                    <div>
                      <strong>{s.nama}</strong>
                      <div className="small muted">Hadir {hd.persen === null ? "-" : `${hd.persen.toFixed(0)}%`}, nilai {fmtSkor(rn)}</div>
                    </div>
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
