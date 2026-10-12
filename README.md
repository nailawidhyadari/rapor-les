# Rapor Les

Sistem administrasi dan laporan perkembangan siswa untuk tempat les. Dibangun dengan Next.js (App Router) dan TypeScript.

## Persiapan (sekali saja)

1. Buat proyek gratis di [supabase.com](https://supabase.com).
2. Buka **SQL Editor > New query**, tempel seluruh isi `supabase/schema.sql`, lalu **Run**.
3. Buka **Project Settings > API**, salin `Project URL`, `anon public key`, dan `service_role key`.
4. Salin `.env.example` menjadi `.env.local` dan isi ketiga nilai tersebut.
5. Jalankan:

```bash
npm install
npm run dev     # http://localhost:3000
```

6. Buka `/login`. Karena belum ada akun, muncul formulir **Pengaturan awal** untuk membuat admin pertama.
7. Akun tutor dibuat admin lewat menu **Pengajar**. Data contoh bisa dimuat dari **Pengaturan dan Data**.

Nama pengguna tanpa tanda `@` dipetakan ke email internal `nama@rapor.les`; tidak ada email yang dikirim.

## Fitur

- Data siswa, kelas, dan pengajar
- Absensi per pertemuan
- Input nilai dan catatan tutor
- Laporan perkembangan PDF per siswa
- Rekap bulanan per siswa dan per kelas
- Kirim laporan ke WhatsApp orang tua
- Ekspor Excel, cadangan dan pemulihan data (JSON)
- Akun admin dan tutor dengan hak akses berbeda

## Keamanan data

- Data disimpan di PostgreSQL (Supabase) dan login memakai Supabase Auth.
- Hak akses ditegakkan di database lewat Row Level Security (`supabase/schema.sql`): tutor hanya dapat membaca dan mengubah kelas, siswa, absensi, dan nilai miliknya.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di route server (`app/api/*`) untuk membuat akun tutor. Jangan memberi awalan `NEXT_PUBLIC_`.

## Deploy

1. Unggah ke GitHub.
2. Di Vercel pilih **Add New Project**, impor repositori, lalu **Deploy**. Sebelum menekan Deploy, isi **Environment Variables** dengan ketiga nilai pada `.env.example`.
