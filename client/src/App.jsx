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

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Landing from './pages/Landing.jsx';
import Claim from './pages/Claim.jsx';
import MyPanel from './pages/MyPanel.jsx';
import Notifications from './pages/Notifications.jsx';
import Admin from './pages/Admin.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import { api, getToken, setToken } from './api.js';
import { useLive } from "./live.js";
import { Link, navigate, usePath } from './router.jsx';

const BANNER_KEY = 'mp_banner_dismiss';
const SEEN_KEY = 'mp_notif_seen';

export default function App() {
  const path = usePath();
  const [theme, setTheme] = useState(() => localStorage.getItem('mp_theme') || 'light');
  const [showLogin, setShowLogin] = useState(false);
  const [authed, setAuthed] = useState(!!getToken());
  const [notifs, setNotifs] = useState([]);
  const [seen, setSeen] = useState(() => Number(localStorage.getItem(SEEN_KEY)) || 0);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(BANNER_KEY) || '');
  const clicks = useRef({ n: 0, t: null });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mp_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (path === '/admin' && !authed) navigate('/');
  }, [path, authed]);

  const loadNotifs = useCallback(() => {
    api('/api/public/notifications').then(setNotifs).catch(() => {});
  }, []);
  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 60000);
    return () => clearInterval(t);
  }, [loadNotifs]);

  useEffect(() => {
    if (path === '/notifikasi') {
      const n = Date.now();
      localStorage.setItem(SEEN_KEY, String(n));
      setSeen(n);
    }
  }, [path, notifs]);

  useLive(loadNotifs);
  const unread = notifs.filter((n) => Date.parse(n.createdAt) > seen).length;
  const pinned = notifs.find((n) => n.pinned && !n.personal);
  const showBanner = pinned && dismissed !== pinned.id && path !== '/admin';

  function onLogo() {
    const c = clicks.current;
    c.n += 1;
    clearTimeout(c.t);
    c.t = setTimeout(() => { c.n = 0; }, 2000);
    if (c.n >= 5) {
      c.n = 0;
      if (getToken()) navigate('/admin');
      else setShowLogin(true);
    } else if (path !== '/') {
      navigate('/');
    }
  }

  function logout() {
    setToken('');
    setAuthed(false);
    navigate('/');
  }

  let page = <Landing />;
  if (path === '/claim') page = <Claim />;
  else if (path === '/panel-saya') page = <MyPanel />;
  else if (path === '/notifikasi') page = <Notifications items={notifs} />;
  else if (path === '/admin' && authed) page = <Admin onLogout={logout} />;

  return (
    <>
      {showBanner && (
        <div className="pin-banner">
          <div className="pin-banner-inner">
            <div className="pin-banner-icon"><Icon name="megaphone" size={16} /></div>
            <div className="pin-banner-text">
              <strong>{pinned.title}</strong>
              <p>{pinned.body}</p>
            </div>
            <Link to="/notifikasi" className="pin-banner-link">Lihat</Link>
            <button
              className="pin-banner-close"
              aria-label="Tutup"
              onClick={() => { sessionStorage.setItem(BANNER_KEY, pinned.id); setDismissed(pinned.id); }}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="container">
        <header className="header">
          <button className="logo-btn" onClick={onLogo} aria-label="Panel Free Momon">
            <Icon name="server" size={20} />
            <span>Panel Free Momon</span>
          </button>
          <div className="header-actions">
            {path !== '/claim' && (
              <Link to="/claim" className="btn-primary"><Icon name="server" /> Claim panel</Link>
            )}
            <Link to="/panel-saya" className="btn-icon" title="Panel saya"><Icon name="user" /></Link>
            <Link to="/notifikasi" className="btn-icon notif-btn" title="Notifikasi">
              <Icon name="bell" />
              {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
            </Link>
            {authed && (
              <Link to={path === '/admin' ? '/' : '/admin'} className="btn-ghost">
                <Icon name="shield" />{path === '/admin' ? 'Beranda' : 'Admin'}
              </Link>
            )}
            {authed && (
              <button className="btn-icon" onClick={logout} title="Keluar admin"><Icon name="logout" /></button>
            )}
            <button className="btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Ganti tema">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
          </div>
        </header>

        {page}

        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-brand"><Icon name="server" size={16} /> Panel Free Momon</div>
            <p className="footer-tagline">Panel Pterodactyl gratis. Satu IP, satu panel.</p>
            <div className="footer-bottom">Moon Studio</div>
          </div>
        </footer>
      </div>

      {showLogin && (
        <AdminLogin
          onClose={() => setShowLogin(false)}
          onSuccess={() => { setShowLogin(false); setAuthed(true); navigate('/admin'); }}
        />
      )}
    </>
  );
}
