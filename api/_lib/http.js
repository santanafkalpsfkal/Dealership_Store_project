export function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export function requireMethod(req, res, method) {
  if (req.method !== method) {
    sendJson(res, 405, { ok: false, message: 'Metodo no permitido' });
    return false;
  }
  return true;
}

export function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
}

export function readCookie(req, name) {
  const header = req.headers?.cookie || '';
  const parts = header.split(';').map((p) => p.trim());
  const match = parts.find((p) => p.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

export function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `mp_token=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
    `Max-Age=${60 * 60 * 24 * 7}`,
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookie);
}

export function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    'mp_token=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
    'Max-Age=0',
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookie);
}
