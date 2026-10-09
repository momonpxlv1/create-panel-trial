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

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'ganti-password';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) console.warn('[WARN] JWT_SECRET belum diset, token admin hilang tiap restart');
if (!process.env.ADMIN_PASS) console.warn('[WARN] ADMIN_PASS belum diset, pakai default (JANGAN dipakai di produksi)');

const DAY = 86400000;
const SWEEP_EVERY = 60 * 1000;
const KINDS = ['info', 'update', 'promo', 'warning'];

const sseClients = new Set();
let syncTimer = null;
function scheduleSync() {
  if (syncTimer) return;
  syncTimer = setTimeout(() => {
    syncTimer = null;
    const msg = `event: sync\ndata: ${Date.now()}\n\n`;
    for (const res of sseClients) {
      try { res.write(msg); } catch { sseClients.delete(res); }
    }
  }, 150);
}

const DB_FILE = path.join(__dirname, 'data', 'db.json');
const DEFAULT_SETTINGS = {
  domain: '',
  plta: '',
  pltc: '',
  emailDomain: 'momonpxl.my.id',
  locationId: 1,
  memory: 1024,
  swap: 0,
  disk: 1024,
  io: 500,
  cpu: 100,
  databases: 1,
  backups: 1,
  allocations: 1,
  trialDays: 7,
  cooldownDays: 30,
  allowExtend: true,
  open: true,
  showAllEggs: true,
  defaultEgg: 15,
  eggs: [
    { id: 15, label: 'Bot Node.js v1' },
    { id: 16, label: 'Bot Python' },
    { id: 17, label: 'Bot Node.js v2 (auto)' },
  ],
  rules: '1. Dilarang untuk DDoS / aktivitas ilegal\n2. Dilarang mining crypto\n3. Satu IP hanya boleh satu panel\n4. Panel yang melanggar akan dihapus tanpa pemberitahuan',
};

function loadDb() {
  let raw = {};
  try { raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch {}
  return {
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
    panels: raw.panels || [],
    logs: raw.logs || [],
    notifs: raw.notifs || [],
    history: raw.history || {},
    blacklist: raw.blacklist || [],
  };
}
let db = loadDb();
function save() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
  scheduleSync();
}
function addLog(type, ip, name, msg) {
  db.logs.unshift({ id: crypto.randomUUID(), time: new Date().toISOString(), type, ip, name: name || '-', msg });
  if (db.logs.length > 500) db.logs.length = 500;
  save();
}

class HttpError extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const clientIp = (req) => {
  const ip = req.headers['cf-connecting-ip']
    || req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.socket.remoteAddress || 'unknown';
  return String(ip).replace(/^::ffff:/, '');
};
const ALNUM = 'abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rnd = (n) => Array.from({ length: n }, () => ALNUM[crypto.randomInt(ALNUM.length)]).join('');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const baseUrl = () => {
  let d = (db.settings.domain || '').trim().replace(/\/+$/, '');
  if (d && !/^https?:\/\//i.test(d)) d = 'https://' + d;
  return d;
};
const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) + ' WIB';
  } catch {
    return new Date(d).toISOString();
  }
};

function notify({ title, body, kind = 'info', pinned = false, target = null }) {
  const n = { id: crypto.randomUUID(), title, body, kind, pinned, target, createdAt: new Date().toISOString() };
  db.notifs.unshift(n);
  if (db.notifs.length > 500) db.notifs.length = 500;
  save();
  return n;
}
const notifyIp = (ip, title, body, kind = 'info') => notify({ title, body, kind, target: ip });

function markEnded(p) {
  const h = db.history[p.ip] || { lastClaimAt: p.createdAt };
  h.ended = new Date().toISOString();
  db.history[p.ip] = h;
}
function accessState(ip) {
  const s = db.settings;
  if (db.blacklist.some((b) => b.ip === ip)) return { blocked: 'blacklist' };
  const h = db.history[ip];
  if (h?.ended) {
    const cd = Number(s.cooldownDays) || 0;
    if (cd < 0) return { blocked: 'lifetime' };
    if (cd > 0) {
      const until = Date.parse(h.ended) + cd * DAY;
      if (until > Date.now()) return { blocked: 'cooldown', until: new Date(until).toISOString() };
    }
  }
  return {};
}

