import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.warn('DATABASE_URL no esta configurada.');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Error en BD:', error);
    throw error;
  }
}

export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Conexion exitosa a Neon:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Error de conexion:', error);
    return false;
  }
}

export async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      email VARCHAR(180) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      rol VARCHAR(30) NOT NULL DEFAULT 'usuario',
      fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ultimo_acceso TIMESTAMPTZ
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sesiones (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      fecha_expiracion TIMESTAMPTZ NOT NULL,
      ip_address VARCHAR(120),
      user_agent TEXT
    );
  `);

  await query('CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);');
  await query('CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token);');
  await query('CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);');
}

export const db = {
  async findUserByEmail(email) {
    const { rows } = await query('SELECT * FROM usuarios WHERE email = $1 LIMIT 1', [email]);
    return rows[0] || null;
  },

  async createUser({ nombre, email, password, rol = 'usuario' }) {
    const { rows } = await query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, fecha_registro',
      [nombre, email, password, rol]
    );
    return rows[0];
  },

  async updateLastLogin(userId) {
    await query('UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
  },

  async createSession({ usuario_id, token, ip_address, user_agent, expires_in_days = 7 }) {
    const { rows } = await query(
      `INSERT INTO sesiones (usuario_id, token, fecha_expiracion, ip_address, user_agent)
       VALUES ($1, $2, CURRENT_TIMESTAMP + ($3 * INTERVAL '1 day'), $4, $5)
       RETURNING id, token, fecha_expiracion`,
      [usuario_id, token, expires_in_days, ip_address, user_agent]
    );
    return rows[0];
  },

  async findSessionByToken(token) {
    const { rows } = await query(
      `SELECT s.*, u.nombre, u.email, u.rol
       FROM sesiones s
       JOIN usuarios u ON s.usuario_id = u.id
       WHERE s.token = $1
         AND s.fecha_expiracion > CURRENT_TIMESTAMP
       LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  },

  async deleteSession(token) {
    await query('DELETE FROM sesiones WHERE token = $1', [token]);
  },

  async deleteUserSessions(userId) {
    await query('DELETE FROM sesiones WHERE usuario_id = $1', [userId]);
  },

  async query(text, params = []) {
    return query(text, params);
  },
};

export default db;
