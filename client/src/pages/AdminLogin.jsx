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

import { useState } from 'react';
import Icon from '../Icon.jsx';
import Modal from '../ui.jsx';
import { api, setToken } from '../api.js';

export default function AdminLogin({ onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await api('/api/admin/login', { method: 'POST', body: { username, password } });
      setToken(r.token);
      onSuccess();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal eyebrow="Akses terbatas" title="Login Admin" onClose={onClose}>
      <form className="panel-form" onSubmit={submit}>
        <label className="field">
          <span className="field-label"><Icon name="user" /> Username login</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
        </label>
        <label className="field">
          <span className="field-label"><Icon name="lock" /> Password login</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {err && <div className="alert"><Icon name="alert" /> {err}</div>}
        <button className="btn-primary full" disabled={busy}>{busy ? 'Memeriksa...' : 'Masuk'}</button>
      </form>
    </Modal>
  );
}
