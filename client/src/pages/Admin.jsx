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
import Modal, { CopyBtn, Toggle, fmt, remaining, useTick } from '../ui.jsx';
import { api } from '../api.js';
import { useLive } from "../live.js";

const TABS = [
  ['config', 'Konfigurasi', 'settings'],
  ['panels', 'Panel', 'server'],
  ['notifs', 'Notifikasi', 'megaphone'],
  ['access', 'Akses', 'ban'],
  ['logs', 'Log', 'list'],
];
const mb = (b) => (b / 1024 / 1024).toFixed(0) + ' MB';

export default function Admin({ onLogout }) {
  const [tab, setTab] = useState('panels');
  const call = useCallback(async (path, opt) => {
    try { return await api(path, { ...opt, auth: true }); }
    catch (e) { if (e.status === 401) onLogout(); throw e; }
  }, [onLogout]);

  return (
    <div>
      <div className="dashboard-head">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>Dashboard</h1>
          <div className="muted">Atur panel, pantau log, dan kelola user.</div>
        </div>
        <button className="btn-danger" onClick={onLogout}><Icon name="logout" /> Keluar</button>
      </div>

      <div className="tabs">
        {TABS.map(([k, l, ic]) => (
          <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            <Icon name={ic} />{l}
          </button>
        ))}
      </div>

      {tab === 'config' && <Config call={call} />}
      {tab === 'panels' && <Panels call={call} />}
      {tab === 'notifs' && <Notifs call={call} />}
      {tab === 'access' && <Access call={call} />}
      {tab === 'logs' && <Logs call={call} />}
    </div>
  );
}

