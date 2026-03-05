import bcrypt from 'bcryptjs';
import db, { ensureSchema } from '../../src/lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Usa POST' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son requeridos' });
  }

  try {
    await ensureSchema();

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await db.findUserByEmail(normalizedEmail);

    if (!user) {
      const usersCountResult = await db.query('SELECT COUNT(*)::int AS total FROM usuarios');
      return res.status(401).json({
        error: 'Usuario no encontrado',
        email_buscado: normalizedEmail,
        total_usuarios_en_bd: usersCountResult.rows[0]?.total || 0,
      });
    }

    const passwordValida = await bcrypt.compare(String(password), user.password);

    if (!passwordValida) {
      return res.status(401).json({
        error: 'Contrasena incorrecta',
        email_buscado: normalizedEmail,
        usuario_encontrado: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login debug exitoso',
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en servidor',
      detalle: String(error.message || error),
    });
  }
}
