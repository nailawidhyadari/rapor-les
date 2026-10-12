export type Role = "admin" | "tutor";

export type Jenjang = "SD" | "SMP" | "SMA" | "Umum";

export type StatusHadir = "H" | "I" | "S" | "A";

export type JenisNilai = "Tugas" | "Kuis" | "Ulangan Harian" | "UTS" | "UAS";

export interface Lembaga {
  nama: string;
  alamat: string;
  telepon: string;
  tahunAjaran: string;
  kodeNegara: string;
}

export interface User {
  id: string;
  nama: string;
  username: string;
  role: Role;
  tutorId?: string;
}

export interface Tutor {
  id: string;
  nama: string;
  telepon: string;
  mapel: string;
  aktif: boolean;
}

export interface Kelas {
  id: string;
  nama: string;
  mapel: string;
  jenjang: Jenjang;
  tutorId: string;
  hari: string;
  jam: string;
  aktif: boolean;
}

export interface Siswa {
  id: string;
  nama: string;
  sekolah: string;
  jenjang: Jenjang;
  namaOrtu: string;
  waOrtu: string;
  kelasIds: string[];
  aktif: boolean;
}

export interface Absensi {
  id: string;
  kelasId: string;
  tanggal: string; // YYYY-MM-DD
  pertemuan: number;
  topik: string;
  catatan: Record<string, StatusHadir>; // siswaId -> status
}

export interface Nilai {
  id: string;
  siswaId: string;
  kelasId: string;
  tanggal: string;
  jenis: JenisNilai;
  topik: string;
  skor: number;
  catatan: string;
  tutorId: string;
}

// catatan perkembangan bulanan per siswa, kunci: `${siswaId}|${YYYY-MM}`
export type CatatanBulanan = Record<string, string>;

export interface Database {
  versi: number;
  lembaga: Lembaga;
  users: User[];
  tutors: Tutor[];
  kelas: Kelas[];
  siswa: Siswa[];
  absensi: Absensi[];
  nilai: Nilai[];
  catatanBulanan: CatatanBulanan;
}
