/**
 * Creator : momonpxl
 * Sosmed  : Instagram & TikTok -> @momonpxl
 * Join Channel WhatsApp admin : https://whatsapp.com/channel/0029VbDYUWf8qIzlSl4slR0t
 *
 * Jangan hapus credit dari Developer, hargailah Dev.
 * Kalau kalian menemukan bug, silakan pull request ya.
 * Waktu yang Mimin habiskan untuk mengembangkan : 4 hari + 19 jam
 *
 * Special thanks for my friend : Hideaki
 */

import { useEffect, useState } from 'react';
import Icon from '../Icon.jsx';
import { Link } from '../router.jsx';
import { api } from '../api.js';
import { useLive } from "../live.js";

const FEATURES = [
  ['zap', 'Instan', 'Panel jadi otomatis dalam hitungan detik, tanpa menunggu admin.'],
  ['key', 'Login otomatis', 'Password dan email dibuatkan sistem, tinggal salin dan masuk.'],
  ['layers', 'Pilih egg bebas', 'Node.js, Python, atau egg lain di panel. Daftar tampil otomatis.'],
  ['shield', 'Adil untuk semua', 'Satu IP hanya bisa membuat satu panel supaya slot tidak habis.'],
];
const STEPS = [
  ['user', 'Isi nama', 'Cukup masukkan satu nama, huruf kecil dan angka saja.'],
  ['layers', 'Pilih egg', 'Pilih jenis bot atau egg lain sesuai kebutuhan.'],
  ['check', 'Salin data login', 'Username, password, email, dan domain panel langsung muncul.'],
];
const FAQ = [
  ['Apakah benar-benar gratis?', 'Ya. Tidak ada biaya, tapi setiap IP hanya bisa membuat satu panel.'],
  ['Password dan email dari mana?', 'Password dibentuk dari nama kamu ditambah 4 karakter acak. Email dibuat otomatis dengan domain yang diatur admin.'],
  ['Kenapa pembuatan gagal?', 'Biasanya nama sudah dipakai, IP sudah punya panel, atau slot sedang ditutup admin. Pesan error akan menjelaskan penyebabnya.'],
  ['Panel saya bisa dihapus?', 'Bisa. Panel yang melanggar rules dihapus oleh admin tanpa pemberitahuan.'],
];

export default function Landing() {
  const [info, setInfo] = useState(null);
  const [faq, setFaq] = useState(0);
  useLive(() => { api("/api/public/info").then(setInfo).catch(() => {}); });

  useEffect(() => { api('/api/public/info').then(setInfo).catch(() => {}); }, []);

  return (
    <>
      <section className="lp-hero">
        <div>
          <div className="lp-hero-badge"><Icon name="zap" size={12} /> Gratis - 1 IP 1 Panel</div>
          <h1 className="lp-hero-title">Panel Pterodactyl <em>gratis</em>, jadi dalam hitungan detik.</h1>
          <p className="lp-hero-sub">Masukkan nama, pilih egg, dan data login langsung dibuatkan. Cocok untuk hosting bot WhatsApp, Telegram, dan Discord.</p>
          <div className="lp-hero-actions">
            <Link to="/claim" className="btn-primary"><Icon name="server" /> Claim panel sekarang</Link>
            <button className="btn-ghost" onClick={() => document.getElementById('cara')?.scrollIntoView({ behavior: 'smooth' })}>Cara kerja</button>
          </div>
          <div className="lp-hero-info">
            <span><Icon name="check" size={13} /> Tanpa biaya</span>
            <span><Icon name="check" size={13} /> Tanpa daftar</span>
            <span><Icon name="check" size={13} /> Auto setup</span>
          </div>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-terminal">
            <div className="lp-terminal-head">
              <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
              <span className="lp-terminal-title">create-panel.log</span>
            </div>
            <div className="lp-terminal-body">
              <div className="lp-term-line"><span className="lp-term-time">00:01</span><span className="lp-term-label">user</span><b>momon</b></div>
              <div className="lp-term-line"><span className="lp-term-time">00:01</span><span className="lp-term-label">pass</span><b>momon****</b></div>
              <div className="lp-term-line"><span className="lp-term-time">00:02</span><span className="lp-term-label">mail</span><b>momon@{info?.emailDomain || 'domain.id'}</b></div>
              <div className="lp-term-line"><span className="lp-term-time">00:03</span><span className="lp-term-label">stat</span><b className="lp-term-ok">[OK] panel dibuat</b></div>
            </div>
          </div>
          <div className="lp-hero-stats">
            <div><strong>Gratis</strong><span>Harga</span></div>
            <div><strong>{info ? info.total : '-'}</strong><span>Panel dibuat</span></div>
            <div><strong>Auto</strong><span>Setup</span></div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <div className="eyebrow">Fitur</div>
          <h2>Simpel, cepat, tanpa ribet</h2>
        </div>
        <div className="lp-features">
          {FEATURES.map(([ic, t, d]) => (
            <div className="lp-feature" key={t}>
              <div className="lp-feature-icon"><Icon name={ic} size={20} /></div>
              <h3>{t}</h3><p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section" id="cara">
        <div className="lp-section-head">
          <div className="eyebrow">Cara kerja</div>
          <h2>Tiga langkah saja</h2>
        </div>
        <div className="lp-steps">
          {STEPS.map(([ic, t, d], i) => (
            <div className="lp-step" key={t}>
              <span className="lp-step-num">0{i + 1}</span>
              <div className="lp-step-icon"><Icon name={ic} size={18} /></div>
              <h3>{t}</h3><p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <div className="eyebrow">FAQ</div>
          <h2>Pertanyaan umum</h2>
        </div>
        <div className="lp-faq">
          {FAQ.map(([q, a], i) => (
            <div className={`lp-faq-item ${faq === i ? 'open' : ''}`} key={q}>
              <button className="lp-faq-q" onClick={() => setFaq(faq === i ? -1 : i)}>
                {q}<span className="lp-faq-chevron">{faq === i ? '-' : '+'}</span>
              </button>
              {faq === i && <div className="lp-faq-a">{a}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-cta">
          <div className="lp-cta-icon"><Icon name="server" size={24} /></div>
          <h2>Siap punya panel sendiri?</h2>
          <p className="muted">Claim gratis, cukup satu nama.</p>
          <div className="lp-cta-actions">
            <Link to="/claim" className="btn-primary"><Icon name="zap" /> Claim panel</Link>
          </div>
        </div>
      </section>
    </>
  );
}
