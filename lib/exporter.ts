import type { Database, Kelas, Siswa } from "./types";
import { avg, formatBulan, namaKelas, namaTutor, predikat, ringkasHadir, todayISO, unduhBlob } from "./util";

type Sel = string | number | null;
type Sheet = { sheet: string; data: Sel[][]; lebar: number[] };

function sel(v: Sel) {
  return v === null || v === "" ? null : v;
}

async function tulis(sheets: Sheet[], berkas: string) {
  const { default: writeExcelFile } = await import("write-excel-file/universal");
  const isi = sheets.map((s) => ({
    sheet: s.sheet,
    columns: s.lebar.map((width) => ({ width })),
    data: s.data.map((row, i) =>
      row.map((v) => {
        const c = sel(v);
        if (c === null) return null;
        return i === 0 ? { value: String(c), fontWeight: "bold" as const, backgroundColor: "#e4eeea" } : { value: c };
      }),
    ),
  }));
  const blob = await writeExcelFile(isi as never).toBlob();
  unduhBlob(blob, berkas);
}

export async function eksporSemua(db: Database) {
  const sheets: Sheet[] = [
    {
      sheet: "Siswa",
      lebar: [28, 24, 10, 26, 18, 36, 10],
      data: [
        ["Nama", "Sekolah", "Jenjang", "Orang tua", "WhatsApp orang tua", "Kelas", "Status"],
        ...db.siswa.map((s) => [s.nama, s.sekolah, s.jenjang, s.namaOrtu, s.waOrtu, s.kelasIds.map((i) => namaKelas(db, i)).join(", "), s.aktif ? "Aktif" : "Nonaktif"] as Sel[]),
      ],
    },
    {
      sheet: "Kelas",
      lebar: [28, 20, 10, 28, 12, 18, 10],
      data: [
        ["Nama kelas", "Mata pelajaran", "Jenjang", "Pengajar", "Hari", "Jam", "Status"],
        ...db.kelas.map((k) => [k.nama, k.mapel, k.jenjang, namaTutor(db, k.tutorId), k.hari, k.jam, k.aktif ? "Aktif" : "Nonaktif"] as Sel[]),
      ],
    },
    {
      sheet: "Pengajar",
      lebar: [28, 20, 18, 10],
      data: [
        ["Nama", "Mata pelajaran", "Telepon", "Status"],
        ...db.tutors.map((t) => [t.nama, t.mapel, t.telepon, t.aktif ? "Aktif" : "Nonaktif"] as Sel[]),
      ],
    },
    {
      sheet: "Absensi",
      lebar: [14, 28, 11, 30, 28, 10],
      data: [
        ["Tanggal", "Kelas", "Pertemuan", "Topik", "Siswa", "Status"],
        ...db.absensi.flatMap((a) =>
          Object.entries(a.catatan).map(([sid, st]) => [
            a.tanggal, namaKelas(db, a.kelasId), a.pertemuan, a.topik, db.siswa.find((s) => s.id === sid)?.nama ?? "-",
            { H: "Hadir", I: "Izin", S: "Sakit", A: "Alpa" }[st],
          ] as Sel[]),
        ),
      ],
    },
    {
      sheet: "Nilai",
      lebar: [14, 28, 28, 16, 28, 8, 40],
      data: [
        ["Tanggal", "Siswa", "Kelas", "Jenis", "Topik", "Nilai", "Catatan"],
        ...db.nilai.map((n) => [n.tanggal, db.siswa.find((s) => s.id === n.siswaId)?.nama ?? "-", namaKelas(db, n.kelasId), n.jenis, n.topik, n.skor, n.catatan] as Sel[]),
      ],
    },
  ];
  await tulis(sheets, `data-les-${todayISO()}.xlsx`);
}

export function barisRekapSiswa(db: Database, siswa: Siswa[], ym: string) {
  return siswa.map((s) => {
    const idKelas = new Set(s.kelasIds);
    const h = ringkasHadir(db.absensi, s.id, (a) => idKelas.has(a.kelasId) && a.tanggal.startsWith(ym));
    const rata = avg(db.nilai.filter((n) => n.siswaId === s.id && idKelas.has(n.kelasId) && n.tanggal.startsWith(ym)).map((n) => n.skor));
    return { s, h, rata, predikat: predikat(rata) };
  });
}

export function barisRekapKelas(db: Database, kelas: Kelas[], ym: string) {
  return kelas.map((k) => {
    const anggota = db.siswa.filter((s) => s.aktif && s.kelasIds.includes(k.id));
    const abs = db.absensi.filter((a) => a.kelasId === k.id && a.tanggal.startsWith(ym));
    let h = 0, t = 0;
    for (const a of abs) for (const v of Object.values(a.catatan)) { t++; if (v === "H") h++; }
    const rata = avg(db.nilai.filter((n) => n.kelasId === k.id && n.tanggal.startsWith(ym)).map((n) => n.skor));
    return { k, jumlah: anggota.length, pertemuan: abs.length, persen: t ? (h / t) * 100 : null, rata };
  });
}

export async function eksporRekap(db: Database, siswa: Siswa[], kelas: Kelas[], ym: string) {
  const rs = barisRekapSiswa(db, siswa, ym);
  const rk = barisRekapKelas(db, kelas, ym);
  await tulis(
    [
      {
        sheet: "Rekap Siswa",
        lebar: [28, 34, 11, 8, 8, 8, 8, 12, 14, 18],
        data: [
          ["Siswa", "Kelas", "Pertemuan", "Hadir", "Izin", "Sakit", "Alpa", "Kehadiran (%)", "Rata-rata nilai", "Predikat"],
          ...rs.map(({ s, h, rata, predikat: p }) => [
            s.nama, s.kelasIds.map((i) => namaKelas(db, i)).join(", "), h.total, h.H, h.I, h.S, h.A,
            h.persen === null ? null : Math.round(h.persen), rata === null ? null : Math.round(rata * 10) / 10, p,
          ] as Sel[]),
        ],
      },
      {
        sheet: "Rekap Kelas",
        lebar: [30, 28, 12, 12, 16, 16],
        data: [
          ["Kelas", "Pengajar", "Siswa aktif", "Pertemuan", "Kehadiran (%)", "Rata-rata nilai"],
          ...rk.map((r) => [
            r.k.nama, namaTutor(db, r.k.tutorId), r.jumlah, r.pertemuan,
            r.persen === null ? null : Math.round(r.persen), r.rata === null ? null : Math.round(r.rata * 10) / 10,
          ] as Sel[]),
        ],
      },
    ],
    `rekap-${ym}.xlsx`,
  );
  void formatBulan;
}
