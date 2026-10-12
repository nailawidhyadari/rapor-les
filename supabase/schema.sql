-- Rapor Les: skema database Supabase.
-- Jalankan seluruh isi berkas ini di Supabase > SQL Editor > New query > Run.

create table if not exists lembaga (
  id int primary key default 1 check (id = 1),
  nama text not null default 'Nama Lembaga Les',
  alamat text not null default '',
  telepon text not null default '',
  tahun_ajaran text not null default '',
  kode_negara text not null default '62'
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  username text not null unique,
  role text not null check (role in ('admin', 'tutor')),
  tutor_id text
);

create table if not exists tutors (
  id text primary key,
  nama text not null,
  telepon text not null default '',
  mapel text not null default '',
  aktif boolean not null default true
);

create table if not exists kelas (
  id text primary key,
  nama text not null,
  mapel text not null default '',
  jenjang text not null default 'SD',
  tutor_id text not null,
  hari text not null default 'Senin',
  jam text not null default '',
  aktif boolean not null default true
);

create table if not exists siswa (
  id text primary key,
  nama text not null,
  sekolah text not null default '',
  jenjang text not null default 'SD',
  nama_ortu text not null default '',
  wa_ortu text not null default '',
  kelas_ids text[] not null default '{}',
  aktif boolean not null default true
);

create table if not exists absensi (
  id text primary key,
  kelas_id text not null,
  tanggal date not null,
  pertemuan int not null,
  topik text not null default '',
  catatan jsonb not null default '{}'
);
create index if not exists absensi_kelas_idx on absensi (kelas_id, tanggal);

create table if not exists nilai (
  id text primary key,
  siswa_id text not null,
  kelas_id text not null,
  tanggal date not null,
  jenis text not null,
  topik text not null default '',
  skor numeric not null,
  catatan text not null default '',
  tutor_id text not null default ''
);
create index if not exists nilai_kelas_idx on nilai (kelas_id, tanggal);
create index if not exists nilai_siswa_idx on nilai (siswa_id);

create table if not exists catatan_bulanan (
  kunci text primary key, -- "<siswa_id>|<YYYY-MM>"
  teks text not null default ''
);

-- Fungsi bantu (security definer agar tidak memicu rekursi RLS)
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function my_tutor_id() returns text
language sql stable security definer set search_path = public as $$
  select tutor_id from profiles where id = auth.uid();
$$;

create or replace function my_kelas() returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(id), '{}') from kelas
  where tutor_id = (select tutor_id from profiles where id = auth.uid());
$$;

alter table lembaga enable row level security;
alter table profiles enable row level security;
alter table tutors enable row level security;
alter table kelas enable row level security;
alter table siswa enable row level security;
alter table absensi enable row level security;
alter table nilai enable row level security;
alter table catatan_bulanan enable row level security;

-- lembaga: nama tampil di halaman login, ubah hanya admin
create policy lembaga_baca on lembaga for select to anon, authenticated using (true);
create policy lembaga_admin on lembaga for all to authenticated using (is_admin()) with check (is_admin());

-- profiles: baca milik sendiri atau semua (admin). Penulisan hanya lewat server (service role).
create policy profiles_baca on profiles for select to authenticated using (id = auth.uid() or is_admin());

-- tutors: semua akun masuk boleh membaca, ubah hanya admin
create policy tutors_baca on tutors for select to authenticated using (true);
create policy tutors_admin on tutors for all to authenticated using (is_admin()) with check (is_admin());

-- kelas
create policy kelas_admin on kelas for all to authenticated using (is_admin()) with check (is_admin());
create policy kelas_tutor_baca on kelas for select to authenticated using (tutor_id = my_tutor_id());
create policy kelas_tutor_ubah on kelas for update to authenticated using (tutor_id = my_tutor_id()) with check (tutor_id = my_tutor_id());

-- siswa
create policy siswa_admin on siswa for all to authenticated using (is_admin()) with check (is_admin());
create policy siswa_tutor_baca on siswa for select to authenticated using (kelas_ids && my_kelas());
create policy siswa_tutor_tambah on siswa for insert to authenticated with check (kelas_ids && my_kelas());
create policy siswa_tutor_ubah on siswa for update to authenticated using (kelas_ids && my_kelas()) with check (kelas_ids && my_kelas());

-- absensi dan nilai: tutor hanya pada kelasnya
create policy absensi_admin on absensi for all to authenticated using (is_admin()) with check (is_admin());
create policy absensi_tutor on absensi for all to authenticated using (kelas_id = any (my_kelas())) with check (kelas_id = any (my_kelas()));
create policy nilai_admin on nilai for all to authenticated using (is_admin()) with check (is_admin());
create policy nilai_tutor on nilai for all to authenticated using (kelas_id = any (my_kelas())) with check (kelas_id = any (my_kelas()));

-- catatan bulanan: mengikuti siswa yang boleh dilihat
create policy catatan_admin on catatan_bulanan for all to authenticated using (is_admin()) with check (is_admin());
create policy catatan_tutor on catatan_bulanan for all to authenticated
  using (exists (select 1 from siswa s where s.id = split_part(kunci, '|', 1)))
  with check (exists (select 1 from siswa s where s.id = split_part(kunci, '|', 1)));

insert into lembaga (id) values (1) on conflict do nothing;
