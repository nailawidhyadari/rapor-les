import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--f-body",
  display: "swap",
});

const head = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--f-head",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rapor Les - Sistem Administrasi dan Laporan Perkembangan Siswa",
    template: "%s | Rapor Les",
  },
  description:
    "Sistem administrasi tempat les: data siswa, absensi, nilai, laporan perkembangan PDF, rekap bulanan, dan pengiriman laporan ke WhatsApp orang tua.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${body.variable} ${head.variable}`}>
      <body>{children}</body>
    </html>
  );
}
