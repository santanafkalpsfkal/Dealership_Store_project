import { requireAuth } from '../../src/lib/auth.js';
import db from '../../src/lib/db.js';
import { mapDbProductToUi, normalizeProductInput, validateNormalizedProduct } from '../../src/lib/products.js';

async function isAdmin(user) {
  const candidates = [
    process.env.ADMIN_EMAIL,
    process.env.VITE_ADMIN_EMAIL,
    'admin@concesionario.com',
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  const role = String(user?.rol || '').trim().toLowerCase();
  const email = String(user?.email || '').trim().toLowerCase();
  if (role === 'admin' || candidates.includes(email)) return true;

  try {
    const userId = Number(user?.id);
    const lookupById = Number.isInteger(userId) && userId > 0;
    const sql = lookupById
      ? 'SELECT email, rol FROM usuarios WHERE id = $1 LIMIT 1'
      : 'SELECT email, rol FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1';
    const params = lookupById ? [userId] : [email];
    const { rows } = await db.query(sql, params);
    const dbUser = rows[0];
    if (!dbUser) return false;

    const dbRole = String(dbUser.rol || '').trim().toLowerCase();
    const dbEmail = String(dbUser.email || '').trim().toLowerCase();
    return dbRole === 'admin' || candidates.includes(dbEmail);
  } catch {
    return false;
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await db.query(
        `SELECT *
         FROM productos
         WHERE activo = TRUE
         ORDER BY id DESC`
      );

      return res.status(200).json({
        ok: true,
        products: rows.map(mapDbProductToUi),
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: 'No se pudo listar productos',
        detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
      });
    }
  }

  if (req.method === 'POST') {
    if (!(await isAdmin(req.user))) {
      return res.status(403).json({ ok: false, error: 'Solo admin puede crear productos' });
    }

    const payload = normalizeProductInput(req.body || {});
    const validationError = validateNormalizedProduct(payload);
    if (validationError) {
      return res.status(400).json({ ok: false, error: validationError });
    }

    try {
      const creator = Number(req.user?.id) || null;
      const params = [
        payload.nombre,
        payload.marca,
        payload.tipo,
        payload.estilo,
        payload.precio,
        payload.cuota,
        payload.anio,
        payload.km,
        payload.color,
        payload.financiamiento,
        payload.estado,
        payload.rating,
        payload.resenas,
        payload.badge,
        payload.descripcion,
        payload.img,
        JSON.stringify(payload.imagenes || []),
        JSON.stringify(payload.specs || {}),
        creator,
        creator,
      ];

      const { rows } = await db.query(
        `INSERT INTO productos (
           nombre, marca, tipo, estilo, precio, cuota, anio, km, color,
           financiamiento, estado, rating, resenas, badge, descripcion, img,
           imagenes, specs, creado_por, actualizado_por
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9,
           $10, $11, $12, $13, $14, $15, $16,
           $17::jsonb, $18::jsonb, $19, $20
         )
         RETURNING *`,
        params
      );

      return res.status(201).json({ ok: true, product: mapDbProductToUi(rows[0]) });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: 'No se pudo crear el producto',
        detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
      });
    }
  }

  return res.status(405).json({ ok: false, error: 'Metodo no permitido' });
}

async function guarded(req, res) {
  if (req.method === 'GET') {
    return handler(req, res);
  }

  return requireAuth(handler)(req, res);
}

export default guarded;
