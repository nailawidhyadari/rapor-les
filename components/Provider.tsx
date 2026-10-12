"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import type { Database, Kelas, Lembaga, Siswa, User } from "@/lib/types";
import { dataKosong } from "@/lib/seed";
import { adaKonfigurasi, ambilSemua, dariBaris, getSupabase, keBaris, keEmail } from "@/lib/supabase";

interface Ctx {
  ready: boolean;
  db: Database;
  user: User | null;
  /** Kelas yang boleh diakses akun aktif (admin: semua, tutor: kelas sendiri). */
  kelasSaya: Kelas[];
  /** Siswa yang boleh diakses akun aktif. */
  siswaSaya: Siswa[];
  isAdmin: boolean;
  /** Mengembalikan pesan galat, atau null bila berhasil. */
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  /** Ubah data: state langsung berubah, lalu perbedaannya disimpan ke database. */
  update: (fn: (db: Database) => Database) => void;
  ganti: (db: Database) => void;
  muatUlang: () => Promise<void>;
  /** Token akses untuk memanggil API server. */
  token: () => Promise<string | null>;
  galat: string;
  tutupGalat: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp harus di dalam <Provider>");
  return c;
}

type Baris = Record<string, unknown>;
type Kunci = "tutors" | "kelas" | "siswa" | "absensi" | "nilai";
const TABEL: Kunci[] = ["tutors", "kelas", "siswa", "absensi", "nilai"];

const sama = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function pesanGalat(e: unknown) {
  const m = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "";
  if (/row-level security/i.test(m)) return "Perubahan ditolak: akun Anda tidak berhak atas data tersebut.";
  return m || "Perubahan gagal disimpan.";
}

