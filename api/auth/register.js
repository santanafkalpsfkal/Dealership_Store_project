import { registerUser } from '../../src/lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const { nombre, name, email, password } = req.body || {};

    if (!(nombre || name) || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' });
    }

    const result = await registerUser({ nombre, name, email, password }, req, res);

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error.message === 'El email ya esta registrado') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({
      error: 'Error al registrar usuario',
      detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
    });
  }
}
