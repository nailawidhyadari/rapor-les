"use client";

import { useEffect, useRef, useState } from "react";

/** Memunculkan konten dengan efek naik saat masuk layar. */
export default function Reveal({
  children, className = "", delay = 0, as: Tag = "div",
}: { children: React.ReactNode; className?: string; delay?: 0 | 1 | 2 | 3; as?: "div" | "section" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [masuk, setMasuk] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setMasuk(true);
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setMasuk(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const props = { ref: ref as never, className: `reveal${delay ? ` d${delay}` : ""}${masuk ? " in" : ""} ${className}` };
  return <Tag {...props}>{children}</Tag>;
}
