import { sendJson, requireMethod, readCookie } from '../_lib/http.js';
import { verifyAuthToken } from '../_lib/auth.js';
import { ensureUsersTable, findUserById } from '../_lib/users.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, 'GET')) return;

  try {
    await ensureUsersTable();

    const authHeader = req.headers?.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieToken = readCookie(req, 'mp_token');
    const token = bearer || cookieToken;

    if (!token) {
      sendJson(res, 401, { ok: false, message: 'No autenticado' });
      return;
    }

    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      sendJson(res, 401, { ok: false, message: 'Token invalido' });
      return;
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      sendJson(res, 401, { ok: false, message: 'Usuario no encontrado' });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: 'No se pudo validar la sesion',
      detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
    });
  }
}
