import type {
  Absensi, Database, JenisNilai, Kelas, Nilai, Siswa, StatusHadir, Tutor,
} from "./types";
import { shiftDays, todayISO } from "./util";

export const DB_VERSI = 1;

export function dataKosong(): Database {
  return {
    versi: DB_VERSI,
    lembaga: {
      nama: "Nama Lembaga Les",
      alamat: "",
      telepon: "",
      tahunAjaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      kodeNegara: "62",
    },
    users: [],
    tutors: [],
    kelas: [],
    siswa: [],
    absensi: [],
    nilai: [],
    catatanBulanan: {},
  };
}

// pseudo-random deterministik agar data contoh selalu sama
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function dataContoh(): Database {
  const r = rng(42);

  const tutors: Tutor[] = [
    { id: "t1", nama: "Rina Kusumawati, S.Pd.", telepon: "081234567801", mapel: "Matematika", aktif: true },
    { id: "t2", nama: "Dimas Prasetyo, S.Si.", telepon: "081234567802", mapel: "IPA", aktif: true },
    { id: "t3", nama: "Laras Anggraini, S.S.", telepon: "081234567803", mapel: "Bahasa Inggris", aktif: true },
  ];

  const kelas: Kelas[] = [
    { id: "k1", nama: "Matematika SMP 8A", mapel: "Matematika", jenjang: "SMP", tutorId: "t1", hari: "Senin", jam: "15.30 - 17.00", aktif: true },
    { id: "k2", nama: "Matematika SD 5", mapel: "Matematika", jenjang: "SD", tutorId: "t1", hari: "Rabu", jam: "15.00 - 16.30", aktif: true },
    { id: "k3", nama: "IPA SMP 9", mapel: "IPA", jenjang: "SMP", tutorId: "t2", hari: "Selasa", jam: "16.00 - 17.30", aktif: true },
    { id: "k4", nama: "Bahasa Inggris SMA 10", mapel: "Bahasa Inggris", jenjang: "SMA", tutorId: "t3", hari: "Kamis", jam: "16.00 - 17.30", aktif: true },
  ];

  const nama = [
    ["Alya Putri Rahma", "SMP Negeri 3", "SMP", ["k1", "k3"]],
    ["Bagas Mahendra", "SMP Negeri 3", "SMP", ["k1"]],
    ["Citra Maharani", "SMP Islam Al-Azhar", "SMP", ["k1", "k3"]],
    ["Daffa Ramadhan", "SMP Negeri 7", "SMP", ["k1"]],
    ["Eka Salsabila", "SD Negeri 2", "SD", ["k2"]],
    ["Fikri Hidayat", "SD Negeri 2", "SD", ["k2"]],
    ["Gita Permatasari", "SD Cendekia", "SD", ["k2"]],
    ["Hanif Maulana", "SMP Negeri 1", "SMP", ["k3"]],
    ["Intan Nurhaliza", "SMP Negeri 1", "SMP", ["k3"]],
    ["Joko Santoso", "SMA Negeri 5", "SMA", ["k4"]],
    ["Keisha Amelia", "SMA Negeri 5", "SMA", ["k4"]],
    ["Lutfi Arkan", "SMA Negeri 2", "SMA", ["k4"]],
  ] as const;

  const siswa: Siswa[] = nama.map((n, i) => ({
    id: `s${i + 1}`,
    nama: n[0],
    sekolah: n[1],
    jenjang: n[2],
    namaOrtu: `Orang tua ${n[0].split(" ")[0]}`,
    waOrtu: `08123400${String(i + 10).padStart(4, "0")}`,
    kelasIds: [...n[3]],
    aktif: true,
  }));

  // absensi: 8 pertemuan terakhir per kelas, mingguan
  const hariIdx: Record<string, number> = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };
  const absensi: Absensi[] = [];
  const nilai: Nilai[] = [];
  const topikPerMapel: Record<string, string[]> = {
    Matematika: ["Bilangan bulat", "Pecahan", "Aljabar dasar", "Persamaan linear", "Perbandingan", "Geometri bangun datar", "Statistika", "Latihan campuran"],
    IPA: ["Gerak lurus", "Gaya dan hukum Newton", "Energi", "Getaran dan gelombang", "Listrik statis", "Sel dan jaringan", "Sistem pencernaan", "Latihan campuran"],
    "Bahasa Inggris": ["Simple present", "Simple past", "Reading comprehension", "Descriptive text", "Narrative text", "Vocabulary building", "Listening practice", "Mixed review"],
  };
  const jenisSet: JenisNilai[] = ["Tugas", "Kuis", "Ulangan Harian", "Kuis", "Tugas", "Ulangan Harian", "Kuis", "UTS"];
  const catatanContoh = [
    "Memahami konsep dengan baik.",
    "Perlu lebih teliti dalam menghitung.",
    "Aktif bertanya selama pembelajaran.",
    "Perlu latihan tambahan di rumah.",
    "Perkembangan stabil, pertahankan.",
    "",
    "",
  ];

  for (const k of kelas) {
    const target = hariIdx[k.hari];
    const d = new Date();
    // mundur ke hari pertemuan terakhir (pertemuan ke-8 = paling baru)
    while (d.getDay() !== target) d.setDate(d.getDate() - 1);
    const terbaru = todayISO(d);
    const anggota = siswa.filter((s) => s.kelasIds.includes(k.id));
    for (let p = 1; p <= 8; p++) {
      const tanggal = shiftDays(terbaru, -(8 - p) * 7);
      const rec: Record<string, StatusHadir> = {};
      for (const s of anggota) {
        const x = r();
        rec[s.id] = x < 0.84 ? "H" : x < 0.91 ? "I" : x < 0.96 ? "S" : "A";
      }
      const idx = p - 1;
      absensi.push({
        id: `a_${k.id}_${p}`,
        kelasId: k.id,
        tanggal,
        pertemuan: p,
        topik: topikPerMapel[k.mapel][idx],
        catatan: rec,
      });
      for (const s of anggota) {
        if (rec[s.id] !== "H" || r() >= 0.55) continue;
        const base = 62 + (parseInt(s.id.slice(1)) * 7) % 22;
        const skor = Math.max(40, Math.min(100, Math.round(base + p * 1.4 + (r() - 0.5) * 16)));
        nilai.push({
          id: `n_${k.id}_${s.id}_${p}`,
          siswaId: s.id,
          kelasId: k.id,
          tanggal,
          jenis: jenisSet[idx],
          topik: topikPerMapel[k.mapel][idx],
          skor,
          catatan: catatanContoh[Math.floor(r() * catatanContoh.length)],
          tutorId: k.tutorId,
        });
      }
    }
  }

  const tahun = new Date().getFullYear();
  return {
    versi: DB_VERSI,
    lembaga: {
      nama: "Bimbel Cendekia Mandiri",
      alamat: "Jl. Pendidikan No. 12, Kota Contoh",
      telepon: "021-5550123",
      tahunAjaran: `${tahun}/${tahun + 1}`,
      kodeNegara: "62",
    },
    users: [],
    tutors,
    kelas,
    siswa,
    absensi,
    nilai,
    catatanBulanan: {},
  };
}
