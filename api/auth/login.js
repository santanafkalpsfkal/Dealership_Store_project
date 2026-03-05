import { sendJson, requireMethod, getBody, setAuthCookie } from '../_lib/http.js';
import { signAuthToken } from '../_lib/auth.js';
import { ensureUsersTable, findUserByEmail, validatePassword } from '../_lib/users.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;

  try {
    await ensureUsersTable();

    const body = getBody(req);
    const email = (body?.email || '').trim().toLowerCase();
    const password = body?.password || '';

    if (!email || !password) {
      sendJson(res, 400, { ok: false, message: 'Completa todos los campos' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      sendJson(res, 401, { ok: false, message: 'Correo o contrasena incorrectos' });
      return;
    }

    const isValid = await validatePassword(password, user.password_hash);
    if (!isValid) {
      sendJson(res, 401, { ok: false, message: 'Correo o contrasena incorrectos' });
      return;
    }

    const token = signAuthToken(user);
    setAuthCookie(res, token);

    sendJson(res, 200, {
      ok: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: 'No se pudo iniciar sesion',
      detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
    });
  }
}
