import Link from "next/link";

const FITUR = [
  ["Data siswa, kelas, dan pengajar", "Satu tempat untuk identitas siswa, kontak orang tua, jadwal kelas, dan penugasan pengajar."],
  ["Absensi per pertemuan", "Catat kehadiran setiap pertemuan beserta topik yang dibahas. Rekap kehadiran terhitung otomatis."],
  ["Nilai dan catatan tutor", "Input hasil tugas, kuis, ulangan, hingga UTS dan UAS, lengkap dengan catatan perkembangan tiap siswa."],
  ["Laporan perkembangan PDF", "Laporan per siswa tersusun otomatis dari data absensi dan nilai, siap diunduh dan dicetak."],
  ["Rekap bulanan", "Ringkasan kehadiran dan rata-rata nilai per siswa maupun per kelas untuk setiap bulan."],
  ["Kirim ke WhatsApp orang tua", "Pesan laporan terisi otomatis dan langsung terbuka di WhatsApp dengan nomor orang tua yang sesuai."],
  ["Ekspor Excel dan cadangan data", "Unduh seluruh data dalam format Excel, serta simpan dan pulihkan cadangan kapan saja."],
  ["Akun admin dan tutor", "Admin mengelola seluruh data. Tutor hanya melihat dan mengisi kelas yang menjadi tanggung jawabnya."],
];

export default function Beranda() {
  return (
    <div className="pub">
      <header className="pub-nav">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">R</div>
          <div>
            <div className="brand-name">Rapor Les</div>
            <div className="brand-sub">Administrasi tempat les</div>
          </div>
        </div>
        <Link href="/login" className="btn primary">Masuk</Link>
      </header>

      <section className="hero">
        <div>
          <h1>Laporan perkembangan siswa, tersusun rapi tanpa kerja ganda.</h1>
          <p className="lead">
            Sistem untuk tempat les yang menyatukan data siswa, absensi, dan nilai, lalu
            menghasilkan laporan bulanan untuk orang tua. Dapat dibuka dari ponsel, tablet, maupun laptop.
          </p>
          <div className="cta">
            <Link href="/login" className="btn primary">Masuk ke sistem</Link>
            <a href="#fitur" className="btn">Lihat fitur</a>
          </div>
        </div>
        <div className="preview" aria-hidden="true">
          <h4>Contoh ringkasan siswa, Oktober</h4>
          <div className="row"><span>Kehadiran</span><strong>7 dari 8 pertemuan</strong></div>
          <div className="row"><span>Rata-rata nilai</span><strong>84,5</strong></div>
          <div className="row"><span>Predikat</span><strong>Baik</strong></div>
          <div className="row"><span>Catatan tutor</span><span className="muted">Aktif bertanya, perlu latihan soal cerita.</span></div>
          <div className="row"><span>Laporan</span><span className="badge ok">Siap dikirim</span></div>
        </div>
      </section>

      <section className="sect" id="fitur">
        <h2>Fitur</h2>
        <p className="sub">Mencakup kebutuhan administrasi harian hingga pelaporan kepada orang tua.</p>
        <div className="feat">
          {FITUR.map(([j, t]) => (
            <div key={j}><h3>{j}</h3><p>{t}</p></div>
          ))}
        </div>
      </section>

      <section className="sect">
        <h2>Hak akses</h2>
        <p className="sub">Setiap akun hanya melihat bagian yang menjadi tanggung jawabnya.</p>
        <div className="roles">
          <div className="panel panel-body">
            <h3>Admin</h3>
            <ul>
              <li>Mengelola siswa, kelas, pengajar, dan akun</li>
              <li>Melihat seluruh absensi, nilai, dan rekap</li>
              <li>Mengekspor Excel dan mengelola cadangan data</li>
            </ul>
          </div>
          <div className="panel panel-body">
            <h3>Tutor</h3>
            <ul>
              <li>Melihat kelas dan siswa yang diajar</li>
              <li>Mengisi absensi, nilai, dan catatan</li>
              <li>Membuat dan mengirim laporan siswanya</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="pub-foot">Rapor Les - sistem administrasi dan laporan perkembangan siswa</footer>
    </div>
  );
}
