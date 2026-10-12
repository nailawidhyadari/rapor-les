"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/components/Provider";
import { Empty, Icon, PageHead, Persen, useToast } from "@/components/ui";
import { barisRekapKelas, barisRekapSiswa, eksporRekap } from "@/lib/exporter";
import { formatBulan, fmtSkor, monthISO, namaKelas } from "@/lib/util";

export default function HalamanRekap() {
  const { db, siswaSaya, kelasSaya } = useApp();
  const { toast, node } = useToast();
  const [bulan, setBulan] = useState(monthISO());
  const [tab, setTab] = useState<"siswa" | "kelas">("siswa");
  const [fKelas, setFKelas] = useState("");

  const siswa = useMemo(
    () => siswaSaya.filter((s) => s.aktif && (!fKelas || s.kelasIds.includes(fKelas))).sort((a, b) => a.nama.localeCompare(b.nama)),
    [siswaSaya, fKelas],
  );
  const rs = useMemo(() => barisRekapSiswa(db, siswa, bulan), [db, siswa, bulan]);
  const rk = useMemo(() => barisRekapKelas(db, kelasSaya, bulan), [db, kelasSaya, bulan]);

  async function unduh() {
    try {
      await eksporRekap(db, siswa, kelasSaya, bulan);
    } catch {
      toast("Berkas Excel gagal dibuat.");
    }
  }

  return (
    <>
      <PageHead judul="Rekap Bulanan" deskripsi={`Ringkasan kehadiran dan nilai untuk ${formatBulan(bulan)}.`}>
        <button className="btn" onClick={unduh}><Icon name="download" />Unduh Excel</button>
      </PageHead>

      <div className="panel">
        <div className="panel-body toolbar" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="field">
            <label htmlFor="bl">Bulan</label>
            <input id="bl" type="month" className="input" value={bulan} onChange={(e) => e.target.value && setBulan(e.target.value)} />
          </div>
          <div className="field">
            <label>Tampilan</label>
            <div className="seg" role="group">
              <button aria-pressed={tab === "siswa"} className="H" style={{ background: tab === "siswa" ? "var(--primary)" : undefined }} onClick={() => setTab("siswa")}>Per siswa</button>
              <button aria-pressed={tab === "kelas"} className="H" style={{ background: tab === "kelas" ? "var(--primary)" : undefined }} onClick={() => setTab("kelas")}>Per kelas</button>
            </div>
          </div>
          {tab === "siswa" && (
            <div className="field grow">
              <label htmlFor="fk">Kelas</label>
              <select id="fk" className="input" value={fKelas} onChange={(e) => setFKelas(e.target.value)}>
                <option value="">Semua kelas</option>
                {kelasSaya.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
          )}
        </div>

        {tab === "siswa" ? (
          rs.length === 0 ? <Empty judul="Tidak ada siswa" /> : (
            <div className="table-wrap">
              <table className="tbl stack">
                <thead><tr><th>Siswa</th><th className="num">Pert.</th><th className="num">H</th><th className="num">I</th><th className="num">S</th><th className="num">A</th><th style={{ minWidth: 150 }}>Kehadiran</th><th className="num">Nilai</th><th>Predikat</th><th /></tr></thead>
                <tbody>
                  {rs.map(({ s, h, rata, predikat }) => (
                    <tr key={s.id}>
                      <td className="nm nm-cell">{s.nama}<span className="sub">{s.kelasIds.map((i) => namaKelas(db, i)).join(", ")}</span></td>
                      <td data-label="Pertemuan" className="num">{h.total}</td>
                      <td data-label="Hadir" className="num">{h.H}</td>
                      <td data-label="Izin" className="num">{h.I}</td>
                      <td data-label="Sakit" className="num">{h.S}</td>
                      <td data-label="Alpa" className="num">{h.A}</td>
                      <td data-label="Kehadiran"><Persen nilai={h.persen} /></td>
                      <td data-label="Rata-rata nilai" className="num">{fmtSkor(rata)}</td>
                      <td data-label="Predikat">{predikat}</td>
                      <td className="aksi"><Link className="btn sm" href={`/laporan?siswa=${s.id}`}>Laporan</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : rk.length === 0 ? <Empty judul="Tidak ada kelas" /> : (
          <div className="table-wrap">
            <table className="tbl stack">
              <thead><tr><th>Kelas</th><th className="num">Siswa aktif</th><th className="num">Pertemuan</th><th style={{ minWidth: 150 }}>Kehadiran</th><th className="num">Rata-rata nilai</th></tr></thead>
              <tbody>
                {rk.map((r) => (
                  <tr key={r.k.id}>
                    <td className="nm nm-cell">{r.k.nama}<span className="sub">{db.tutors.find((t) => t.id === r.k.tutorId)?.nama}</span></td>
                    <td data-label="Siswa aktif" className="num">{r.jumlah}</td>
                    <td data-label="Pertemuan" className="num">{r.pertemuan}</td>
                    <td data-label="Kehadiran"><Persen nilai={r.persen} /></td>
                    <td data-label="Rata-rata nilai" className="num">{fmtSkor(r.rata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {node}
    </>
  );
}
