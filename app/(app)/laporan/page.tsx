"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/Provider";
import { Empty, Icon, PageHead, useToast } from "@/components/ui";
import { buatLaporan, buatPdf, namaBerkasPdf, tautanWhatsApp } from "@/lib/laporan";
import { formatBulan, formatTanggal, fmtSkor, monthISO, unduhBlob } from "@/lib/util";

export default function HalamanLaporan() {
  const { db, siswaSaya, update } = useApp();
  const { toast, node } = useToast();
  const daftar = useMemo(() => [...siswaSaya].filter((s) => s.aktif).sort((a, b) => a.nama.localeCompare(b.nama)), [siswaSaya]);
  const [siswaId, setSiswaId] = useState("");
  const [bulan, setBulan] = useState(monthISO());
  const [catatan, setCatatan] = useState("");
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("siswa");
    setSiswaId(q && daftar.some((s) => s.id === q) ? q : daftar[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daftar.length]);

  const kunci = `${siswaId}|${bulan}`;
  useEffect(() => setCatatan(db.catatanBulanan[kunci] ?? ""), [kunci, db.catatanBulanan]);

  const lap = useMemo(() => (siswaId && bulan ? buatLaporan(db, siswaId, bulan) : null), [db, siswaId, bulan]);
  const sudahDisimpan = (db.catatanBulanan[kunci] ?? "") === catatan;

  function simpanCatatan() {
    update((d) => {
      const c = { ...d.catatanBulanan };
      if (catatan.trim()) c[kunci] = catatan.trim(); else delete c[kunci];
      return { ...d, catatanBulanan: c };
    });
    toast("Catatan perkembangan tersimpan.");
  }

  // laporan dengan catatan yang sedang diketik (belum tentu tersimpan)
  const lapAktif = lap && { ...lap, catatanBulanan: catatan.trim() };

  async function unduh() {
    if (!lapAktif) return;
    setSibuk(true);
    try {
      unduhBlob(await buatPdf(db, lapAktif), namaBerkasPdf(lapAktif));
    } catch {
      toast("PDF gagal dibuat. Coba lagi.");
    }
    setSibuk(false);
  }

  async function kirimWa() {
    if (!lapAktif) return;
    if (!lapAktif.waOrtu.trim()) return toast("Nomor WhatsApp orang tua belum diisi pada data siswa.");
    // buka tab lebih dulu agar tidak diblokir peramban
    window.open(tautanWhatsApp(db, lapAktif), "_blank", "noopener");
    await unduh();
    toast("PDF terunduh. Lampirkan berkas tersebut pada percakapan WhatsApp.");
  }

  async function bagikanPdf() {
    if (!lapAktif) return;
    setSibuk(true);
    try {
      const blob = await buatPdf(db, lapAktif);
      const file = new File([blob], namaBerkasPdf(lapAktif), { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Laporan ${lapAktif.nama}` });
      } else {
        unduhBlob(blob, file.name);
      }
    } catch {
      /* dibatalkan pengguna */
    }
    setSibuk(false);
  }

  if (!daftar.length) {
    return (
      <>
        <PageHead judul="Laporan Siswa" />
        <div className="panel"><Empty judul="Belum ada siswa" teks="Tambahkan siswa terlebih dahulu pada menu Siswa." /></div>
      </>
    );
  }

  return (
    <>
      <PageHead judul="Laporan Perkembangan Siswa" deskripsi="Laporan tersusun otomatis dari absensi dan nilai pada bulan yang dipilih." />

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-body toolbar">
          <div className="field grow">
            <label htmlFor="sw">Siswa</label>
            <select id="sw" className="input" value={siswaId} onChange={(e) => setSiswaId(e.target.value)}>
              {daftar.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="bl">Bulan</label>
            <input id="bl" type="month" className="input" value={bulan} onChange={(e) => e.target.value && setBulan(e.target.value)} />
          </div>
        </div>
      </div>

      {lapAktif && (
        <div className="cols">
          <article className="rapor" aria-label="Pratinjau laporan">
            <div className="kop">
              <h2>{db.lembaga.nama}</h2>
              <small>{[db.lembaga.alamat, db.lembaga.telepon].filter(Boolean).join(" | ")}</small>
            </div>
            <p style={{ fontWeight: 600, marginBottom: 2 }}>Laporan Perkembangan Belajar Siswa</p>
            <p style={{ color: "#5d6a65", fontSize: 13.5, marginBottom: 14 }}>Periode {formatBulan(lapAktif.bulan)}</p>
            <dl>
              <dt>Nama siswa</dt><dd>{lapAktif.nama}</dd>
              <dt>Sekolah</dt><dd>{lapAktif.sekolah || "-"}</dd>
              <dt>Orang tua/wali</dt><dd>{lapAktif.namaOrtu || "-"}</dd>
            </dl>

            <h3>Ringkasan</h3>
            <table>
              <tbody>
                <tr><th>Kehadiran</th><td>{lapAktif.hadir.H} dari {lapAktif.hadir.total} pertemuan{lapAktif.hadir.persen !== null && ` (${lapAktif.hadir.persen.toFixed(0)}%)`}</td></tr>
                <tr><th>Rata-rata nilai</th><td>{fmtSkor(lapAktif.rata)}</td></tr>
                <tr><th>Predikat</th><td>{lapAktif.predikat}</td></tr>
              </tbody>
            </table>

            <h3>Kehadiran per kelas</h3>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Kelas</th><th className="n">Pert.</th><th className="n">H</th><th className="n">I</th><th className="n">S</th><th className="n">A</th><th className="n">Nilai</th></tr></thead>
                <tbody>
                  {lapAktif.perKelas.map((k) => (
                    <tr key={k.kelasId}><td>{k.nama}</td><td className="n">{k.hadir.total}</td><td className="n">{k.hadir.H}</td><td className="n">{k.hadir.I}</td><td className="n">{k.hadir.S}</td><td className="n">{k.hadir.A}</td><td className="n">{fmtSkor(k.rata)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Rincian nilai</h3>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Tanggal</th><th>Kelas</th><th>Jenis</th><th>Materi</th><th className="n">Nilai</th></tr></thead>
                <tbody>
                  {lapAktif.nilai.length === 0 && <tr><td colSpan={5}>Belum ada nilai pada periode ini.</td></tr>}
                  {lapAktif.nilai.map((n) => (
                    <tr key={n.id}><td>{formatTanggal(n.tanggal)}</td><td>{n.namaKelas}</td><td>{n.jenis}</td><td>{n.topik || "-"}</td><td className="n">{n.skor}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Catatan perkembangan dari tutor</h3>
            <div className="box">
              {[lapAktif.catatanBulanan, ...lapAktif.catatanTutor.map((c) => `- ${c}`)].filter(Boolean).join("\n") || "Belum ada catatan pada periode ini."}
            </div>
          </article>

          <div className="stack-y">
            <section className="panel">
              <div className="panel-head"><h2>Catatan bulanan</h2></div>
              <div className="panel-body">
                <div className="field">
                  <label htmlFor="ct">Catatan perkembangan untuk orang tua</label>
                  <textarea id="ct" className="input" rows={5} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tuliskan perkembangan, kekuatan, dan hal yang perlu ditingkatkan." />
                </div>
                <button className="btn" style={{ marginTop: 12 }} onClick={simpanCatatan} disabled={sudahDisimpan}>{sudahDisimpan ? "Tersimpan" : "Simpan catatan"}</button>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head"><h2>Bagikan laporan</h2></div>
              <div className="panel-body stack-y">
                <button className="btn primary" style={{ width: "100%" }} onClick={unduh} disabled={sibuk}><Icon name="download" />Unduh PDF</button>
                <button className="btn wa" style={{ width: "100%" }} onClick={kirimWa} disabled={sibuk}><Icon name="send" />Kirim ke WhatsApp orang tua</button>
                <button className="btn" style={{ width: "100%" }} onClick={bagikanPdf} disabled={sibuk}>Bagikan berkas PDF (ponsel)</button>
                <p className="small muted">
                  Tombol WhatsApp membuka percakapan ke {lapAktif.waOrtu || "nomor orang tua"} dengan pesan ringkasan, lalu mengunduh PDF untuk dilampirkan.
                  WhatsApp tidak mengizinkan lampiran otomatis dari situs web.
                </p>
              </div>
            </section>
          </div>
        </div>
      )}
      {node}
    </>
  );
}
