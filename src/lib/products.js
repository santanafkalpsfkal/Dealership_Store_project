const CURRENT_YEAR = new Date().getFullYear();

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value, fallback = '') {
  const text = String(value ?? fallback).trim();
  return text || fallback;
}

function normalizeSpecs(input = {}) {
  const source = typeof input === 'object' && input !== null ? input : {};

  return {
    motor: toText(source.motor, 'N/D'),
    potencia: toText(source.potencia, 'N/D'),
    par: toText(source.par, 'N/D'),
    peso: toText(source.peso, 'N/D'),
    velocidad: toText(source.velocidad, 'N/D'),
  };
}

function normalizeImages(input, mainImage) {
  let raw = [];
  if (Array.isArray(input)) {
    raw = input;
  } else if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      raw = Array.isArray(parsed) ? parsed : [];
    } catch {
      raw = [];
    }
  }

  const cleaned = raw
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  if (mainImage && !cleaned.includes(mainImage)) {
    cleaned.unshift(mainImage);
  }

  return cleaned;
}

export function normalizeProductInput(input = {}) {
  const yearRaw = input.anio ?? input.ano ?? input.año;
  const reviewsRaw = input.resenas ?? input.reseñas;
  const nameRaw = input.name ?? input.nombre;
  const mainImage = toText(input.img, '');

  const specsFromForm = {
    motor: input.motor,
    potencia: input.potencia,
    par: input.par,
    peso: input.peso,
    velocidad: input.velocidad,
  };

  const specs = normalizeSpecs(input.specs || specsFromForm);

  return {
    nombre: toText(nameRaw, ''),
    marca: toText(input.marca, ''),
    tipo: toText(input.tipo, 'Moto'),
    estilo: toText(input.estilo, ''),
    precio: Math.max(0, toNumber(input.precio, 0)),
    cuota: Math.max(0, toNumber(input.cuota, 0)),
    anio: Math.min(CURRENT_YEAR + 1, Math.max(1900, toNumber(yearRaw, CURRENT_YEAR))),
    km: Math.max(0, Math.trunc(toNumber(input.km, 0))),
    color: toText(input.color, 'Negro'),
    financiamiento: Boolean(input.financiamiento),
    estado: toText(input.estado, 'Nuevo'),
    rating: Math.min(5, Math.max(0, toNumber(input.rating, 4.5))),
    resenas: Math.max(0, Math.trunc(toNumber(reviewsRaw, 0))),
    badge: toText(input.badge, '') || null,
    descripcion: toText(input.descripcion, 'Moto agregada por el panel admin.'),
    img: mainImage,
    imagenes: normalizeImages(input.imagenes || input.imgs, mainImage),
    specs,
    activo: input.activo === undefined ? true : Boolean(input.activo),
  };
}

export function validateNormalizedProduct(product) {
  if (!product.nombre || !product.marca || !product.estilo || !product.img) {
    return 'Completa nombre, marca, estilo e imagen';
  }

  if (!['Nuevo', 'Usado'].includes(product.estado)) {
    return "El estado debe ser 'Nuevo' o 'Usado'";
  }

  return null;
}

export function mapDbProductToUi(row = {}) {
  const images = normalizeImages(row.imagenes, toText(row.img, ''));
  const image = toText(row.img, images[0] || '');
  const specs = normalizeSpecs(row.specs);
  const year = toNumber(row.anio, CURRENT_YEAR);
  const reviews = Math.max(0, Math.trunc(toNumber(row.resenas, 0)));

  return {
    id: row.id,
    name: row.nombre,
    nombre: row.nombre,
    marca: row.marca,
    tipo: row.tipo,
    estilo: row.estilo,
    precio: toNumber(row.precio, 0),
    cuota: toNumber(row.cuota, 0),
    año: year,
    anio: year,
    km: Math.max(0, Math.trunc(toNumber(row.km, 0))),
    color: row.color,
    financiamiento: Boolean(row.financiamiento),
    estado: row.estado,
    rating: toNumber(row.rating, 4.5),
    reseñas: reviews,
    resenas: reviews,
    badge: row.badge,
    descripcion: row.descripcion,
    img: image,
    imgs: images.length ? images : [image],
    imagenes: images,
    specs,
    activo: Boolean(row.activo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
