"use client";

import { useEffect, useRef, useState } from "react";

const PATHS: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  users: "M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.2a3.5 3.5 0 010 6.6",
  book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 002 2h13",
  teacher: "M12 3l10 5-10 5L2 8l10-5zM6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5",
  check: "M4 12l5 5L20 6",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  file: "M6 3h8l5 5v13H6V3zM14 3v5h5M9 13h7M9 17h7",
  table: "M3 5h18v14H3V5zM3 10h18M9 5v14",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  send: "M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  logout: "M10 4H5v16h5M15 8l4 4-4 4M19 12H9",
};

export function Icon({ name }: { name: keyof typeof PATHS | string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}

export function PageHead({
  judul, deskripsi, children,
}: { judul: string; deskripsi?: string; children?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{judul}</h1>
        {deskripsi && <p>{deskripsi}</p>}
      </div>
      {children && <div className="toolbar">{children}</div>}
    </div>
  );
}

export function Field({
  label, hint, full, children,
}: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`field${full ? " full" : ""}`}>
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Modal({
  judul, onClose, children, footer,
}: { judul: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={judul} ref={ref}>
        <header>
          <h2>{judul}</h2>
          <button className="btn ghost sm" onClick={onClose} aria-label="Tutup"><Icon name="close" /></button>
        </header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

export function Empty({ judul, teks, children }: { judul: string; teks?: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <h3>{judul}</h3>
      {teks && <p>{teks}</p>}
      {children && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? <div className="toast" role="status">{msg}</div> : null;
  return { toast: setMsg, node };
}

export function Persen({ nilai }: { nilai: number | null }) {
  if (nilai === null) return <span className="muted">-</span>;
  const cls = nilai < 75 ? "low" : nilai < 90 ? "mid" : "";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div className={`bar ${cls}`} style={{ flex: 1 }}><span style={{ width: `${Math.min(100, nilai)}%` }} /></div>
      <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 42, textAlign: "right" }}>{nilai.toFixed(0)}%</span>
    </div>
  );
}

export function Konfirmasi({
  judul, teks, onYa, onTidak, label = "Hapus",
}: { judul: string; teks: string; onYa: () => void; onTidak: () => void; label?: string }) {
  return (
    <Modal
      judul={judul}
      onClose={onTidak}
      footer={
        <>
          <button className="btn" onClick={onTidak}>Batal</button>
          <button className="btn primary" style={{ background: "var(--danger)", borderColor: "var(--danger)" }} onClick={onYa}>{label}</button>
        </>
      }
    >
      <p>{teks}</p>
    </Modal>
  );
}
