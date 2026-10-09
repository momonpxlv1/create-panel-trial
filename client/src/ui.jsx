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
import Icon from './Icon.jsx';

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
}

export function CopyBtn({ text, label, className = 'cred-copy' }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={className}
      title="Salin"
      onClick={async () => { await copyText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
    >
      <Icon name={ok ? 'check' : 'copy'} size={13} />
      {label ? <span>{ok ? 'Tersalin' : label}</span> : null}
    </button>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <button type="button" className={`toggle-switch ${on ? 'on' : 'off'}`} onClick={() => onChange(!on)} aria-pressed={on}>
      <span className="toggle-knob" />
    </button>
  );
}

export default function Modal({ eyebrow, title, onClose, children }) {
  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-body">
        <div className="modal-head">
          <div>
            {eyebrow && <div className="modal-eyebrow">{eyebrow}</div>}
            <h2>{title}</h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Tutup"><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}



export const fmt = (d) => new Date(d).toLocaleString('id-ID');

export function remaining(exp) {
  if (!exp) return { text: 'Permanen', cls: 'pill-on' };
  const ms = Date.parse(exp) - Date.now();
  if (ms <= 0) return { text: 'Habis', cls: 'pill-off' };
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return { text: d > 0 ? `${d} hari ${h} jam` : `${h} jam`, cls: ms < 86400000 ? 'pill-off' : 'pill-on' };
}

export function useTick(ms = 30000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}
