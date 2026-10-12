"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/Provider";
import { AKUN_DEMO, MODE_DEMO } from "@/lib/demo";

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

  const [pakaiForm, setPakaiForm] = useState(false);
  useEffect(() => {
    setPakaiForm(new URLSearchParams(window.location.search).get("akun") === "sendiri");
  }, []);

  async function masukDemo(a: (typeof AKUN_DEMO)[number]) {
    setErr("");
    setSibuk(true);
    try {
      const r = await fetch("/api/demo", { method: "POST" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).galat ?? "Gagal menyiapkan demo.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyiapkan demo.");
      setSibuk(false);
      return;
    }
    await masuk(a.username, a.password);
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

  if (MODE_DEMO && !pakaiForm) {
    return (
      <div className="login-wrap">
        <div className="login-box">
          {brand}
          <div className="panel">
            <h1>Coba versi demo</h1>
            <p className="muted small" style={{ marginBottom: 16 }}>Pilih peran untuk masuk. Data yang tampil adalah data contoh.</p>
            <div className="stack-y">
              {AKUN_DEMO.map((a) => (
                <div key={a.username} style={{ border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                    <strong>{a.peran}</strong>
                    <span className="small muted">{a.deskripsi}</span>
                  </div>
                  <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", margin: "10px 0 12px", fontSize: 14 }}>
                    <dt className="muted">Nama pengguna</dt><dd style={{ margin: 0, fontFamily: "ui-monospace, Menlo, monospace" }}>{a.username}</dd>
                    <dt className="muted">Kata sandi</dt><dd style={{ margin: 0, fontFamily: "ui-monospace, Menlo, monospace" }}>{a.password}</dd>
                  </dl>
                  <button className="btn primary" style={{ width: "100%", minHeight: 42 }} disabled={sibuk} onClick={() => masukDemo(a)}>
                    {sibuk ? "Memproses..." : `Masuk sebagai ${a.peran}`}
                  </button>
                </div>
              ))}
              {err && <p className="err" role="alert">{err}</p>}
            </div>
          </div>
          <p style={{ marginTop: 16, textAlign: "center" }} className="small"><Link href="/">Kembali ke beranda</Link></p>
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