function Config({ call }) {
  const [s, setS] = useState(null);
  const [plta, setPlta] = useState('');
  const [pltc, setPltc] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState(null);

  useEffect(() => { call('/api/admin/settings').then(setS).catch((e) => setMsg({ err: e.message })); }, [call]);
  if (!s) return <div className="muted">{msg?.err || 'Memuat...'}</div>;

  const set = (k, v) => setS((p) => ({ ...p, [k]: v }));
  const setEgg = (i, k, v) => set('eggs', s.eggs.map((e, j) => (j === i ? { ...e, [k]: v } : e)));

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const body = { ...s };
      if (plta) body.plta = plta; else delete body.plta;
      if (pltc) body.pltc = pltc; else delete body.pltc;
      const r = await call('/api/admin/settings', { method: 'PUT', body });
      setS(r); setPlta(''); setPltc('');
      setMsg({ ok: 'Konfigurasi disimpan' });
    } catch (e) { setMsg({ err: e.message }); }
    finally { setBusy(false); }
  }
  async function runTest() {
    setTest({ loading: true });
    try { setTest(await call('/api/admin/test', { method: 'POST' })); }
    catch (e) { setTest({ err: e.message }); }
  }

  const num = (k, label) => (
    <label className="field">
      <span className="field-label">{label}</span>
      <input type="number" value={s[k]} onChange={(e) => set(k, e.target.value)} />
    </label>
  );

  return (
    <>
      <div className="panel">
        <div className="panel-head"><h2>Koneksi panel</h2></div>
        <div className="panel-form">
          <label className="field">
            <span className="field-label"><Icon name="globe" /> Domain panel</span>
            <input value={s.domain} onChange={(e) => set('domain', e.target.value)} placeholder="https://panel.domainmu.com" />
          </label>
          <div className="row">
            <label className="field">
              <span className="field-label"><Icon name="key" /> PLTA (Application API)</span>
              <input type="password" value={plta} onChange={(e) => setPlta(e.target.value)} placeholder={s.pltaSet ? `Tersimpan ${s.pltaHint} (kosongkan jika tidak diubah)` : 'ptla_...'} autoComplete="off" />
            </label>
            <label className="field">
              <span className="field-label"><Icon name="key" /> PLTC (Client API)</span>
              <input type="password" value={pltc} onChange={(e) => setPltc(e.target.value)} placeholder={s.pltcSet ? `Tersimpan ${s.pltcHint} (kosongkan jika tidak diubah)` : 'ptlc_...'} autoComplete="off" />
            </label>
          </div>
          <div className="row">
            <label className="field">
              <span className="field-label"><Icon name="mail" /> Domain email otomatis</span>
              <input value={s.emailDomain} onChange={(e) => set('emailDomain', e.target.value)} placeholder="momonpxl.my.id" />
            </label>
            {num('locationId', 'ID Location')}
          </div>
          <div className="panel-actions">
            <button className="btn-ghost" onClick={runTest}><Icon name="activity" /> Tes koneksi</button>
          </div>
          {test && (
            <div className="callout">
              {test.loading ? 'Menguji...' : test.err ? test.err : (
                <>
                  <div>PLTA: <b>{test.plta}</b>{test.eggs ? ` (${test.eggs} egg terbaca)` : ''}</div>
                  <div>PLTC: <b>{test.pltc}</b></div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Egg</h2></div>
        <div className="panel-form">
          {s.eggs.map((e, i) => (
            <div className="row align-center" key={i}>
              <label className="field field-narrow">
                <span className="field-label">ID</span>
                <input type="number" value={e.id} onChange={(ev) => setEgg(i, 'id', ev.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Nama tampilan</span>
                <input value={e.label} onChange={(ev) => setEgg(i, 'label', ev.target.value)} />
              </label>
              <button className="btn-icon" onClick={() => set('eggs', s.eggs.filter((_, j) => j !== i))} title="Hapus"><Icon name="trash" /></button>
            </div>
          ))}
          <div className="panel-actions">
            <button className="btn-ghost" onClick={() => set('eggs', [...s.eggs, { id: '', label: '' }])}><Icon name="plus" /> Tambah egg</button>
          </div>
          <div className="row">
            {num('defaultEgg', 'Egg default (ID)')}
            <div className="field">
              <span className="field-label">Tampilkan semua egg dari panel</span>
              <Toggle on={s.showAllEggs} onChange={(v) => set('showAllEggs', v)} />
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Resource per panel</h2></div>
        <div className="panel-form">
          <div className="row">{num('memory', 'RAM (MB)')}{num('disk', 'Disk (MB)')}{num('cpu', 'CPU (%)')}</div>
          <div className="row">{num('swap', 'Swap (MB)')}{num('io', 'IO')}{num('databases', 'Database')}{num('backups', 'Backup')}{num('allocations', 'Allocation')}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Trial, cooldown, perpanjangan</h2></div>
        <div className="panel-form">
          <div className="row">
            {num('trialDays', 'Masa trial (hari)')}
            {num('cooldownDays', 'Cooldown claim ulang (hari)')}
          </div>
          <small className="muted">
            Masa trial 0 = tanpa batas, berlaku untuk panel baru saja. Cooldown dihitung sejak panel berakhir atau dihapus: 0 = boleh claim lagi langsung, -1 = hanya 1x seumur hidup per IP.
          </small>
          <div className="field">
            <span className="field-label">User boleh minta perpanjangan</span>
            <Toggle on={s.allowExtend} onChange={(v) => set('allowExtend', v)} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Rules dan akses</h2></div>
        <div className="panel-form">
          <label className="field">
            <span className="field-label">Rules panel (tampil di hasil create)</span>
            <textarea rows={5} value={s.rules} onChange={(e) => set('rules', e.target.value)} />
          </label>
          <div className="field">
            <span className="field-label">Pembuatan panel dibuka</span>
            <Toggle on={s.open} onChange={(v) => set('open', v)} />
          </div>
        </div>
      </div>

      {msg?.err && <div className="alert"><Icon name="alert" /> {msg.err}</div>}
      {msg?.ok && <div className="alert alert-ok"><Icon name="check" /> {msg.ok}</div>}
      <div className="panel-actions" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan konfigurasi'}</button>
      </div>
    </>
  );
}

function Panels({ call }) {
  const [rows, setRows] = useState(null);
  const [detail, setDetail] = useState(null);
  const [del, setDel] = useState(null);
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [fs, setFs] = useState('all');
  const [fe, setFe] = useState('all');
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');

  const load = useCallback(() => call('/api/admin/panels').then((r) => { setRows(r); setDetail((d) => (d ? r.find((x) => x.id === d.id) || null : d)); }).catch((e) => setErr(e.message)), [call]);
  useEffect(() => { load(); }, [load]);
  useLive(load);

  useTick(30000);
  const now = Date.now();
  const stat = (p) => {
    if (!p.expiresAt) return 'permanent';
    const ms = Date.parse(p.expiresAt) - now;
    return ms <= 0 ? 'expired' : ms < 86400000 ? 'soon' : 'active';
  };
  const stats = rows ? {
    total: rows.length,
    active: rows.filter((p) => ['active', 'permanent'].includes(stat(p))).length,
    soon: rows.filter((p) => stat(p) === 'soon').length,
    expired: rows.filter((p) => stat(p) === 'expired').length,
    req: rows.filter((p) => p.extReq).length,
  } : null;
  const eggs = rows ? [...new Set(rows.map((p) => p.eggName))] : [];
  const shown = (rows || []).filter((p) => {
    if (q && !`${p.username} ${p.ip} ${p.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (fe !== 'all' && p.eggName !== fe) return false;
    if (fs === 'all') return true;
    if (fs === 'req') return !!p.extReq;
    return stat(p) === fs;
  });

  async function loadStatus(p) {
    setStatus({ loading: true });
    try { setStatus(await call(`/api/admin/panels/${p.id}/status`)); }
    catch (e) { setStatus({ err: e.message }); }
  }
  async function doDelete() {
    setBusy(true);
    try { await call(`/api/admin/panels/${del.id}`, { method: 'DELETE' }); setDel(null); load(); }
    catch (e) { setErr(e.message); setDel(null); }
    finally { setBusy(false); }
  }
  async function extend(p, body) {
    setErr('');
    try { setDetail(await call(`/api/admin/panels/${p.id}/extend`, { method: 'POST', body })); load(); }
    catch (e) { setErr(e.message); }
  }
  async function decide(p, approve) {
    setErr('');
    try {
      setDetail(await call(`/api/admin/panels/${p.id}/request`, { method: 'POST', body: { approve, days: Number(days), reason } }));
      setReason('');
      load();
    } catch (e) { setErr(e.message); }
  }
  async function sweep() {
    setErr(''); setOk('');
    try {
      const r = await call('/api/admin/sweep', { method: 'POST' });
      setOk(`Selesai: ${r.removed} dihapus, ${r.failed} gagal`);
      load();
    } catch (e) { setErr(e.message); }
  }

  return (
    <>
      {stats && (
        <div className="stat-cards">
          {[['Total', stats.total, ''], ['Aktif', stats.active, ''], ['Hampir habis', stats.soon, 'warn'], ['Kadaluarsa', stats.expired, 'crit'], ['Minta perpanjang', stats.req, 'warn']].map(([l, v, c]) => (
            <div className={`stat-card ${c}`} key={l}><strong>{v}</strong><span>{l}</span></div>
          ))}
        </div>
      )}

      {err && !detail && <div className="alert" style={{ marginBottom: 12 }}><Icon name="alert" /> {err}</div>}
      {ok && <div className="alert alert-ok" style={{ marginBottom: 12 }}><Icon name="check" /> {ok}</div>}

      <div className="toolbar">
        <div className="search-bar">
          <Icon name="search" size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, IP, email" />
        </div>
        <select className="select-sm" value={fs} onChange={(e) => setFs(e.target.value)}>
          <option value="all">Semua status</option>
          <option value="active">Aktif</option>
          <option value="soon">Hampir habis</option>
          <option value="expired">Kadaluarsa</option>
          <option value="permanent">Permanen</option>
          <option value="req">Minta perpanjang</option>
        </select>
        <select className="select-sm" value={fe} onChange={(e) => setFe(e.target.value)}>
          <option value="all">Semua egg</option>
          {eggs.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <button className="btn-ghost" onClick={load}><Icon name="refresh" /> Muat ulang</button>
        <button className="btn-ghost" onClick={sweep}><Icon name="trash" /> Hapus kadaluarsa</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Nama panel</th><th>IP address</th><th>Egg</th><th>Sisa waktu</th><th>Dibuat</th><th /></tr></thead>
          <tbody>
            {!rows && <tr><td colSpan={6} className="cell-empty">Memuat...</td></tr>}
            {rows && shown.length === 0 && <tr><td colSpan={6} className="cell-empty">Tidak ada panel</td></tr>}
            {shown.map((p) => {
              const r = remaining(p.expiresAt);
              return (
                <tr key={p.id}>
                  <td><b>{p.username}</b>{p.extReq && <> <span className="pill pill-on">Minta perpanjang</span></>}</td>
                  <td className="mono">{p.ip}</td>
                  <td>{p.eggName}</td>
                  <td><span className={`pill ${r.cls}`}>{r.text}</span></td>
                  <td>{fmt(p.createdAt)}</td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn-icon" title="Detail" onClick={() => { setDetail(p); setStatus(null); setErr(''); }}><Icon name="eye" /></button>
                      <button className="btn-icon" title="Hapus" onClick={() => setDel(p)}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detail && (
        <Modal eyebrow="Detail panel" title={detail.username} onClose={() => setDetail(null)}>
          <div className="cred-grid" style={{ gridTemplateColumns: '1fr' }}>
            {[['Username', detail.username], ['Password', detail.password], ['Gmail', detail.email], ['IP address', detail.ip]].map(([k, v]) => (
              <div className="cred-box" key={k}>
                <div className="cred-label">{k}</div>
                <div className="cred-value"><code>{v}</code><CopyBtn text={v} /></div>
              </div>
            ))}
            <div className="cred-box">
              <div className="cred-label">Masa aktif</div>
              <div className="cred-value"><code>{detail.expiresAt ? `sampai ${fmt(detail.expiresAt)}` : 'Permanen'}</code></div>
            </div>
          </div>

          {err && <div className="alert"><Icon name="alert" /> {err}</div>}

          {detail.extReq && (
            <div className="callout callout-warn">
              <div className="callout-title"><Icon name="clock" size={14} /> Permintaan perpanjangan</div>
              <p style={{ margin: '0 0 10px' }}>
                Dikirim {fmt(detail.extReq.at)}.{detail.extReq.message ? <> Pesan: <b>{detail.extReq.message}</b></> : ' Tanpa pesan.'}
              </p>
              <div className="row align-center">
                <label className="field field-narrow">
                  <span className="field-label">Tambah hari</span>
                  <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label">Alasan jika ditolak</span>
                  <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} />
                </label>
              </div>
              <div className="panel-actions" style={{ marginTop: 10 }}>
                <button className="btn-primary" onClick={() => decide(detail, true)}><Icon name="check" /> Setujui</button>
                <button className="btn-danger" onClick={() => decide(detail, false)}><Icon name="x" /> Tolak</button>
              </div>
            </div>
          )}

          <div className="panel-actions">
            <button className="btn-ghost" onClick={() => extend(detail, { days: 7 })}><Icon name="plus" /> 7 hari</button>
            <button className="btn-ghost" onClick={() => extend(detail, { days: 30 })}><Icon name="plus" /> 30 hari</button>
            <button className="btn-ghost" onClick={() => extend(detail, { permanent: true })}><Icon name="shield" /> Permanen</button>
          </div>
          <div className="panel-actions">
            <button className="btn-ghost" onClick={() => loadStatus(detail)}><Icon name="activity" /> Cek status server</button>
          </div>
          {status && (
            <div className="callout">
              {status.loading ? 'Memuat...' : status.err ? status.err : (
                <>
                  <div>State: <b>{status.state}</b></div>
                  <div>CPU: <b>{Number(status.cpu).toFixed(1)}%</b></div>
                  <div>RAM: <b>{mb(status.memory)}</b> - Disk: <b>{mb(status.disk)}</b></div>
                </>
              )}
            </div>
          )}
        </Modal>
      )}

      {del && (
        <Modal eyebrow="Konfirmasi" title="Hapus panel?" onClose={() => setDel(null)}>
          <div className="callout callout-danger">
            Server dan user <b>{del.username}</b> akan dihapus dari Pterodactyl dan dari web. Cooldown claim IP {del.ip} ikut berjalan, bisa direset di tab Akses.
          </div>
          <div className="panel-actions">
            <button className="btn-danger" onClick={doDelete} disabled={busy}><Icon name="trash" /> {busy ? 'Menghapus...' : 'Ya, hapus'}</button>
            <button className="btn-ghost" onClick={() => setDel(null)}>Batal</button>
          </div>
        </Modal>
      )}
    </>
  );
}

const KIND_LABEL = { info: 'Info', update: 'Update', promo: 'Promo', warning: 'Penting' };

function Notifs({ call }) {
  const [list, setList] = useState(null);
  const [panels, setPanels] = useState([]);
  const [f, setF] = useState({ kind: 'info', title: '', body: '', pinned: false, target: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    call('/api/admin/notifs').then(setList).catch((e) => setErr(e.message));
    call('/api/admin/panels').then(setPanels).catch(() => {});
  }, [call]);
  useEffect(() => { load(); }, [load]);
  useLive(load);

  async function send(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await call('/api/admin/notifs', { method: 'POST', body: f });
      setF({ ...f, title: '', body: '', pinned: false });
      load();
    } catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  }
  const togglePin = async (n) => { await call(`/api/admin/notifs/${n.id}`, { method: 'PUT', body: { pinned: !n.pinned } }); load(); };
  const remove = async (n) => { await call(`/api/admin/notifs/${n.id}`, { method: 'DELETE' }); load(); };

  return (
    <>
      <form className="panel panel-form" onSubmit={send}>
        <div className="panel-head"><h2>Kirim notifikasi</h2></div>
        <div className="row">
          <label className="field">
            <span className="field-label">Jenis</span>
            <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
              {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Tujuan</span>
            <select value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })}>
              <option value="">Semua user</option>
              {panels.map((p) => <option key={p.id} value={p.ip}>{p.username} ({p.ip})</option>)}
            </select>
          </label>
        </div>
        <label className="field">
          <span className="field-label">Judul</span>
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={80} required />
        </label>
        <label className="field">
          <span className="field-label">Isi pesan</span>
          <textarea rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={1000} required />
        </label>
        <div className="field">
          <span className="field-label">Sematkan sebagai banner (hanya untuk semua user)</span>
          <Toggle on={f.pinned && !f.target} onChange={(v) => setF({ ...f, pinned: v })} />
        </div>
        {err && <div className="alert"><Icon name="alert" /> {err}</div>}
        <button className="btn-primary" disabled={busy}><Icon name="send" /> {busy ? 'Mengirim...' : 'Kirim'}</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Waktu</th><th>Jenis</th><th>Judul</th><th>Tujuan</th><th /></tr></thead>
          <tbody>
            {!list && <tr><td colSpan={5} className="cell-empty">Memuat...</td></tr>}
            {list?.length === 0 && <tr><td colSpan={5} className="cell-empty">Belum ada notifikasi</td></tr>}
            {list?.map((n) => (
              <tr key={n.id}>
                <td>{fmt(n.createdAt)}</td>
                <td><span className="pill pill-off">{KIND_LABEL[n.kind] || n.kind}</span></td>
                <td><b>{n.title}</b>{n.pinned && <> <span className="pill pill-on">Banner</span></>}</td>
                <td className="mono">{n.target || 'Semua'}</td>
                <td>
                  <div className="cell-actions">
                    {!n.target && (
                      <button className={`btn-icon ${n.pinned ? 'is-on' : ''}`} title="Sematkan" onClick={() => togglePin(n)}><Icon name="pin" /></button>
                    )}
                    <button className="btn-icon" title="Hapus" onClick={() => remove(n)}><Icon name="trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Access({ call }) {
  const [d, setD] = useState(null);
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(() => call('/api/admin/access').then(setD).catch((e) => setErr(e.message)), [call]);
  useEffect(() => { load(); }, [load]);
  useLive(load);

  async function block(e) {
    e.preventDefault(); setErr('');
    try { await call('/api/admin/blacklist', { method: 'POST', body: { ip, reason } }); setIp(''); setReason(''); load(); }
    catch (e2) { setErr(e2.message); }
  }
  async function unblock(x) { await call(`/api/admin/blacklist?ip=${encodeURIComponent(x)}`, { method: 'DELETE' }); load(); }
  async function resetCd(x) {
    setErr('');
    try { await call(`/api/admin/history?ip=${encodeURIComponent(x)}`, { method: 'DELETE' }); load(); }
    catch (e) { setErr(e.message); }
  }

  const state = (h) => {
    if (h.active) return { t: 'Panel aktif', c: 'pill-on' };
    if (h.lifetime) return { t: 'Terkunci 1x', c: 'pill-off' };
    if (h.until && Date.parse(h.until) > Date.now()) return { t: `Cooldown sampai ${fmt(h.until)}`, c: 'pill-off' };
    return { t: 'Bebas claim', c: 'pill-on' };
  };

  return (
    <>
      {err && <div className="alert" style={{ marginBottom: 12 }}><Icon name="alert" /> {err}</div>}

      <form className="panel panel-form" onSubmit={block}>
        <div className="panel-head"><h2>Blacklist IP</h2></div>
        <div className="row align-center">
          <label className="field">
            <span className="field-label">IP address</span>
            <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="contoh: 103.10.20.30" required />
          </label>
          <label className="field">
            <span className="field-label">Alasan</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} />
          </label>
          <button className="btn-danger"><Icon name="ban" /> Blokir</button>
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>IP diblokir</th><th>Alasan</th><th>Sejak</th><th /></tr></thead>
          <tbody>
            {!d && <tr><td colSpan={4} className="cell-empty">Memuat...</td></tr>}
            {d?.blacklist.length === 0 && <tr><td colSpan={4} className="cell-empty">Tidak ada IP diblokir</td></tr>}
            {d?.blacklist.map((b) => (
              <tr key={b.ip}>
                <td className="mono">{b.ip}</td>
                <td>{b.reason || '-'}</td>
                <td>{fmt(b.at)}</td>
                <td><div className="cell-actions"><button className="btn-ghost" onClick={() => unblock(b.ip)}>Buka blokir</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Riwayat claim (IP)</th><th>Claim terakhir</th><th>Berakhir</th><th>Status</th><th /></tr></thead>
          <tbody>
            {d?.history.length === 0 && <tr><td colSpan={5} className="cell-empty">Belum ada riwayat</td></tr>}
            {d?.history.map((h) => {
              const st = state(h);
              return (
                <tr key={h.ip}>
                  <td className="mono">{h.ip}</td>
                  <td>{h.lastClaimAt ? fmt(h.lastClaimAt) : '-'}</td>
                  <td>{h.ended ? fmt(h.ended) : '-'}</td>
                  <td><span className={`pill ${st.c}`}>{st.t}</span></td>
                  <td>
                    <div className="cell-actions">
                      {!h.active && <button className="btn-ghost" onClick={() => resetCd(h.ip)}>Reset cooldown</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Logs({ call }) {
  const [rows, setRows] = useState(null);
  const load = useCallback(() => call('/api/admin/logs').then(setRows).catch(() => setRows([])), [call]);
  useEffect(() => { load(); }, [load]);
  useLive(load);

  const cls = { create: 'pill-on', request: 'pill-on' };

  return (
    <>
      <div className="panel-actions" style={{ marginBottom: 12 }}>
        <button className="btn-ghost" onClick={load}><Icon name="refresh" /> Muat ulang</button>
        <button className="btn-ghost" onClick={async () => { await call('/api/admin/logs', { method: 'DELETE' }); load(); }}><Icon name="trash" /> Bersihkan</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Waktu</th><th>Tipe</th><th>IP</th><th>Nama</th><th>Pesan</th></tr></thead>
          <tbody>
            {!rows && <tr><td colSpan={5} className="cell-empty">Memuat...</td></tr>}
            {rows?.length === 0 && <tr><td colSpan={5} className="cell-empty">Log kosong</td></tr>}
            {rows?.map((l) => (
              <tr key={l.id}>
                <td>{fmt(l.time)}</td>
                <td><span className={`pill ${cls[l.type] || 'pill-off'}`}>{l.type}</span></td>
                <td className="mono">{l.ip}</td>
                <td>{l.name}</td>
                <td>{l.msg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
