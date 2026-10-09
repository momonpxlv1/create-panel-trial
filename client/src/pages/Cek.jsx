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

const fmt = (d) => new Date(d).toLocaleString('id-ID');
const pad = (n) => String(n).padStart(2, '0');

function Countdown({ created, expires }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!expires) {
    return (
      <div className="cd-state">
        <Icon name="clock" size={22} />
        <div><b>Tanpa batas waktu</b><div className="muted">Panel ini belum punya masa aktif.</div></div>
      </div>
    );
  }
  const ms = Date.parse(expires) - now;
  if (ms <= 0) {
    return (
      <div className="cd-state cd-end">
        <Icon name="alert" size={22} />
        <div><b>Masa aktif habis</b><div className="muted">Panel akan segera dihapus otomatis.</div></div>
      </div>
    );
  }
  const s = Math.floor(ms / 1000);
  const parts = [['Hari', Math.floor(s / 86400)], ['Jam', Math.floor((s % 86400) / 3600)], ['Menit', Math.floor((s % 3600) / 60)], ['Detik', s % 60]];
  const total = Date.parse(expires) - Date.parse(created);
  const pct = Math.max(0, Math.min(100, (ms / total) * 100));
  return (
    <div>
      <div className="cd-grid">
        {parts.map(([l, v]) => (
          <div className="cd-box" key={l}><div className="cd-num">{pad(v)}</div><div className="cd-lab">{l}</div></div>
        ))}
      </div>
      <div className="cd-bar"><div className="cd-fill" style={{ width: `${pct}%` }} /></div>
      <div className="muted" style={{ fontSize: 12 }}>Berakhir pada {fmt(expires)}</div>
    </div>
  );
}

export default function Cek() {
  const [st, setSt] = useState(null);
  const [err, setErr] = useState('');
  const [name, setName] = useState('');
  const [login, setLogin] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/api/panel/mine').then(setSt).catch((e) => setErr(e.message)); }, []);

  async function reveal(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try { setLogin(await api('/api/panel/mine', { method: 'POST', body: { name } })); }
    catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  }

  const rows = st?.found ? [
    ['Panel', st.maskedName], ['Egg', st.eggName],
    ['Status', st.suspended ? 'Disuspend' : 'Aktif'], ['Dibuat', fmt(st.createdAt)],
  ] : [];

  return (
    <div className="claim-page">
      <div className="claim-head">
        <div className="claim-head-icon"><Icon name="clock" size={26} /></div>
        <div className="eyebrow">Cek panel</div>
        <h1>Status panel kamu</h1>
        <p className="muted">Dideteksi otomatis dari IP kamu.</p>
      </div>

      <div className="create-wrap">
        {!st && !err && <div className="muted text-c">Memuat...</div>}
        {st && !st.found && (
          <div className="empty">
            <div className="empty-icon"><Icon name="server" size={26} /></div>
            <h3>Belum ada panel di IP ini</h3>
            <p>Kamu belum membuat panel, atau memakai jaringan yang berbeda.</p>
            <Link to="/claim" className="btn-primary"><Icon name="plus" /> Buat panel</Link>
          </div>
        )}

        {st?.found && (
          <>
            <div className="panel">
              <div className="cek-list">
                {rows.map(([k, v]) => (
                  <div className="cek-row" key={k}><span className="muted">{k}</span><b>{v}</b></div>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="panel-head"><h2><Icon name="clock" size={16} /> Sisa waktu</h2></div>
              <Countdown created={st.createdAt} expires={st.expiresAt} />
            </div>
          </>
        )}

        {st?.found && !login && (
          <form className="panel panel-form" onSubmit={reveal}>
            <label className="field">
              <span className="field-label"><Icon name="lock" /> Lihat data login</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ketik nama panel kamu" autoComplete="off" required />
              <small className="muted">Ketik nama panel lengkap untuk menampilkan username dan password.</small>
            </label>
            {err && <div className="alert"><Icon name="alert" /> {err}</div>}
            <button className="btn-primary full" disabled={busy || !name.trim()}>
              <Icon name="eye" /> {busy ? 'Memeriksa...' : 'Tampilkan login'}
            </button>
          </form>
        )}

        {login && (
          <div className="claim-success">
            <div className="cred-grid">
              {[['Username', login.username], ['Password', login.password], ['Gmail', login.email], ['Domain panel', login.domain]].map(([k, v]) => (
                <div className="cred-box" key={k}>
                  <div className="cred-label">{k}</div>
                  <div className="cred-value"><code>{v}</code><CopyBtn text={v} /></div>
                </div>
              ))}
            </div>
            <div className="callout" style={{ width: '100%', textAlign: 'left' }}>
              <div className="callout-title"><Icon name="info" size={14} /> Rules panel</div>
              <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{login.rules}</p>
            </div>
            <div className="claim-success-actions">
              <CopyBtn text={login.message} label="Salin semua" className="btn-primary" />
              <a className="btn-ghost" href={login.domain} target="_blank" rel="noreferrer"><Icon name="globe" /> Buka panel</a>
            </div>
          </div>
        )}

        {err && !st && <div className="alert" style={{ marginTop: 12 }}><Icon name="alert" /> {err}</div>}

        <div className="text-c">
          <Link to="/" className="auth-back"><Icon name="chevron" size={14} className="rot-left" /> Kembali ke beranda</Link>
        </div>
      </div>
    </div>
  );
}
