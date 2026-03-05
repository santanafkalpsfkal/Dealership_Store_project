import { sendJson, requireMethod, getBody, setAuthCookie } from '../_lib/http.js';
import { signAuthToken } from '../_lib/auth.js';
import { ensureUsersTable, findUserByEmail, createUser } from '../_lib/users.js';

function validateInput(body) {
  const name = (body?.name || '').trim();
  const email = (body?.email || '').trim().toLowerCase();
  const password = body?.password || '';

  if (!name || !email || !password) {
    return { ok: false, message: 'Completa todos los campos' };
  }

  if (!email.includes('@')) {
    return { ok: false, message: 'Correo invalido' };
  }

  if (password.length < 6) {
    return { ok: false, message: 'La contrasena debe tener al menos 6 caracteres' };
  }

  return { ok: true, value: { name, email, password } };
}

export default async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;

  try {
    await ensureUsersTable();

    const body = getBody(req);
    const parsed = validateInput(body);
    if (!parsed.ok) {
      sendJson(res, 400, { ok: false, message: parsed.message });
      return;
    }

    const existing = await findUserByEmail(parsed.value.email);
    if (existing) {
      sendJson(res, 409, { ok: false, message: 'Ese correo ya esta registrado' });
      return;
    }

    const user = await createUser(parsed.value);
    const token = signAuthToken(user);
    setAuthCookie(res, token);

    sendJson(res, 201, {
      ok: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: 'No se pudo crear la cuenta',
      detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
    });
  }
}