async function ptero(method, endpoint, body, key) {
  const base = baseUrl();
  if (!base || !key) throw new HttpError(503, 'Domain panel / API key belum dikonfigurasi');
  let res;
  try {
    res = await fetch(base + endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'Application/vnd.pterodactyl.v1+json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new HttpError(502, 'Tidak bisa menghubungi panel: ' + (e.cause?.code || e.message));
  }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    const detail = json?.errors?.[0]?.detail || `HTTP ${res.status}`;
    throw new HttpError(res.status === 422 ? 400 : res.status === 404 ? 404 : 502, `Panel: ${detail}`);
  }
  return json;
}

let eggCache = { at: 0, data: [] };
async function panelEggs(force = false) {
  if (!force && Date.now() - eggCache.at < 60000 && eggCache.data.length) return eggCache.data;
  const r = await ptero('GET', '/api/application/nests?include=eggs&per_page=100', null, db.settings.plta);
  const out = [];
  for (const n of r.data || []) {
    for (const e of n.attributes.relationships?.eggs?.data || []) {
      out.push({ id: e.attributes.id, name: e.attributes.name, nest: e.attributes.nest, nestName: n.attributes.name });
    }
  }
  eggCache = { at: Date.now(), data: out };
  return out;
}
async function publicEggs() {
  const s = db.settings;
  let all = [];
  try { all = await panelEggs(); } catch {}
  const list = s.eggs.map((e) => ({
    id: e.id,
    name: e.label || all.find((x) => x.id === e.id)?.name || `Egg ${e.id}`,
    preset: true,
  }));
  if (s.showAllEggs) {
    for (const e of all) if (!list.some((x) => x.id === e.id)) list.push({ id: e.id, name: e.name });
  }
  return list;
}

function buildMessage(p) {
  const exp = p.expiresAt ? `Masa aktif : sampai ${fmtDate(p.expiresAt)} (trial, setelah itu dihapus otomatis)\n` : '';
  return `Panel berhasil di buat!\n\nData login :\nUsername : ${p.username}\nPassword : ${p.password}\nGmail : ${p.email}\nDomain panel : ${baseUrl()}\n${exp}\nRules panel :\n${db.settings.rules}`;
}

async function removePanel(p) {
  const errors = [];
  try { await ptero('DELETE', `/api/application/servers/${p.serverId}`, null, db.settings.plta); }
  catch (e) { if (e.status !== 404) errors.push('server: ' + e.message); }
  try { await ptero('DELETE', `/api/application/users/${p.userId}`, null, db.settings.plta); }
  catch (e) { if (e.status !== 404) errors.push('user: ' + e.message); }
  return errors;
}

function applyExtend(p, days) {
  const base = Math.max(Date.now(), p.expiresAt ? Date.parse(p.expiresAt) : 0);
  p.expiresAt = new Date(base + days * DAY).toISOString();
  delete p.warned;
  delete p.sweepError;
}

let sweeping = false;
async function sweepExpired() {
  if (sweeping) return { removed: 0, failed: 0, busy: true };
  sweeping = true;
  let removed = 0;
  let failed = 0;
  try {
    const now = Date.now();

    for (const p of db.panels) {
      if (!p.expiresAt || p.warned) continue;
      const left = Date.parse(p.expiresAt) - now;
      if (left > 0 && left < DAY) {
        p.warned = true;
        notifyIp(p.ip, 'Trial hampir habis', `Panel ${p.username} aktif sampai ${fmtDate(p.expiresAt)}. Setelah itu panel dan akun dihapus otomatis. Kamu bisa minta perpanjangan di menu Panel saya.`, 'warning');
      }
    }

    const due = db.panels.filter((p) => p.expiresAt && Date.parse(p.expiresAt) <= now);
    for (const p of due) {
      const errors = await removePanel(p);
      if (errors.length) {
        failed += 1;
        const msg = errors.join('; ');
        if (p.sweepError !== msg) {
          p.sweepError = msg;
          save();
          addLog('error', p.ip, p.username, 'Gagal hapus otomatis (dicoba lagi nanti): ' + msg);
        }
        continue;
      }
      markEnded(p);
      db.panels = db.panels.filter((x) => x.id !== p.id);
      save();
      addLog('expire', p.ip, p.username, 'Trial habis, panel dan akun dihapus otomatis');
      removed += 1;
    }
  } finally {
    sweeping = false;
  }
  return { removed, failed };
}

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  sseClients.add(res);
  const hb = setInterval(() => { try { res.write(': hb\n\n'); } catch { /* putus */ } }, 25000);
  req.on('close', () => { clearInterval(hb); sseClients.delete(res); });
});

