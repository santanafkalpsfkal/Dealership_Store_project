import { loginUser } from '../../src/lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const result = await loginUser({ email, password }, req, res);

    return res.status(200).json({
      message: 'Login exitoso',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error.message === 'Credenciales invalidas') {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({
      error: 'Error al iniciar sesión',
      detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
    });
  }
}
