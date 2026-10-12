import type { Database, Nilai } from "./types";
import {
  avg, formatBulan, formatTanggal, fmtSkor, normalisasiWa, predikat, ringkasHadir, slug,
  type RingkasanHadir,
} from "./util";

export interface BarisKelas {
  kelasId: string;
  nama: string;
  tutor: string;
  hadir: RingkasanHadir;
  rata: number | null;
}

export interface Laporan {
  siswaId: string;
  nama: string;
  sekolah: string;
  jenjang: string;
  namaOrtu: string;
  waOrtu: string;
  bulan: string;
  perKelas: BarisKelas[];
  nilai: (Nilai & { namaKelas: string })[];
  hadir: RingkasanHadir;
  rata: number | null;
  predikat: string;
  catatanTutor: string[];
  catatanBulanan: string;
}

export function buatLaporan(db: Database, siswaId: string, ym: string): Laporan | null {
  const s = db.siswa.find((x) => x.id === siswaId);
  if (!s) return null;
  const idKelas = new Set(s.kelasIds);
  const absensiBulan = (a: { kelasId: string; tanggal: string }) => idKelas.has(a.kelasId) && a.tanggal.startsWith(ym);

  const nilai = db.nilai
    .filter((n) => n.siswaId === s.id && n.tanggal.startsWith(ym) && idKelas.has(n.kelasId))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .map((n) => ({ ...n, namaKelas: db.kelas.find((k) => k.id === n.kelasId)?.nama ?? "-" }));

  const perKelas: BarisKelas[] = s.kelasIds
    .map((id) => db.kelas.find((k) => k.id === id))
    .filter((k): k is NonNullable<typeof k> => !!k)
    .map((k) => ({
      kelasId: k.id,
      nama: k.nama,
      tutor: db.tutors.find((t) => t.id === k.tutorId)?.nama ?? "-",
      hadir: ringkasHadir(db.absensi, s.id, (a) => a.kelasId === k.id && a.tanggal.startsWith(ym)),
      rata: avg(nilai.filter((n) => n.kelasId === k.id).map((n) => n.skor)),
    }));

  const hadir = ringkasHadir(db.absensi, s.id, absensiBulan);
  const rata = avg(nilai.map((n) => n.skor));

  return {
    siswaId: s.id, nama: s.nama, sekolah: s.sekolah, jenjang: s.jenjang,
    namaOrtu: s.namaOrtu, waOrtu: s.waOrtu, bulan: ym,
    perKelas, nilai, hadir, rata, predikat: predikat(rata),
    catatanTutor: nilai.filter((n) => n.catatan).map((n) => `${formatTanggal(n.tanggal)} (${n.namaKelas}): ${n.catatan}`),
    catatanBulanan: db.catatanBulanan[`${s.id}|${ym}`] ?? "",
  };
}

export function pesanWhatsApp(db: Database, l: Laporan) {
  const h = l.hadir;
  const baris = [
    `Yth. Bapak/Ibu ${l.namaOrtu || "Orang Tua/Wali"},`,
    "",
    `Berikut ringkasan perkembangan belajar *${l.nama}* periode ${formatBulan(l.bulan)} di ${db.lembaga.nama}:`,
    "",
    `- Kehadiran: ${h.H} dari ${h.total} pertemuan${h.persen === null ? "" : ` (${h.persen.toFixed(0)}%)`}`,
    `- Rata-rata nilai: ${fmtSkor(l.rata)}${l.rata === null ? "" : ` (${l.predikat})`}`,
  ];
  if (l.catatanBulanan) baris.push("", "Catatan tutor:", l.catatanBulanan);
  baris.push("", "Laporan lengkap dalam bentuk PDF kami lampirkan pada pesan ini.", "", "Terima kasih atas perhatian dan kerja samanya.", db.lembaga.nama);
  return baris.join("\n");
}

