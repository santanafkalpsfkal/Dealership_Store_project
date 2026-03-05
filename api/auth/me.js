import { requireAuth } from '../../src/lib/auth.js';
import db, { ensureSchema } from '../../src/lib/db.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    await ensureSchema();
    const user = await db.findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { password: _ignored, ...userWithoutPassword } = user;

    return res.status(200).json({
      user: userWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error al obtener usuario',
      detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
    });
  }
}

export default requireAuth(handler);
