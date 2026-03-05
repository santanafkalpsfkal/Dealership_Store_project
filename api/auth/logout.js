import { logoutUser, requireAuth } from '../../src/lib/auth.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    await logoutUser(req.authToken, res);
    return res.status(200).json({ message: 'Sesion cerrada exitosamente' });
  } catch (error) {
    return res.status(500).json({
      error: 'Error al cerrar sesion',
      detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
    });
  }
}

export default requireAuth(handler);
