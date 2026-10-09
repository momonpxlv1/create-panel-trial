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
import { CopyBtn } from '../ui.jsx';
import { Link } from '../router.jsx';
import { api } from '../api.js';
import { useLive } from "../live.js";

const fmt = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

const BLOCK = {
  blacklist: ['ban', 'IP kamu diblokir', 'IP ini tidak bisa claim panel. Hubungi admin kalau merasa ini keliru.'],
  lifetime: ['lock', 'Claim sudah dipakai', 'IP kamu sudah pernah claim panel dan batasnya hanya 1x.'],
  cooldown: ['clock', 'Cooldown aktif', 'IP kamu belum bisa claim lagi untuk sementara.'],
};

export default function Claim() {
  const [info, setInfo] = useState(null);
  const [name, setName] = useState('');
  const [egg, setEgg] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  useLive(() => { api("/api/public/info").then(setInfo).catch(() => {}); });

  useEffect(() => {
    api('/api/public/info')
      .then((d) => { setInfo(d); setEgg(String(d.defaultEgg)); })
      .catch((e) => setErr(e.message));
  }, []);

  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const valid = clean.length >= 4 && clean.length <= 16;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      setResult(await api('/api/panel/create', { method: 'POST', body: { name: clean, eggId: Number(egg) } }));
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  const block = info?.blocked ? BLOCK[info.blocked] : null;

  return (
    <div className="claim-page">
      <div className="claim-head">
        <div className="claim-head-icon"><Icon name="server" size={26} /></div>
        <div className="eyebrow">Claim panel</div>
        <h1>Buat panel gratis</h1>
        <p className="muted">Isi nama dan pilih egg. Data login dibuat otomatis.</p>
      </div>

      <div className="create-wrap">
        {result ? (
          <div className="claim-success">
            <div className="claim-success-icon"><Icon name="check" size={30} /></div>
            <h2>Panel berhasil di buat!</h2>
            <p className="muted">Simpan data login ini, password tidak ditampilkan lagi.</p>
            <div className="cred-grid">
              {[['Username', result.username], ['Password', result.password], ['Gmail', result.email], ['Domain panel', result.domain]].map(([k, v]) => (
                <div className="cred-box" key={k}>
                  <div className="cred-label">{k}</div>
                  <div className="cred-value"><code>{v}</code><CopyBtn text={v} /></div>
                </div>
              ))}
            </div>
            {result.expiresAt && (
              <div className="callout callout-warn" style={{ width: '100%', textAlign: 'left' }}>
                <div className="callout-title"><Icon name="alert" size={14} /> Masa trial {result.trialDays} hari</div>
                <p style={{ margin: 0 }}>Panel aktif sampai <b>{fmt(result.expiresAt)}</b>. Setelah itu panel dan akun dihapus otomatis. Kamu bisa minta perpanjangan di menu Panel saya.</p>
              </div>
            )}
            <div className="callout" style={{ width: '100%', textAlign: 'left' }}>
              <div className="callout-title"><Icon name="info" size={14} /> Rules panel</div>
              <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{result.rules}</p>
            </div>
            <div className="claim-success-actions">
              <CopyBtn text={result.message} label="Salin semua" className="btn-primary" />
              <a className="btn-ghost" href={result.domain} target="_blank" rel="noreferrer"><Icon name="globe" /> Buka panel</a>
              <Link to="/panel-saya" className="btn-ghost"><Icon name="user" /> Panel saya</Link>
            </div>
          </div>
        ) : info && !info.open ? (
          <div className="empty">
            <div className="empty-icon"><Icon name="lock" size={26} /></div>
            <h3>Pembuatan panel ditutup</h3>
            <p>Slot sedang tidak tersedia. Coba lagi nanti.</p>
          </div>
        ) : info?.hasPanel ? (
          <div className="empty">
            <div className="empty-icon"><Icon name="shield" size={26} /></div>
            <h3>IP kamu sudah punya panel</h3>
            <p>
              Satu IP hanya bisa membuat satu panel.
              {info.myExpiresAt ? ` Panelmu aktif sampai ${fmt(info.myExpiresAt)}, setelah itu dihapus otomatis.` : ' Hubungi admin kalau butuh bantuan.'}
            </p>
            <Link to="/panel-saya" className="btn-primary"><Icon name="user" /> Lihat panel saya</Link>
          </div>
        ) : block ? (
          <div className="empty">
            <div className="empty-icon"><Icon name={block[0]} size={26} /></div>
            <h3>{block[1]}</h3>
            <p>
              {block[2]}
              {info.blocked === 'cooldown' && info.until ? ` Kamu bisa claim lagi setelah ${fmt(info.until)}.` : ''}
            </p>
          </div>
        ) : (
          <form className="panel panel-form" onSubmit={submit}>
            <label className="field">
              <span className="field-label"><Icon name="user" /> Nama</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="contoh: momon" maxLength={24} autoComplete="off" required />
              <small className="muted">4-16 karakter, huruf kecil dan angka. Simbol dibuang otomatis.</small>
            </label>

            <label className="field">
              <span className="field-label"><Icon name="layers" /> Egg</span>
              <select value={egg} onChange={(e) => setEgg(e.target.value)} required>
                {(info?.eggs || []).map((x) => (
                  <option key={x.id} value={x.id}>{x.name} (ID {x.id})</option>
                ))}
              </select>
            </label>

            {valid && (
              <div className="email-preview-box">
                <Icon name="mail" size={18} />
                <div>
                  <span className="muted">Email dan password otomatis</span>
                  <span className="email-preview-value">{clean}@{info?.emailDomain}</span>
                  <span className="email-preview-value">{clean}****</span>
                </div>
              </div>
            )}

            {info?.trialDays > 0 && (
              <div className="callout callout-warn">
                <div className="callout-title"><Icon name="alert" size={14} /> Trial {info.trialDays} hari</div>
                <p style={{ margin: 0 }}>Panel dan akun dihapus otomatis setelah masa trial habis.</p>
              </div>
            )}

            {err && <div className="alert"><Icon name="alert" /> {err}</div>}
            <button className="btn-primary full" disabled={busy || !valid || !info}>
              {busy ? <><Icon name="refresh" className="spin" /> Membuat panel...</> : <><Icon name="server" /> Buat panel</>}
            </button>
          </form>
        )}

        {!result && err && !info && <div className="alert" style={{ marginTop: 12 }}><Icon name="alert" /> {err}</div>}

        <div className="text-c">
          <Link to="/" className="auth-back"><Icon name="chevron" size={14} className="rot-left" /> Kembali ke beranda</Link>
        </div>
      </div>
    </div>
  );
}
