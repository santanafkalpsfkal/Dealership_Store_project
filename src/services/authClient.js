const FALLBACK_USERS_KEY = 'mp_users_v1';
const FALLBACK_SESSION_KEY = 'mp_session_v1';

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getFallbackUsers() {
  return safeParse(localStorage.getItem(FALLBACK_USERS_KEY), []);
}

function setFallbackUsers(users) {
  localStorage.setItem(FALLBACK_USERS_KEY, JSON.stringify(users));
}

function setFallbackSession(user) {
  localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(user));
}

function getFallbackSession() {
  return safeParse(localStorage.getItem(FALLBACK_SESSION_KEY), null);
}

function clearFallbackSession() {
  localStorage.removeItem(FALLBACK_SESSION_KEY);
}

async function request(path, options = {}) {
  try {
    const res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });

    const text = await res.text();
    const payload = safeParse(text, null);

    if (!payload || typeof payload !== 'object') {
      return { ok: false, status: res.status, message: 'Respuesta del servidor invalida' };
    }

    return {
      ok: res.ok,
      status: res.status,
      ...payload,
    };
  } catch {
    return { ok: false, status: 0, message: 'Servidor no disponible' };
  }
}

function fallbackRegister({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanName || !normalizedEmail || !password) {
    return { ok: false, message: 'Completa todos los campos' };
  }

  if (!normalizedEmail.includes('@')) {
    return { ok: false, message: 'Correo invalido' };
  }

  if (password.length < 6) {
    return { ok: false, message: 'La contrasena debe tener al menos 6 caracteres' };
  }

  const users = getFallbackUsers();

  if (users.some((u) => u.email === normalizedEmail)) {
    return { ok: false, message: 'Ese correo ya esta registrado' };
  }

  const user = {
    id: Date.now(),
    name: cleanName,
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  setFallbackUsers([...users, user]);
  setFallbackSession({ id: user.id, name: user.name, email: user.email });

  return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
}

function fallbackLogin({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getFallbackUsers();
  const found = users.find((u) => u.email === normalizedEmail);

  if (!found || found.password !== password) {
    return { ok: false, message: 'Correo o contrasena incorrectos' };
  }

  const user = { id: found.id, name: found.name, email: found.email };
  setFallbackSession(user);
  return { ok: true, user };
}

export async function registerUser(payload) {
  const apiRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (apiRes.ok) return apiRes;

  if (apiRes.status === 0 || apiRes.status === 404 || apiRes.status === 405 || apiRes.status >= 500) {
    return fallbackRegister(payload);
  }

  return apiRes;
}

export async function loginUser(payload) {
  const apiRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (apiRes.ok) return apiRes;

  if (apiRes.status === 0 || apiRes.status === 404 || apiRes.status === 405 || apiRes.status >= 500) {
    return fallbackLogin(payload);
  }

  return apiRes;
}

export async function logoutUser() {
  await request('/api/auth/logout', { method: 'POST' });
  clearFallbackSession();
  return { ok: true };
}

export async function getCurrentUser() {
  const apiRes = await request('/api/auth/me', { method: 'GET' });

  if (apiRes.ok && apiRes.user) {
    return apiRes;
  }

  const localUser = getFallbackSession();
  if (localUser) {
    return { ok: true, user: localUser, source: 'fallback' };
  }

  return { ok: false, message: 'Sin sesion activa' };
}
