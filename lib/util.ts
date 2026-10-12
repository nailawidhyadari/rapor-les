import type { Absensi, Database, Nilai, StatusHadir } from "./types";

export const uid = (p = "id") =>
  `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export const STATUS_LABEL: Record<StatusHadir, string> = {
  H: "Hadir",
  I: "Izin",
  S: "Sakit",
  A: "Alpa",
};

export function todayISO(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function monthISO(d = new Date()) {
  return todayISO(d).slice(0, 7);
}

export function formatTanggal(iso: string) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

export function formatBulan(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${BULAN[m - 1]} ${y}`;
}

export function shiftDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return todayISO(new Date(y, m - 1, d + days));
}

export function avg(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function fmtSkor(n: number | null, digits = 1) {
  if (n === null || Number.isNaN(n)) return "-";
  return n.toFixed(digits).replace(".", ",");
}

export interface RingkasanHadir {
  H: number;
  I: number;
  S: number;
  A: number;
  total: number;
  persen: number | null;
}

export function ringkasHadir(
  absensi: Absensi[],
  siswaId: string,
  filter?: (a: Absensi) => boolean,
): RingkasanHadir {
  const r: RingkasanHadir = { H: 0, I: 0, S: 0, A: 0, total: 0, persen: null };
  for (const a of absensi) {
    if (filter && !filter(a)) continue;
    const s = a.catatan[siswaId];
    if (!s) continue;
    r[s]++;
    r.total++;
  }
  r.persen = r.total ? (r.H / r.total) * 100 : null;
  return r;
}

export function predikat(skor: number | null) {
  if (skor === null) return "-";
  if (skor >= 90) return "Sangat Baik";
  if (skor >= 80) return "Baik";
  if (skor >= 70) return "Cukup";
  if (skor >= 60) return "Perlu Peningkatan";
  return "Perlu Bimbingan";
}

export function nilaiBulan(nilai: Nilai[], ym: string) {
  return nilai.filter((n) => n.tanggal.startsWith(ym));
}

export function namaKelas(db: Database, id: string) {
  return db.kelas.find((k) => k.id === id)?.nama ?? "-";
}

export function namaTutor(db: Database, id: string) {
  return db.tutors.find((t) => t.id === id)?.nama ?? "-";
}

export function normalisasiWa(nomor: string, kode = "62") {
  let n = nomor.replace(/[^\d]/g, "");
  if (n.startsWith("0")) n = kode + n.slice(1);
  else if (n.startsWith(kode)) n = n;
  else if (n.startsWith("8")) n = kode + n;
  return n;
}

export function unduhBlob(blob: Blob, nama: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
