import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--f-body",
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
    <html lang="id" className={body.variable}>
      <body>{children}</body>
    </html>
  );
}
