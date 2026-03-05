import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export async function ensureUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(180) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

export async function findUserByEmail(email) {
  const result = await sql`
    SELECT id, name, email, password_hash, created_at
    FROM users
    WHERE email = ${email}
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await sql`
    SELECT id, name, email, created_at
    FROM users
    WHERE id = ${id}
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function createUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name}, ${email}, ${passwordHash})
    RETURNING id, name, email, created_at;
  `;

  return result.rows[0];
}

export async function validatePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
