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

import { useEffect, useRef } from 'react';

const listeners = new Set();
let es = null;
let timer = null;
let opened = false;

function fire() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    listeners.forEach((fn) => { try { fn(); } catch { /* abaikan */ } });
  }, 250);
}

function connect() {
  if (es || typeof EventSource === 'undefined') return;
  es = new EventSource('/api/stream');
  es.addEventListener('sync', fire);
  es.onopen = () => {
    if (opened) fire();
    opened = true;
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') fire();
  });
}

export function useLive(fn) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    connect();
    const h = () => ref.current();
    listeners.add(h);
    return () => { listeners.delete(h); };
  }, []);
}
