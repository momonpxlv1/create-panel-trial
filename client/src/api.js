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

const KEY = 'mp_admin_token';
export const getToken = () => localStorage.getItem(KEY) || '';
export const setToken = (t) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY));

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = `Bearer ${getToken()}`;
  let res;
  try {
    res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw Object.assign(new Error('Tidak bisa terhubung ke server'), { status: 0 });
  }
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) throw Object.assign(new Error(data?.error || `Error ${res.status}`), { status: res.status });
  return data;
}