app.get('/api/public/info', wrap(async (req, res) => {
  const s = db.settings;
  const ip = clientIp(req);
  const mine = db.panels.find((p) => p.ip === ip);
  res.json({
    open: !!(s.open && s.domain && s.plta),
    eggs: await publicEggs(),
    defaultEgg: s.defaultEgg,
    emailDomain: s.emailDomain,
    trialDays: Number(s.trialDays) || 0,
    total: db.panels.length,
    hasPanel: !!mine,
    myExpiresAt: mine?.expiresAt || null,
    ...(mine ? {} : accessState(ip)),
  });
}));

app.get('/api/public/notifications', (req, res) => {
  const ip = clientIp(req);
  const items = db.notifs
    .filter((n) => !n.target || n.target === ip)
    .slice(0, 100)
    .map((n) => ({ id: n.id, title: n.title, body: n.body, kind: n.kind, pinned: !!n.pinned, createdAt: n.createdAt, personal: !!n.target }));
  res.json(items);
});

const myPanel = (req) => db.panels.find((p) => p.ip === clientIp(req));

app.get('/api/me', (req, res) => {
  const p = myPanel(req);
  if (!p) return res.json({ panel: null, allowExtend: !!db.settings.allowExtend });
  res.json({
    panel: {
      username: p.username, email: p.email, eggName: p.eggName,
      createdAt: p.createdAt, expiresAt: p.expiresAt,
      extReq: p.extReq ? { at: p.extReq.at, message: p.extReq.message } : null,
      extResult: p.extResult || null,
    },
    domain: baseUrl(),
    allowExtend: !!db.settings.allowExtend,
  });
});

const statusCache = new Map();
app.get('/api/me/status', wrap(async (req, res) => {
  const p = myPanel(req);
  if (!p) throw new HttpError(404, 'Kamu belum punya panel');
  const c = statusCache.get(p.id);
  if (c && Date.now() - c.at < 30000) return res.json(c.data);
  try {
    const r = await ptero('GET', `/api/client/servers/${p.identifier}/resources`, null, db.settings.pltc);
    const a = r.attributes;
    const data = { state: a.current_state, cpu: a.resources.cpu_absolute, memory: a.resources.memory_bytes, disk: a.resources.disk_bytes };
    statusCache.set(p.id, { at: Date.now(), data });
    res.json(data);
  } catch {
    throw new HttpError(502, 'Status server belum tersedia');
  }
}));

app.post('/api/me/extend', wrap(async (req, res) => {
  const p = myPanel(req);
  if (!p) throw new HttpError(404, 'Kamu belum punya panel');
  if (!db.settings.allowExtend) throw new HttpError(403, 'Permintaan perpanjangan sedang ditutup');
  if (!p.expiresAt) throw new HttpError(400, 'Panel kamu tidak punya batas waktu');
  if (p.extReq) throw new HttpError(409, 'Permintaan sebelumnya masih menunggu admin');
  const message = String(req.body?.message || '').trim().slice(0, 200);
  p.extReq = { at: new Date().toISOString(), message };
  delete p.extResult;
  save();
  addLog('request', p.ip, p.username, message ? `Minta perpanjang: ${message}` : 'Minta perpanjang masa aktif');
  res.json({ ok: true });
}));

const busy = new Set();
app.post('/api/me/extend/dismiss', wrap(async (req, res) => {
  const p = myPanel(req);
  if (p) { delete p.extResult; save(); }
  res.json({ ok: true });
}));

