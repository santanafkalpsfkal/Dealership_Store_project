import authService from './authService';

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
  try {
    const apiRes = await authService.register({
      nombre: payload.name,
      name: payload.name,
      email: payload.email,
      password: payload.password,
    });

    if (apiRes?.user) {
      setFallbackSession({
        id: apiRes.user.id,
        name: apiRes.user.nombre || apiRes.user.name,
        email: apiRes.user.email,
      });
    }

    return { ok: true, ...apiRes, user: apiRes.user ? { id: apiRes.user.id, name: apiRes.user.nombre || apiRes.user.name, email: apiRes.user.email } : null };
  } catch (error) {
    const status = Number(error?.status || 0);
    if (status === 0 || status === 404 || status === 405 || status >= 500) {
      return fallbackRegister(payload);
    }
    return { ok: false, status, message: error.message || 'No se pudo registrar' };
  }
}

export async function loginUser(payload) {
  try {
    const apiRes = await authService.login(payload);

    if (apiRes?.user) {
      setFallbackSession({
        id: apiRes.user.id,
        name: apiRes.user.nombre || apiRes.user.name,
        email: apiRes.user.email,
      });
    }

    return { ok: true, ...apiRes, user: apiRes.user ? { id: apiRes.user.id, name: apiRes.user.nombre || apiRes.user.name, email: apiRes.user.email } : null };
  } catch (error) {
    const status = Number(error?.status || 0);
    if (status === 0 || status === 404 || status === 405 || status >= 500) {
      return fallbackLogin(payload);
    }
    return { ok: false, status, message: error.message || 'No se pudo iniciar sesion' };
  }
}

export async function logoutUser() {
  await authService.logout();
  clearFallbackSession();
  return { ok: true };
}

export async function getCurrentUser() {
  try {
    const user = await authService.getCurrentUser();
    if (user) {
      const normalized = { id: user.id, name: user.nombre || user.name, email: user.email };
      setFallbackSession(normalized);
      return { ok: true, user: normalized };
    }
  } catch {
    // Ignore and fallback below.
  }

  const localUser = getFallbackSession();
  if (localUser) {
    return { ok: true, user: localUser, source: 'fallback' };
  }

  return { ok: false, message: 'Sin sesion activa' };
}
