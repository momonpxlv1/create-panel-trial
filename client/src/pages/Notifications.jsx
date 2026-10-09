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

import Icon from '../Icon.jsx';
import { Link } from '../router.jsx';
import { fmt } from '../ui.jsx';

const KIND = {
  info: ['info', 'Info'],
  update: ['refresh', 'Update'],
  promo: ['zap', 'Promo'],
  warning: ['alert', 'Penting'],
};

export default function Notifications({ items }) {
  return (
    <div className="notif-page">
      <div className="notif-page-head">
        <div className="notif-page-icon"><Icon name="bell" size={26} /></div>
        <div>
          <div className="eyebrow">Notifikasi</div>
          <h1>Pesan dari admin</h1>
          <p className="muted">Info, update, dan pengumuman terbaru.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><Icon name="bell" size={26} /></div>
          <h3>Belum ada notifikasi</h3>
          <p>Pesan dari admin akan muncul di sini.</p>
        </div>
      ) : (
        <div className="notif-list">
          {items.map((n) => {
            const [ic, label] = KIND[n.kind] || KIND.info;
            const pinned = n.pinned && !n.personal;
            return (
              <div className={`notif-item ${pinned ? 'pinned' : ''}`} key={n.id}>
                <div className={`notif-item-icon ${n.kind}`}><Icon name={ic} /></div>
                <div className="notif-item-body">
                  <div className="notif-item-head">
                    <span className={`notif-kind-tag ${n.kind}`}>{label}</span>
                    {n.personal && <span className="notif-kind-tag info">Untuk kamu</span>}
                    {pinned && <span className="notif-pin-tag"><Icon name="pin" size={10} /> Disematkan</span>}
                    <span className="notif-item-time"><Icon name="clock" size={11} /> {fmt(n.createdAt)}</span>
                  </div>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="notif-back"><Link to="/" className="btn-ghost">Kembali ke beranda</Link></div>
    </div>
  );
}
