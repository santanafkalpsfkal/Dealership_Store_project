import authService from './authService';
import { mapDbProductToUi, normalizeProductInput } from '../lib/products';

const API_URL = import.meta.env.VITE_API_URL || '';

async function parseResponse(response, defaultMessage) {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.error || data.message || defaultMessage || 'Error en productos');
    error.status = response.status;
    throw error;
  }

  return data;
}

function invalidPayload(message = 'Respuesta invalida de la API') {
  const error = new Error(message);
  // 404 forces fallback mode in withFallback for local Vite without /api runtime.
  error.status = 404;
  return error;
}

function getHeaders(withJson = false) {
  const token = authService.getToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (withJson) headers['Content-Type'] = 'application/json';
  return headers;
}

function withFallback(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const status = Number(error?.status || 0);
      if (status === 0 || status === 404 || status === 405 || status >= 500) {
        return null;
      }
      throw error;
    }
  };
}

function toUiProduct(row) {
  if (!row || typeof row !== 'object') return null;
  // If API already returns UI shape, keep it as-is.
  if ('name' in row && 'año' in row) return row;
  return mapDbProductToUi(row);
}

const fetchProductsApi = withFallback(async () => {
  const response = await fetch(`${API_URL}/api/products`, {
    method: 'GET',
    headers: getHeaders(false),
  });
  const data = await parseResponse(response, 'No se pudo cargar el catalogo');
  if (!Array.isArray(data.products)) throw invalidPayload('La API no devolvio un arreglo de productos');
  const rows = Array.isArray(data.products) ? data.products : [];
  return rows.map(toUiProduct).filter(Boolean);
});

const addProductApi = withFallback(async (input) => {
  const payload = normalizeProductInput(input);
  const response = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await parseResponse(response, 'No se pudo crear el producto');
  if (!data.product || typeof data.product !== 'object') throw invalidPayload('La API no devolvio el producto creado');
  return toUiProduct(data.product);
});

const updateProductApi = withFallback(async (id, input) => {
  const payload = normalizeProductInput(input);
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await parseResponse(response, 'No se pudo actualizar el producto');
  if (!data.product || typeof data.product !== 'object') throw invalidPayload('La API no devolvio el producto actualizado');
  return toUiProduct(data.product);
});

const deleteProductApi = withFallback(async (id) => {
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  });
  const data = await parseResponse(response, 'No se pudo eliminar el producto');
  if (!data.product || typeof data.product !== 'object') throw invalidPayload('La API no devolvio el producto eliminado');
  return toUiProduct(data.product);
});

export async function listProducts() {
  const apiProducts = await fetchProductsApi();
  if (apiProducts) {
    return { ok: true, products: apiProducts, source: 'api' };
  }

  return {
    ok: false,
    products: [],
    source: 'api',
    message: 'No se pudo cargar productos desde la API',
  };
}

export async function createProduct(input) {
  const apiProduct = await addProductApi(input);
  if (apiProduct) {
    return { ok: true, product: apiProduct, source: 'api' };
  }

  return { ok: false, message: 'No se pudo crear el producto en la API' };
}

export async function editProduct(id, input) {
  const apiProduct = await updateProductApi(id, input);
  if (apiProduct) {
    return { ok: true, product: apiProduct, source: 'api' };
  }

  return { ok: false, message: 'No se pudo actualizar el producto en la API' };
}

export async function removeProduct(id) {
  const apiProduct = await deleteProductApi(id);
  if (apiProduct) {
    return { ok: true, product: apiProduct, source: 'api' };
  }

  return { ok: false, message: 'No se pudo eliminar el producto en la API' };
}