export function tautanWhatsApp(db: Database, l: Laporan) {
  const nomor = normalisasiWa(l.waOrtu, db.lembaga.kodeNegara || "62");
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesanWhatsApp(db, l))}`;
}

export function namaBerkasPdf(l: Laporan) {
  return `laporan-${slug(l.nama)}-${l.bulan}.pdf`;
}

export async function buatPdf(db: Database, l: Laporan): Promise<Blob> {
  const [{ jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableMod.default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 16;
  const hijau: [number, number, number] = [31, 77, 67];
  const abu: [number, number, number] = [93, 106, 101];
  let y = 18;

  const akhir = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const cekHalaman = (butuh: number) => {
    if (y + butuh > 280) { doc.addPage(); y = 18; }
  };
  const judulBagian = (t: string) => {
    cekHalaman(16);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...hijau);
    doc.text(t, M, y);
    y += 3;
  };

  // kop
  doc.setFont("times", "bold").setFontSize(17).setTextColor(...hijau);
  doc.text(db.lembaga.nama, M, y);
  y += 5.5;
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...abu);
  const kontak = [db.lembaga.alamat, db.lembaga.telepon && `Telp. ${db.lembaga.telepon}`].filter(Boolean).join("  |  ");
  if (kontak) { doc.text(kontak, M, y); y += 4.5; }
  doc.setDrawColor(...hijau).setLineWidth(0.7).line(M, y, W - M, y);
  y += 9;

  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(27, 36, 33);
  doc.text("LAPORAN PERKEMBANGAN BELAJAR SISWA", W / 2, y, { align: "center" });
  y += 5.5;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...abu);
  doc.text(`Periode ${formatBulan(l.bulan)}  |  Tahun ajaran ${db.lembaga.tahunAjaran}`, W / 2, y, { align: "center" });
  y += 9;

  // identitas
  const ident: [string, string][] = [
    ["Nama siswa", l.nama],
    ["Sekolah", l.sekolah || "-"],
    ["Jenjang", l.jenjang],
    ["Orang tua/wali", l.namaOrtu || "-"],
  ];
  doc.setFontSize(10);
  for (const [k, v] of ident) {
    doc.setFont("helvetica", "normal").setTextColor(...abu).text(k, M, y);
    doc.setFont("helvetica", "bold").setTextColor(27, 36, 33).text(`: ${v}`, M + 34, y);
    y += 5.5;
  }
  y += 4;

  // ringkasan
  judulBagian("Ringkasan");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 2.5, lineColor: [222, 218, 207], textColor: [27, 36, 33] },
    headStyles: { fillColor: [241, 239, 232], textColor: [27, 36, 33], fontStyle: "bold" },
    head: [["Kehadiran", "Persentase", "Rata-rata nilai", "Predikat"]],
    body: [[
      `${l.hadir.H} dari ${l.hadir.total} pertemuan`,
      l.hadir.persen === null ? "-" : `${l.hadir.persen.toFixed(0)}%`,
      fmtSkor(l.rata),
      l.predikat,
    ]],
  });
  y = akhir() + 9;

  // kehadiran per kelas
  judulBagian("Kehadiran per kelas");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2.2, lineColor: [222, 218, 207], textColor: [27, 36, 33] },
    headStyles: { fillColor: [241, 239, 232], textColor: [27, 36, 33], fontStyle: "bold" },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "center" }, 5: { halign: "center" }, 6: { halign: "right" } },
    head: [["Kelas", "Pertemuan", "Hadir", "Izin", "Sakit", "Alpa", "Rata-rata nilai"]],
    body: l.perKelas.length
      ? l.perKelas.map((k) => [k.nama, k.hadir.total, k.hadir.H, k.hadir.I, k.hadir.S, k.hadir.A, fmtSkor(k.rata)])
      : [["Siswa belum terdaftar pada kelas", "", "", "", "", "", ""]],
  });
  y = akhir() + 9;

  // rincian nilai
  judulBagian("Rincian nilai");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2.2, lineColor: [222, 218, 207], textColor: [27, 36, 33] },
    headStyles: { fillColor: [241, 239, 232], textColor: [27, 36, 33], fontStyle: "bold" },
    columnStyles: { 4: { halign: "right", cellWidth: 18 } },
    head: [["Tanggal", "Kelas", "Jenis", "Materi", "Nilai"]],
    body: l.nilai.length
      ? l.nilai.map((n) => [formatTanggal(n.tanggal), n.namaKelas, n.jenis, n.topik || "-", String(n.skor)])
      : [["Belum ada nilai pada periode ini", "", "", "", ""]],
  });
  y = akhir() + 9;

  // catatan
  judulBagian("Catatan perkembangan dari tutor");
  y += 2;
  const teksCatatan = [l.catatanBulanan, ...l.catatanTutor.map((c) => `- ${c}`)].filter(Boolean).join("\n") || "Belum ada catatan pada periode ini.";
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(27, 36, 33);
  const lines = doc.splitTextToSize(teksCatatan, W - M * 2 - 6) as string[];
  const tinggi = lines.length * 4.8 + 6;
  cekHalaman(tinggi + 40);
  doc.setDrawColor(222, 218, 207).setLineWidth(0.3).rect(M, y, W - M * 2, tinggi);
  doc.text(lines, M + 3, y + 6);
  y += tinggi + 14;

  // tanda tangan
  cekHalaman(36);
  const tutorIni = Array.from(new Set(l.perKelas.map((k) => k.tutor))).join(", ");
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...abu);
  doc.text("Mengetahui,", M, y);
  doc.text("Tutor", W - M - 60, y);
  doc.setTextColor(27, 36, 33);
  doc.text("Admin Lembaga", M, y + 24);
  doc.text(doc.splitTextToSize(tutorIni || "-", 60) as string[], W - M - 60, y + 24);

  // nomor halaman
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...abu);
    doc.text(`${db.lembaga.nama} - Laporan ${l.nama} - ${formatBulan(l.bulan)}`, M, 291);
    doc.text(`Halaman ${i} dari ${n}`, W - M, 291, { align: "right" });
  }

  return doc.output("blob");
}