app.post('/api/panel/create', wrap(async (req, res) => {
  const s = db.settings;
  const ip = clientIp(req);
  if (!s.open) throw new HttpError(403, 'Pembuatan panel sedang ditutup');
  if (!s.domain || !s.plta) throw new HttpError(503, 'Server belum dikonfigurasi admin');

  const name = String(req.body?.name || '').toLowerCase();
  if (!/^[a-z0-9]{4,16}$/.test(name)) throw new HttpError(400, 'Nama 4-16 karakter, hanya huruf kecil dan angka');
  const eggId = Number(req.body?.eggId);
  if (!Number.isInteger(eggId)) throw new HttpError(400, 'Egg tidak valid');

  if (busy.has(ip)) throw new HttpError(429, 'Permintaan masih diproses, tunggu sebentar');
  if (db.panels.some((p) => p.ip === ip)) throw new HttpError(409, 'IP kamu sudah punya panel (1 IP = 1 panel)');
  const acc = accessState(ip);
  if (acc.blocked === 'blacklist') throw new HttpError(403, 'IP kamu diblokir dari layanan ini');
  if (acc.blocked === 'lifetime') throw new HttpError(403, 'IP kamu sudah pernah claim panel (batas 1x)');
  if (acc.blocked === 'cooldown') throw new HttpError(403, `Cooldown aktif, kamu bisa claim lagi setelah ${fmtDate(acc.until)}`);
  if (db.panels.some((p) => p.username === name)) throw new HttpError(409, 'Nama sudah dipakai, coba nama lain');

  busy.add(ip);
  let userId = null;
  try {
    const allowed = await publicEggs();
    if (!allowed.some((e) => e.id === eggId)) throw new HttpError(400, 'Egg tidak tersedia');
    const meta = (await panelEggs()).find((e) => e.id === eggId);
    if (!meta) throw new HttpError(400, 'Egg tidak ditemukan di panel');

    const egg = (await ptero('GET', `/api/application/nests/${meta.nest}/eggs/${eggId}?include=variables`, null, s.plta)).attributes;
    const env = {};
    for (const v of egg.relationships?.variables?.data || []) env[v.attributes.env_variable] = v.attributes.default_value ?? '';
    const image = egg.docker_image || Object.values(egg.docker_images || {})[0];

    const password = name + rnd(4);
    const email = `${name}@${s.emailDomain}`;

    const user = await ptero('POST', '/api/application/users', {
      email, username: name, first_name: name, last_name: 'Free', password,
    }, s.plta);
    userId = user.attributes.id;

    const server = await ptero('POST', '/api/application/servers', {
      name,
      user: userId,
      egg: eggId,
      docker_image: image,
      startup: egg.startup,
      environment: env,
      limits: { memory: +s.memory, swap: +s.swap, disk: +s.disk, io: +s.io, cpu: +s.cpu },
      feature_limits: { databases: +s.databases, backups: +s.backups, allocations: +s.allocations },
      deploy: { locations: [+s.locationId], dedicated_ip: false, port_range: [] },
      start_on_completion: true,
      oom_disabled: true,
    }, s.plta);

    const now = Date.now();
    const days = Number(s.trialDays) || 0;
    const panel = {
      id: crypto.randomUUID(),
      ip, username: name, password, email,
      userId, serverId: server.attributes.id, identifier: server.attributes.identifier,
      eggId, eggName: meta.name,
      createdAt: new Date(now).toISOString(),
      expiresAt: days > 0 ? new Date(now + days * DAY).toISOString() : null,
    };
    db.panels.unshift(panel);
    db.history[ip] = { lastClaimAt: panel.createdAt, ended: null };
    save();
    addLog('create', ip, name, `Panel dibuat (egg ${eggId} - ${meta.name})${panel.expiresAt ? `, trial sampai ${fmtDate(panel.expiresAt)}` : ''}`);

    res.json({
      username: name, password, email, domain: baseUrl(), rules: s.rules,
      eggName: meta.name, expiresAt: panel.expiresAt, trialDays: days, message: buildMessage(panel),
    });
  } catch (e) {
    if (userId && !db.panels.some((p) => p.userId === userId)) {
      await ptero('DELETE', `/api/application/users/${userId}`, null, s.plta).catch(() => {});
    }
    addLog('error', ip, name, e.message);
    throw e;
  } finally {
    busy.delete(ip);
  }
}));

