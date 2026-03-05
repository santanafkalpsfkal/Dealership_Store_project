import { query, ensureSchema } from '../src/lib/db.js';

export default async function handler(req, res) {
  try {
    await ensureSchema();

    const timeResult = await query('SELECT NOW() as current_time');
    const usersResult = await query('SELECT COUNT(*)::int as total FROM usuarios');

    return res.status(200).json({
      success: true,
      message: 'Conexion exitosa a Neon',
      timestamp: timeResult.rows[0].current_time,
      total_usuarios: usersResult.rows[0].total,
      database_url: process.env.DATABASE_URL ? 'Configurada' : 'No configurada',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error de conexion',
      error: String(error.message || error),
    });
  }
}
