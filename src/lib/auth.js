import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { ensureSchema } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-temporal';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function parseExpireDays(value) {
  const match = /^([0-9]+)d$/i.exec(value || '');
  if (!match) return 7;
  return Number(match[1]) || 7;
}

function getTokenFromReq(req) {
  const authHeader = req.headers?.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);

  const cookieHeader = req.headers?.cookie || '';
  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const tokenPart = cookies.find((part) => part.startsWith('mp_token='));
  return tokenPart ? decodeURIComponent(tokenPart.split('=')[1]) : null;
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `mp_token=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
    `Max-Age=${60 * 60 * 24 * parseExpireDays(JWT_EXPIRES_IN)}`,
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookie);
}

function clearAuthCookie(res) {
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

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function registerUser(userData, req, res) {
  await ensureSchema();

  const nombre = (userData.nombre || userData.name || '').trim();
  const email = (userData.email || '').trim().toLowerCase();
  const password = userData.password || '';

  const existingUser = await db.findUserByEmail(email);
  if (existingUser) {
    throw new Error('El email ya esta registrado');
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await db.createUser({
    nombre,
    email,
    password: hashedPassword,
    rol: 'usuario',
  });

  const token = generateToken(newUser);

  const ip_address = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
  const user_agent = req.headers['user-agent'] || null;

  await db.createSession({
    usuario_id: newUser.id,
    token,
    ip_address,
    user_agent,
    expires_in_days: parseExpireDays(JWT_EXPIRES_IN),
  });

  if (res) setAuthCookie(res, token);

  return {
    user: newUser,
    token,
  };
}

export async function loginUser(credentials, req, res) {
  await ensureSchema();

  const email = (credentials.email || '').trim().toLowerCase();
  const password = credentials.password || '';

  const user = await db.findUserByEmail(email);
  if (!user) {
    throw new Error('Credenciales invalidas');
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('Credenciales invalidas');
  }

  await db.updateLastLogin(user.id);

  const token = generateToken(user);

  const ip_address = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
  const user_agent = req.headers['user-agent'] || null;

  await db.createSession({
    usuario_id: user.id,
    token,
    ip_address,
    user_agent,
    expires_in_days: parseExpireDays(JWT_EXPIRES_IN),
  });

  if (res) setAuthCookie(res, token);

  const { password: _ignored, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
}

export async function logoutUser(token, res) {
  await ensureSchema();
  if (token) await db.deleteSession(token);
  if (res) clearAuthCookie(res);
}

export function requireAuth(handler) {
  return async (req, res) => {
    try {
      await ensureSchema();

      const token = getTokenFromReq(req);
      if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Token invalido' });
      }

      const session = await db.findSessionByToken(token);
      if (!session) {
        return res.status(401).json({ error: 'Sesión expirada' });
      }

      req.user = decoded;
      req.authToken = token;
      return handler(req, res);
    } catch (error) {
      return res.status(500).json({ error: 'Error interno de autenticacion', detail: String(error.message || error) });
    }
  };
}
