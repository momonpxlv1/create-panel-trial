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

import { useCallback, useEffect, useState } from 'react';
import Icon from '../Icon.jsx';
import { Link } from '../router.jsx';
import { api } from '../api.js';
import { useLive } from "../live.js";
import { fmt, remaining, useTick } from '../ui.jsx';

const mb = (b) => (b / 1024 / 1024).toFixed(0) + ' MB';

export default function MyPanel() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [st, setSt] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState('');

  const load = useCallback(() => api('/api/me').then(setD).catch((e) => setErr(e.message)), []);
  const loadStatus = useCallback(async () => {
    setSt({ loading: true });
    try { setSt(await api('/api/me/status')); } catch (e) { setSt({ err: e.message }); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useLive(load);
  useTick(30000);
  const has = !!d?.panel;
  useEffect(() => { if (has) loadStatus(); }, [has, loadStatus]);

  // refresh tiap 30 detik supaya keputusan admin langsung terlihat
  useEffect(() => {
    const t = setInterval(() => { load(); loadStatus(); }, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function request() {
    setBusy(true); setErr(''); setOk('');
    try {
      await api('/api/me/extend', { method: 'POST', body: { message: msg } });
      setOk('Permintaan terkirim, tunggu persetujuan admin. Hasilnya muncul di halaman ini dan di menu Notifikasi.');
      setMsg('');
      load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function dismiss() {
    try { await api('/api/me/extend/dismiss', { method: 'POST' }); load(); }
    catch (e) { setErr(e.message); }
  }

  if (!d) return <div className="status-page muted">{err || 'Memuat...'}</div>;

  if (!d.panel) {
    return (
      <div className="status-page">
        <div className="empty">
          <div className="empty-icon"><Icon name="server" size={26} /></div>
          <h3>Kamu belum punya panel</h3>
          <p>Panel dikenali lewat IP kamu. Claim dulu untuk mulai.</p>
          <Link to="/claim" className="btn-primary"><Icon name="server" /> Claim panel</Link>
        </div>
      </div>
    );
  }

  const p = d.panel;
  const r = remaining(p.expiresAt);
  const rs = p.extResult;
  const approved = rs?.status === 'approved';

  return (
    <div className="status-page">
      <div className="status-head">
        <div className="status-eyebrow">Panel saya</div>
        <h1>{p.username}</h1>
      </div>

      <div className="status-card">
        {rs && (
          <div className={`callout ${approved ? 'callout-success' : 'callout-danger'}`}>
            <div className="callout-title">
              <Icon name={approved ? 'check' : 'x'} size={14} /> {approved ? 'Perpanjangan disetujui' : 'Perpanjangan ditolak'}
            </div>
            <p style={{ margin: '0 0 6px' }}>
              {approved
                ? (rs.until
                  ? `${rs.days ? `Masa aktif ditambah ${rs.days} hari. ` : ''}Sekarang panel aktif sampai ${fmt(rs.until)}.`
                  : 'Panel kamu sekarang permanen, tidak ada batas waktu.')
                : (rs.reason || 'Permintaan perpanjangan belum bisa disetujui admin.')}
            </p>
            <small className="muted">{fmt(rs.at)}{!approved ? ' - kamu bisa mengajukan lagi.' : ''}</small>
            <div className="panel-actions" style={{ marginTop: 10 }}>
              <button className="btn-ghost" onClick={dismiss}><Icon name="check" size={14} /> Mengerti</button>
              <Link to="/notifikasi" className="btn-ghost"><Icon name="bell" size={14} /> Lihat notifikasi</Link>
            </div>
          </div>
        )}

        <dl className="kv-list">
          <div><dt>Username</dt><dd className="mono">{p.username}</dd></div>
          <div><dt>Gmail</dt><dd className="mono">{p.email}</dd></div>
          <div><dt>Egg</dt><dd>{p.eggName}</dd></div>
          <div><dt>Dibuat</dt><dd>{fmt(p.createdAt)}</dd></div>
          <div><dt>Berakhir</dt><dd>{p.expiresAt ? fmt(p.expiresAt) : 'Permanen'}</dd></div>
          <div><dt>Sisa waktu</dt><dd><span className={`pill ${r.cls}`}>{r.text}</span></dd></div>
        </dl>

        <div className="callout">
          <div className="callout-title"><Icon name="activity" size={14} /> Status server</div>
          {!st || st.loading ? 'Memuat...' : st.err ? st.err : (
            <>
              <div>State: <b>{st.state}</b></div>
              <div>CPU: <b>{Number(st.cpu).toFixed(1)}%</b></div>
              <div>RAM: <b>{mb(st.memory)}</b> - Disk: <b>{mb(st.disk)}</b></div>
            </>
          )}
        </div>

        {p.expiresAt && d.allowExtend && (
          p.extReq ? (
            <div className="callout callout-warn">
              <div className="callout-title"><Icon name="clock" size={14} /> Menunggu admin</div>
              Permintaan perpanjangan dikirim {fmt(p.extReq.at)}.
              {p.extReq.message ? <> Pesanmu: <b>{p.extReq.message}</b></> : null}
            </div>
          ) : (
            <div className="panel-form">
              <label className="field">
                <span className="field-label"><Icon name="send" /> Minta perpanjangan (opsional: alasan)</span>
                <input value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={200} placeholder="contoh: bot masih dipakai" />
              </label>
              <button className="btn-primary full" onClick={request} disabled={busy}>
                {busy ? 'Mengirim...' : <><Icon name="clock" /> Minta perpanjangan</>}
              </button>
            </div>
          )
        )}

        {err && <div className="alert"><Icon name="alert" /> {err}</div>}
        {ok && <div className="alert alert-ok"><Icon name="check" /> {ok}</div>}

        <div className="panel-actions">
          <a className="btn-ghost" href={d.domain} target="_blank" rel="noreferrer"><Icon name="globe" /> Buka panel</a>
        </div>
        <p className="muted">Lupa password? Hubungi admin.</p>
      </div>
    </div>
  );
}