export default function Provider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(dataKosong());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [galat, setGalat] = useState("");
  const dbRef = useRef<Database>(db);
  const antrean = useRef<Promise<void>>(Promise.resolve());
  const sb = getSupabase();

  const muat = useCallback(async () => {
    if (!sb) return;
    const { data: sesi } = await sb.auth.getSession();
    const baru = dataKosong();
    // nama lembaga bersifat publik agar tampil di halaman login
    const { data: lem } = await sb.from("lembaga").select("*").eq("id", 1).maybeSingle();
    if (lem) {
      const { id: _id, ...sisa } = lem as Baris;
      baru.lembaga = dariBaris<Lembaga>(sisa);
    }
    let u: User | null = null;
    if (sesi.session) {
      const { data: p } = await sb.from("profiles").select("*").eq("id", sesi.session.user.id).maybeSingle();
      if (p) {
        u = dariBaris<User>(p as Baris);
        const [tutors, kelas, siswa, absensi, nilai, catatan, profiles] = await Promise.all([
          ...TABEL.map((t) => ambilSemua(sb, t)),
          ambilSemua(sb, "catatan_bulanan"),
          ambilSemua(sb, "profiles"),
        ]);
        baru.tutors = tutors.map((r) => dariBaris(r)) as Database["tutors"];
        baru.kelas = kelas.map((r) => dariBaris(r)) as Database["kelas"];
        baru.siswa = siswa.map((r) => dariBaris(r)) as Database["siswa"];
        baru.absensi = absensi.map((r) => dariBaris(r)) as Database["absensi"];
        baru.nilai = nilai.map((r) => dariBaris(r)) as Database["nilai"];
        baru.catatanBulanan = Object.fromEntries(catatan.map((r) => [String(r.kunci), String(r.teks)]));
        baru.users = profiles.map((r) => dariBaris<User>(r));
      } else {
        await sb.auth.signOut();
      }
    }
    dbRef.current = baru;
    setDb(baru);
    setUser(u);
  }, [sb]);

  useEffect(() => {
    if (!sb) return setReady(true);
    let batal = false;
    muat().catch((e) => setGalat(pesanGalat(e))).finally(() => !batal && setReady(true));
    const { data } = sb.auth.onAuthStateChange((ev) => {
      if (ev === "SIGNED_OUT") {
        dbRef.current = dataKosong();
        setDb(dbRef.current);
        setUser(null);
      }
    });
    return () => {
      batal = true;
      data.subscription.unsubscribe();
    };
  }, [sb, muat]);

  /** Menyimpan selisih lama -> baru ke database, berurutan. */
  const sinkron = useCallback(
    (lama: Database, baru: Database) => {
      if (!sb) return;
      const op: (() => PromiseLike<{ error: unknown }>)[] = [];

      if (!sama(lama.lembaga, baru.lembaga)) {
        op.push(() => sb.from("lembaga").upsert({ id: 1, ...keBaris(baru.lembaga) }));
      }
      for (const t of TABEL) {
        const a = lama[t] as { id: string }[];
        const b = baru[t] as { id: string }[];
        const idLama = new Map(a.map((r) => [r.id, r]));
        const idBaru = new Set(b.map((r) => r.id));
        const ubah = b.filter((r) => !sama(idLama.get(r.id), r));
        const hapus = a.filter((r) => !idBaru.has(r.id)).map((r) => r.id);
        for (let i = 0; i < ubah.length; i += 200) {
          const potong = ubah.slice(i, i + 200).map((r) => keBaris(r));
          op.push(() => sb.from(t).upsert(potong));
        }
        for (let i = 0; i < hapus.length; i += 200) {
          const potong = hapus.slice(i, i + 200);
          op.push(() => sb.from(t).delete().in("id", potong));
        }
      }
      const ck = Object.entries(baru.catatanBulanan).filter(([k, v]) => lama.catatanBulanan[k] !== v);
      if (ck.length) op.push(() => sb.from("catatan_bulanan").upsert(ck.map(([kunci, teks]) => ({ kunci, teks }))));
      const ckHapus = Object.keys(lama.catatanBulanan).filter((k) => !(k in baru.catatanBulanan));
      if (ckHapus.length) op.push(() => sb.from("catatan_bulanan").delete().in("kunci", ckHapus));

      if (!op.length) return;
      antrean.current = antrean.current.then(async () => {
        try {
          for (const jalankan of op) {
            const { error } = await jalankan();
            if (error) throw error;
          }
        } catch (e) {
          setGalat(pesanGalat(e));
          await muat().catch(() => {});
        }
      });
    },
    [sb, muat],
  );

  const ganti = useCallback(
    (baru: Database) => {
      const lama = dbRef.current;
      // akun tidak disinkronkan lewat diff; tetap memakai daftar dari server
      const utuh = { ...baru, users: lama.users };
      dbRef.current = utuh;
      setDb(utuh);
      sinkron(lama, utuh);
    },
    [sinkron],
  );

  const update = useCallback(
    (fn: (d: Database) => Database) => ganti(fn(dbRef.current)),
    [ganti],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      if (!sb) return "Database belum dikonfigurasi.";
      const { error } = await sb.auth.signInWithPassword({ email: keEmail(username), password });
      if (error) return "Nama pengguna atau kata sandi tidak sesuai.";
      await muat();
      return null;
    },
    [sb, muat],
  );

  const logout = useCallback(async () => {
    await sb?.auth.signOut();
  }, [sb]);

  const token = useCallback(async () => (await sb?.auth.getSession())?.data.session?.access_token ?? null, [sb]);

  const value = useMemo<Ctx>(() => {
    const isAdmin = user?.role === "admin";
    const kelasSaya = isAdmin
      ? db.kelas
      : db.kelas.filter((k) => user?.tutorId && k.tutorId === user.tutorId);
    const idKelas = new Set(kelasSaya.map((k) => k.id));
    const siswaSaya = isAdmin
      ? db.siswa
      : db.siswa.filter((s) => s.kelasIds.some((id) => idKelas.has(id)));
    return {
      ready, db, user, kelasSaya, siswaSaya, isAdmin,
      login, logout, update, ganti, muatUlang: muat, token,
      galat, tutupGalat: () => setGalat(""),
    };
  }, [db, user, ready, login, logout, update, ganti, muat, token, galat]);

  if (!adaKonfigurasi()) {
    return (
      <div className="login-wrap">
        <div className="login-box">
          <div className="panel panel-body">
            <h1 style={{ fontSize: 22, marginBottom: 8 }}>Database belum dikonfigurasi</h1>
            <p className="muted small">
              Isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> pada
              berkas <code>.env.local</code> (atau Environment Variables di Vercel). Lihat README untuk langkahnya.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (!ready) return <div className="login-wrap"><p className="muted">Memuat data...</p></div>;
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
