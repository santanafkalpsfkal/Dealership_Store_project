import { requireAuth } from '../../src/lib/auth.js';
import db from '../../src/lib/db.js';
import { mapDbProductToUi, normalizeProductInput, validateNormalizedProduct } from '../../src/lib/products.js';

function isAdmin(user) {
  const envAdmin = String(process.env.ADMIN_EMAIL || 'admin@concesionario.com').trim().toLowerCase();
  const role = String(user?.rol || '').trim().toLowerCase();
  const email = String(user?.email || '').trim().toLowerCase();
  return role === 'admin' || email === envAdmin;
}

function parseProductId(req) {
  const raw = req.query?.id;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

async function handler(req, res) {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ ok: false, error: 'Solo admin puede modificar productos' });
  }

  const productId = parseProductId(req);
  if (!productId) {
    return res.status(400).json({ ok: false, error: 'ID de producto invalido' });
  }

  if (req.method === 'PUT') {
    const payload = normalizeProductInput(req.body || {});
    const validationError = validateNormalizedProduct(payload);
    if (validationError) {
      return res.status(400).json({ ok: false, error: validationError });
    }

    try {
      const updater = Number(req.user?.id) || null;
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
        updater,
        productId,
      ];

      const { rows } = await db.query(
        `UPDATE productos
         SET nombre = $1,
             marca = $2,
             tipo = $3,
             estilo = $4,
             precio = $5,
             cuota = $6,
             anio = $7,
             km = $8,
             color = $9,
             financiamiento = $10,
             estado = $11,
             rating = $12,
             resenas = $13,
             badge = $14,
             descripcion = $15,
             img = $16,
             imagenes = $17::jsonb,
             specs = $18::jsonb,
             actualizado_por = $19,
             updated_at = NOW()
         WHERE id = $20
           AND activo = TRUE
         RETURNING *`,
        params
      );

      if (!rows.length) {
        return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
      }

      return res.status(200).json({ ok: true, product: mapDbProductToUi(rows[0]) });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: 'No se pudo actualizar el producto',
        detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const updater = Number(req.user?.id) || null;
      const { rows } = await db.query(
        `UPDATE productos
         SET activo = FALSE,
             actualizado_por = $1,
             updated_at = NOW()
         WHERE id = $2
           AND activo = TRUE
         RETURNING *`,
        [updater, productId]
      );

      if (!rows.length) {
        return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
      }

      return res.status(200).json({ ok: true, product: mapDbProductToUi(rows[0]) });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: 'No se pudo eliminar el producto',
        detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
      });
    }
  }

  return res.status(405).json({ ok: false, error: 'Metodo no permitido' });
}

export default requireAuth(handler);
