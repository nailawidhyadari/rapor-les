"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "./Provider";
import { Avatar, Icon } from "./ui";

const MENU = [
  { href: "/dashboard", label: "Ringkasan", icon: "home", grup: "Utama" },
  { href: "/siswa", label: "Siswa", icon: "users", grup: "Data" },
  { href: "/kelas", label: "Kelas", icon: "book", grup: "Data" },
  { href: "/pengajar", label: "Pengajar", icon: "teacher", grup: "Data", admin: true },
  { href: "/absensi", label: "Absensi", icon: "check", grup: "Kegiatan Belajar" },
  { href: "/nilai", label: "Nilai & Catatan", icon: "edit", grup: "Kegiatan Belajar" },
  { href: "/laporan", label: "Laporan Siswa", icon: "file", grup: "Laporan" },
  { href: "/rekap", label: "Rekap Bulanan", icon: "table", grup: "Laporan" },
  { href: "/pengaturan", label: "Pengaturan & Data", icon: "gear", grup: "Sistem", admin: true },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, db, logout, isAdmin, galat, tutupGalat } = useApp();
  const path = usePathname();
  const router = useRouter();
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  useEffect(() => setBuka(false), [path]);

  const adminSaja = MENU.find((m) => path.startsWith(m.href))?.admin;
  useEffect(() => {
    if (user && adminSaja && !isAdmin) router.replace("/dashboard");
  }, [user, adminSaja, isAdmin, router]);

  if (!user) return null;

  const item = MENU.filter((m) => isAdmin || !m.admin);
  const grup = Array.from(new Set(item.map((m) => m.grup)));
  const judulHalaman = item.find((m) => path.startsWith(m.href))?.label ?? "Rapor Les";

  return (
    <div className="shell">
      <header className="topbar">
        <button onClick={() => setBuka(true)} aria-label="Buka menu"><Icon name="menu" /></button>
        <span className="t">{judulHalaman}</span>
      </header>
      <div className={`scrim${buka ? " open" : ""}`} onClick={() => setBuka(false)} />
      <aside className={`sidebar${buka ? " open" : ""}`} aria-label="Navigasi utama">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">{db.lembaga.nama.charAt(0).toUpperCase()}</div>
          <div>
            <div className="brand-name">{db.lembaga.nama}</div>
            <div className="brand-sub">TA {db.lembaga.tahunAjaran}</div>
          </div>
        </div>
        <nav className="nav">
          {grup.map((g) => (
            <div key={g}>
              <div className="nav-label">{g}</div>
              {item.filter((m) => m.grup === g).map((m) => (
                <Link key={m.href} href={m.href} aria-current={path.startsWith(m.href) ? "page" : undefined}>
                  <Icon name={m.icon} />{m.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <div className="row">
            <Avatar nama={user.nama} />
            <div>
              <div className="who-n">{user.nama}</div>
              <div className="role">{isAdmin ? "Administrator" : "Tutor"}</div>
            </div>
          </div>
          <button className="btn sm" onClick={async () => { await logout(); router.replace("/login"); }}>
            <Icon name="logout" />Keluar
          </button>
        </div>
      </aside>
      <main className="main">
        {galat && (
          <div role="alert" className="panel panel-body" style={{ marginBottom: 16, borderColor: "var(--danger)", background: "var(--danger-soft)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <span>{galat} Data telah dimuat ulang dari server.</span>
            <button className="btn sm" onClick={tutupGalat}>Tutup</button>
          </div>
        )}
        <div key={path} className="halaman">{children}</div>
      </main>
    </div>
  );
}
