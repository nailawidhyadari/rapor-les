/** Akun demo. Hanya aktif bila NEXT_PUBLIC_MODE_DEMO=1. Jangan dipakai untuk data klien yang sebenarnya. */
export const MODE_DEMO = process.env.NEXT_PUBLIC_MODE_DEMO === "1";

export const AKUN_DEMO = [
  { peran: "Admin", nama: "Admin Demo", username: "demo-admin", password: "demo12345", role: "admin" as const,
    deskripsi: "Akses penuh: data, pengajar, pengaturan, ekspor." },
  { peran: "Tutor", nama: "Tutor Demo", username: "demo-tutor", password: "demo12345", role: "tutor" as const,
    deskripsi: "Hanya kelas dan siswa miliknya." },
];
