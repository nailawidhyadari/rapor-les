import Link from "next/link";
import Reveal from "@/components/Reveal";
import { Avatar, Icon } from "@/components/ui";

const FITUR = [
  ["users", "Data siswa, kelas, dan pengajar", "Identitas siswa, kontak orang tua, jadwal kelas, dan penugasan pengajar dalam satu tempat."],
  ["check", "Absensi per pertemuan", "Catat hadir, izin, sakit, atau alpa tiap pertemuan beserta topik. Rekap terhitung otomatis."],
  ["edit", "Nilai dan catatan tutor", "Input tugas, kuis, ulangan, UTS, dan UAS dengan catatan perkembangan per siswa."],
  ["file", "Laporan PDF otomatis", "Laporan perkembangan tersusun dari data absensi dan nilai, siap diunduh dan dicetak."],
  ["chart", "Rekap bulanan", "Ringkasan kehadiran dan rata-rata nilai per siswa maupun per kelas setiap bulan."],
  ["send", "Kirim ke WhatsApp", "Pesan laporan terisi otomatis dan terbuka langsung ke nomor orang tua yang sesuai."],
  ["download", "Ekspor Excel dan cadangan", "Unduh seluruh data ke Excel, serta simpan dan pulihkan cadangan kapan saja."],
  ["shield", "Akun admin dan tutor", "Tutor hanya melihat dan mengisi kelas miliknya. Admin mengelola semuanya."],
];

const LANGKAH = [
  ["Catat saat les berlangsung", "Tutor mengisi absensi dan nilai dari ponsel atau laptop, langsung setelah kelas selesai."],
  ["Laporan tersusun sendiri", "Sistem menghitung kehadiran, rata-rata nilai, dan predikat. Tutor cukup menambah catatan."],
  ["Kirim ke orang tua", "Unduh PDF atau kirim ringkasan lewat WhatsApp dalam sekali klik."],
];

export default function Beranda() {
  return (
    <div className="pub">
      <div className="hero-bg">
        <header className="pub-nav">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">R</div>
            <div>
              <div className="brand-name">Rapor Les</div>
              <div className="brand-sub">Administrasi tempat les</div>
            </div>
          </div>
          <nav className="links">
            <a className="t" href="#fitur">Fitur</a>
            <a className="t" href="#cara">Cara kerja</a>
            <a className="t" href="#akses">Hak akses</a>
            <Link href="/login" className="btn primary sm">Masuk</Link>
          </nav>
        </header>

        <section className="hero">
          <div>
            <Reveal><span className="tag"><i>Baru</i>Laporan ke orang tua lewat WhatsApp</span></Reveal>
            <Reveal delay={1}><h1>Kelola les dan kirim <em>laporan perkembangan</em> tanpa kerja ganda.</h1></Reveal>
            <Reveal delay={2}>
              <p className="lead">
                Satu sistem untuk data siswa, absensi, nilai, dan laporan bulanan. Dapat dibuka dari
                ponsel, tablet, maupun laptop.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <div className="cta">
                <Link href="/login" className="btn primary">Coba demo</Link>
                <a href="#fitur" className="btn">Lihat fitur</a>
              </div>
              <div className="poin">
                <span><Icon name="tick" />Tanpa instalasi</span>
                <span><Icon name="tick" />Hak akses admin dan tutor</span>
                <span><Icon name="tick" />Laporan PDF</span>
              </div>
            </Reveal>
          </div>

          <div className="mock" aria-hidden="true">
            <div className="kartu utama">
              <div className="mini-h"><b>Kehadiran per pertemuan</b><span className="badge pri">Oktober</span></div>
              <div className="mini-bars">
                {[62, 78, 70, 88, 82, 94, 86, 100].map((h, i) => (
                  <span key={i} style={{ height: `${h}%`, animationDelay: `${0.3 + i * 0.07}s` }} />
                ))}
              </div>
              {[["Alya Putri Rahma", "92", "ok"], ["Bagas Mahendra", "85", "ok"], ["Daffa Ramadhan", "68", "warn"]].map(([n, v, t]) => (
                <div className="baris" key={n}>
                  <Avatar nama={n} kecil />
                  <span>{n}</span>
                  <em>{v}</em>
                  <span className={`badge ${t}`}>{t === "ok" ? "Baik" : "Perlu bimbingan"}</span>
                </div>
              ))}
            </div>
            <div className="kartu melayang1">
              <small>Rata-rata kehadiran</small>
              <div className="v">91%</div>
              <small>naik dari bulan lalu</small>
            </div>
            <div className="kartu melayang2">
              <span className="wa-ic"><Icon name="send" /></span>
              <div><b>Laporan terkirim</b><small>Orang tua Alya, baru saja</small></div>
            </div>
          </div>
        </section>
      </div>

      <section className="sect" id="fitur">
        <Reveal><div className="eyebrow">Fitur</div><h2>Semua yang dibutuhkan tempat les, dalam satu sistem</h2></Reveal>
        <Reveal delay={1}><p className="sub">Dari pencatatan harian sampai laporan untuk orang tua, tanpa pindah-pindah aplikasi.</p></Reveal>
        <div className="feat">
          {FITUR.map(([ic, j, t], i) => (
            <Reveal key={j} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="fcard"><div className="ic"><Icon name={ic} /></div><h3>{j}</h3><p>{t}</p></div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sect" id="cara">
        <Reveal><div className="eyebrow">Cara kerja</div><h2>Tiga langkah dari kelas sampai ke orang tua</h2></Reveal>
        <div className="langkah" style={{ marginTop: 32 }}>
          {LANGKAH.map(([j, t], i) => (
            <Reveal key={j} delay={i as 0 | 1 | 2}><div><h3>{j}</h3><p>{t}</p></div></Reveal>
          ))}
        </div>
      </section>

      <section className="sect" id="akses">
        <Reveal><div className="eyebrow">Hak akses</div><h2>Setiap akun hanya melihat yang menjadi tanggung jawabnya</h2></Reveal>
        <div className="roles" style={{ marginTop: 32 }}>
          <Reveal>
            <div>
              <h3>Admin</h3>
              <ul>
                <li><Icon name="tick" />Mengelola siswa, kelas, pengajar, dan akun</li>
                <li><Icon name="tick" />Melihat seluruh absensi, nilai, dan rekap</li>
                <li><Icon name="tick" />Ekspor Excel dan cadangan data</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div>
              <h3>Tutor</h3>
              <ul>
                <li><Icon name="tick" />Melihat kelas dan siswa yang diajar</li>
                <li><Icon name="tick" />Mengisi absensi, nilai, dan catatan</li>
                <li><Icon name="tick" />Membuat dan mengirim laporan siswanya</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal className="cta-band">
        <div>
          <h2>Lihat langsung bagaimana sistem ini bekerja</h2>
          <p>Masuk dengan akun demo dan coba semua fitur dengan data contoh.</p>
        </div>
        <Link href="/login" className="btn">Coba demo sekarang</Link>
      </Reveal>

      <footer className="pub-foot">Rapor Les - sistem administrasi dan laporan perkembangan siswa</footer>
    </div>
  );
}
