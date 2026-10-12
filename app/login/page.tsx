"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/Provider";

export default function Login() {
  const { login, user, db } = useApp();
  const router = useRouter();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [perluSetup, setPerluSetup] = useState(false);
  const [setup, setSetup] = useState({ lembaga: "", nama: "", username: "", password: "" });

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  useEffect(() => {
    fetch("/api/setup", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setPerluSetup(!!d.perlu);
        if (d.galat) setErr(d.galat);
      })
      .catch(() => {});
  }, []);

  async function masuk(username: string, password: string) {
    setSibuk(true);
    const g = await login(username, password);
    if (g) {
      setErr(g);
      setSibuk(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    await masuk(u, p);
  }

  async function buatAdmin(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSibuk(true);
    const r = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setup),
    });
    const d = await r.json();
    if (!r.ok) {
      setErr(d.galat ?? "Gagal membuat akun admin.");
      setSibuk(false);
      return;
    }
    await masuk(setup.username, setup.password);
  }

  const brand = (
    <div className="brand" style={{ padding: "0 0 18px" }}>
      <div className="brand-mark" style={{ background: "var(--primary)", color: "var(--primary-ink)" }} aria-hidden="true">
        {db.lembaga.nama.charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="brand-name" style={{ color: "var(--ink)" }}>{db.lembaga.nama}</div>
        <div className="brand-sub" style={{ color: "var(--muted)" }}>Sistem Rapor Les</div>
      </div>
    </div>
  );

  if (perluSetup) {
    return (
      <div className="login-wrap">
        <div className="login-box">
          {brand}
          <form className="panel" onSubmit={buatAdmin}>
            <h1>Pengaturan awal</h1>
            <p className="muted small" style={{ marginBottom: 18 }}>Belum ada akun. Buat akun admin pertama untuk memulai.</p>
            <div className="stack-y">
              <div className="field"><label htmlFor="sl">Nama lembaga</label><input id="sl" className="input" value={setup.lembaga} onChange={(e) => setSetup({ ...setup, lembaga: e.target.value })} required /></div>
              <div className="field"><label htmlFor="sn">Nama lengkap admin</label><input id="sn" className="input" value={setup.nama} onChange={(e) => setSetup({ ...setup, nama: e.target.value })} required /></div>
              <div className="field"><label htmlFor="su">Nama pengguna</label><input id="su" className="input" autoCapitalize="none" value={setup.username} onChange={(e) => setSetup({ ...setup, username: e.target.value })} required /></div>
              <div className="field"><label htmlFor="sp">Kata sandi</label><input id="sp" type="password" className="input" autoComplete="new-password" minLength={8} value={setup.password} onChange={(e) => setSetup({ ...setup, password: e.target.value })} required /><span className="hint">Minimal 8 karakter</span></div>
              {err && <p className="err" role="alert">{err}</p>}
              <button className="btn primary" style={{ width: "100%", minHeight: 44 }} disabled={sibuk}>{sibuk ? "Memproses..." : "Buat akun admin"}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        {brand}
        <form className="panel" onSubmit={submit}>
          <h1>Masuk</h1>
          <p className="muted small" style={{ marginBottom: 18 }}>Gunakan akun yang diberikan oleh admin lembaga.</p>
          <div className="stack-y">
            <div className="field">
              <label htmlFor="u">Nama pengguna</label>
              <input id="u" className="input" value={u} onChange={(e) => { setU(e.target.value); setErr(""); }} autoComplete="username" autoCapitalize="none" required />
            </div>
            <div className="field">
              <label htmlFor="p">Kata sandi</label>
              <input id="p" type="password" className="input" value={p} onChange={(e) => { setP(e.target.value); setErr(""); }} autoComplete="current-password" required />
            </div>
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn primary" style={{ width: "100%", minHeight: 44 }} disabled={sibuk}>{sibuk ? "Memproses..." : "Masuk"}</button>
          </div>
        </form>
        <p style={{ marginTop: 16, textAlign: "center" }} className="small"><Link href="/">Kembali ke beranda</Link></p>
      </div>
    </div>
  );
}
