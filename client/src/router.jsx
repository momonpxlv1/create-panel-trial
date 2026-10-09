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

const clean = () => location.pathname.replace(/\/+$/, '') || '/';

export function navigate(to) {
  if (clean() !== to) {
    history.pushState({}, '', to);
    window.dispatchEvent(new Event('navchange'));
  }
  window.scrollTo(0, 0);
}

export function usePath() {
  const [p, setP] = useState(clean());
  useEffect(() => {
    const f = () => setP(clean());
    window.addEventListener('popstate', f);
    window.addEventListener('navchange', f);
    return () => {
      window.removeEventListener('popstate', f);
      window.removeEventListener('navchange', f);
    };
  }, []);
  return p;
}

export function Link({ to, className, children, ...rest }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
