import { sendJson, requireMethod, clearAuthCookie } from '../_lib/http.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;

  clearAuthCookie(res);
  sendJson(res, 200, { ok: true, message: 'Sesion cerrada' });
}