const attempts = new Map();
app.post('/api/admin/login', (req, res) => {
  const ip = clientIp(req);
  const a = attempts.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - a.t > 600000) { a.n = 0; a.t = Date.now(); }
  if (a.n >= 5) return res.status(429).json({ error: 'Terlalu banyak percobaan, tunggu 10 menit' });
  const { username = '', password = '' } = req.body || {};
  const okU = safeEq(username, ADMIN_USER);
  const okP = safeEq(password, ADMIN_PASS);
  if (!(okU && okP)) {
    a.n += 1; attempts.set(ip, a);
    addLog('login', ip, String(username).slice(0, 30), 'Login admin gagal');
    return res.status(401).json({ error: 'Username atau password salah' });
  }
  attempts.delete(ip);
  addLog('login', ip, username, 'Login admin berhasil');
  res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' }) });
});

function auth(req, res, next) {
  const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try { jwt.verify(t, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Sesi admin habis, login ulang' }); }
}

const maskSettings = (s) => ({
  ...s,
  plta: '', pltc: '',
  pltaSet: !!s.plta, pltcSet: !!s.pltc,
  pltaHint: s.plta ? '****' + s.plta.slice(-4) : '',
  pltcHint: s.pltc ? '****' + s.pltc.slice(-4) : '',
});

app.get('/api/admin/settings', auth, (req, res) => res.json(maskSettings(db.settings)));

app.put('/api/admin/settings', auth, wrap(async (req, res) => {
  const b = req.body || {};
  const s = db.settings;
  const num = (v, d) => (Number.isFinite(Number(v)) && v !== '' ? Number(v) : d);
  if (typeof b.domain === 'string') s.domain = b.domain.trim();
  if (typeof b.plta === 'string' && b.plta.trim()) s.plta = b.plta.trim();
  if (typeof b.pltc === 'string' && b.pltc.trim()) s.pltc = b.pltc.trim();
  if (typeof b.emailDomain === 'string' && b.emailDomain.trim()) s.emailDomain = b.emailDomain.trim().replace(/^@/, '');
  if (typeof b.rules === 'string') s.rules = b.rules;
  for (const k of ['locationId', 'memory', 'swap', 'disk', 'io', 'cpu', 'databases', 'backups', 'allocations', 'defaultEgg']) {
    s[k] = num(b[k], s[k]);
  }
  s.trialDays = Math.min(3650, Math.max(0, Math.floor(num(b.trialDays, s.trialDays))));
  s.cooldownDays = Math.min(3650, Math.max(-1, Math.floor(num(b.cooldownDays, s.cooldownDays))));
  if (typeof b.open === 'boolean') s.open = b.open;
  if (typeof b.allowExtend === 'boolean') s.allowExtend = b.allowExtend;
  if (typeof b.showAllEggs === 'boolean') s.showAllEggs = b.showAllEggs;
  if (Array.isArray(b.eggs)) {
    s.eggs = b.eggs
      .filter((e) => Number.isInteger(Number(e.id)) && Number(e.id) > 0)
      .map((e) => ({ id: Number(e.id), label: String(e.label || '').slice(0, 40) }));
  }
  eggCache = { at: 0, data: [] };
  save();
  addLog('config', clientIp(req), 'admin', 'Konfigurasi diperbarui');
  res.json(maskSettings(s));
}));

app.post('/api/admin/test', auth, wrap(async (req, res) => {
  const out = { plta: null, pltc: null, eggs: 0 };
  try { out.eggs = (await panelEggs(true)).length; out.plta = 'OK'; } catch (e) { out.plta = e.message; }
  try { await ptero('GET', '/api/client', null, db.settings.pltc); out.pltc = 'OK'; } catch (e) { out.pltc = e.message; }
  res.json(out);
}));

app.get('/api/admin/logs', auth, (req, res) => res.json(db.logs));
app.delete('/api/admin/logs', auth, (req, res) => { db.logs = []; save(); res.json({ ok: true }); });

app.get('/api/admin/panels', auth, (req, res) => res.json(db.panels));

app.get('/api/admin/panels/:id/status', auth, wrap(async (req, res) => {
  const p = db.panels.find((x) => x.id === req.params.id);
  if (!p) throw new HttpError(404, 'Panel tidak ditemukan');
  const r = await ptero('GET', `/api/client/servers/${p.identifier}/resources`, null, db.settings.pltc);
  const a = r.attributes;
  res.json({
    state: a.current_state,
    cpu: a.resources.cpu_absolute,
    memory: a.resources.memory_bytes,
    disk: a.resources.disk_bytes,
  });
}));

app.post('/api/admin/panels/:id/extend', auth, wrap(async (req, res) => {
  const p = db.panels.find((x) => x.id === req.params.id);
  if (!p) throw new HttpError(404, 'Panel tidak ditemukan');
  if (req.body?.permanent) {
    p.expiresAt = null;
    delete p.warned;
  } else {
    const days = Number(req.body?.days);
    if (!Number.isFinite(days) || days <= 0 || days > 3650) throw new HttpError(400, 'Jumlah hari tidak valid');
    applyExtend(p, days);
  }
  if (p.extReq) {
    p.extResult = { status: "approved", at: new Date().toISOString(), days: null, until: p.expiresAt };
    delete p.extReq;
    notifyIp(p.ip, 'Perpanjangan disetujui', p.expiresAt ? `Masa aktif panel ${p.username} sekarang sampai ${fmtDate(p.expiresAt)}.` : `Panel ${p.username} sekarang permanen.`, 'update');
  }
  save();
  addLog('config', clientIp(req), p.username, p.expiresAt ? `Masa aktif diperpanjang sampai ${fmtDate(p.expiresAt)}` : 'Panel dijadikan permanen');
  res.json(p);
}));

app.post('/api/admin/panels/:id/request', auth, wrap(async (req, res) => {
  const p = db.panels.find((x) => x.id === req.params.id);
  if (!p) throw new HttpError(404, 'Panel tidak ditemukan');
  if (!p.extReq) throw new HttpError(400, 'Tidak ada permintaan perpanjangan');
  if (req.body?.approve) {
    const days = Number(req.body.days) || Number(db.settings.trialDays) || 7;
    if (!Number.isFinite(days) || days <= 0 || days > 3650) throw new HttpError(400, 'Jumlah hari tidak valid');
    applyExtend(p, days);
    delete p.extReq;
    notifyIp(p.ip, 'Perpanjangan disetujui', `Masa aktif panel ${p.username} diperpanjang ${days} hari, sekarang sampai ${fmtDate(p.expiresAt)}.`, 'update');
    addLog('config', clientIp(req), p.username, `Perpanjangan disetujui (+${days} hari)`);
    p.extResult = { status: "approved", at: new Date().toISOString(), days, until: p.expiresAt };
  } else {
    const reason = String(req.body?.reason || '').trim().slice(0, 200);
    delete p.extReq;
    notifyIp(p.ip, 'Perpanjangan ditolak', reason || 'Permintaan perpanjangan kamu belum bisa disetujui.', 'warning');
    addLog('config', clientIp(req), p.username, 'Perpanjangan ditolak' + (reason ? `: ${reason}` : ''));
    p.extResult = { status: "rejected", at: new Date().toISOString(), reason };
  }
  save();
  res.json(p);
}));

app.post('/api/admin/sweep', auth, wrap(async (req, res) => {
  res.json(await sweepExpired());
}));

app.delete('/api/admin/panels/:id', auth, wrap(async (req, res) => {
  const p = db.panels.find((x) => x.id === req.params.id);
  if (!p) throw new HttpError(404, 'Panel tidak ditemukan');
  const warn = await removePanel(p);
  markEnded(p);
  db.panels = db.panels.filter((x) => x.id !== p.id);
  save();
  addLog('delete', p.ip, p.username, 'Panel dihapus oleh admin' + (warn.length ? ` (catatan: ${warn.join('; ')})` : ''));
  res.json({ ok: true, warn });
}));

app.get('/api/admin/notifs', auth, (req, res) => res.json(db.notifs));

app.post('/api/admin/notifs', auth, wrap(async (req, res) => {
  const b = req.body || {};
  const title = String(b.title || '').trim().slice(0, 80);
  const body = String(b.body || '').trim().slice(0, 1000);
  const kind = KINDS.includes(b.kind) ? b.kind : 'info';
  const target = String(b.target || '').trim().slice(0, 64) || null;
  if (!title || !body) throw new HttpError(400, 'Judul dan isi wajib diisi');
  const n = notify({ title, body, kind, pinned: !!b.pinned && !target, target });
  addLog('config', clientIp(req), 'admin', `Notifikasi dikirim: ${title}${target ? ` (ke ${target})` : ''}`);
  res.json(n);
}));

app.put('/api/admin/notifs/:id', auth, wrap(async (req, res) => {
  const n = db.notifs.find((x) => x.id === req.params.id);
  if (!n) throw new HttpError(404, 'Notifikasi tidak ditemukan');
  if (typeof req.body?.pinned === 'boolean') n.pinned = req.body.pinned && !n.target;
  save();
  res.json(n);
}));

app.delete('/api/admin/notifs/:id', auth, wrap(async (req, res) => {
  db.notifs = db.notifs.filter((x) => x.id !== req.params.id);
  save();
  res.json({ ok: true });
}));

app.get('/api/admin/access', auth, (req, res) => {
  const cd = Number(db.settings.cooldownDays) || 0;
  const history = Object.entries(db.history).map(([ip, h]) => ({
    ip,
    lastClaimAt: h.lastClaimAt || null,
    ended: h.ended || null,
    until: h.ended && cd > 0 ? new Date(Date.parse(h.ended) + cd * DAY).toISOString() : null,
    lifetime: !!(h.ended && cd < 0),
    active: db.panels.some((p) => p.ip === ip),
  }));
  history.sort((a, b) => Date.parse(b.lastClaimAt || 0) - Date.parse(a.lastClaimAt || 0));
  res.json({ history, blacklist: db.blacklist });
});

app.post('/api/admin/blacklist', auth, wrap(async (req, res) => {
  const ip = String(req.body?.ip || '').trim();
  const reason = String(req.body?.reason || '').trim().slice(0, 120);
  if (!/^[0-9a-fA-F:.]{3,45}$/.test(ip)) throw new HttpError(400, 'Format IP tidak valid');
  if (!db.blacklist.some((b) => b.ip === ip)) {
    db.blacklist.unshift({ ip, reason, at: new Date().toISOString() });
    save();
    addLog('config', clientIp(req), 'admin', `IP ${ip} diblokir${reason ? `: ${reason}` : ''}`);
  }
  res.json(db.blacklist);
}));

app.delete('/api/admin/blacklist', auth, wrap(async (req, res) => {
  const ip = String(req.query.ip || '');
  db.blacklist = db.blacklist.filter((b) => b.ip !== ip);
  save();
  addLog('config', clientIp(req), 'admin', `IP ${ip} dibuka blokirnya`);
  res.json(db.blacklist);
}));

app.delete('/api/admin/history', auth, wrap(async (req, res) => {
  const ip = String(req.query.ip || '');
  if (db.panels.some((p) => p.ip === ip)) throw new HttpError(400, 'IP ini masih punya panel aktif');
  delete db.history[ip];
  save();
  addLog('config', clientIp(req), 'admin', `Cooldown IP ${ip} direset`);
  res.json({ ok: true });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint tidak ada' }));
const DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.use((err, req, res, next) => {
  if (!(err instanceof HttpError)) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Kesalahan server' });
});

app.listen(PORT, () => {
  console.log(`[OK] Panel Free Momon jalan di port ${PORT}`);
  const run = () => sweepExpired().catch((e) => console.error('[ERR] sweeper:', e.message));
  setTimeout(run, 10000);
  setInterval(run, SWEEP_EVERY);
  console.log('[OK] Sweeper trial aktif (cek tiap 1 menit)');
});
