import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { MOTOS } from '../data/motos';
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from '../services/authClient';

const AppContext = createContext(null);
const PRODUCTS_STORAGE_KEY = 'mp_products_v1';
const VISITS_STORAGE_KEY = 'mp_visits_v1';
const VISITORS_STORAGE_KEY = 'mp_unique_visitors_v1';
const ACTIVE_VISITORS_STORAGE_KEY = 'mp_active_visitors_v1';
const VISITOR_ID_KEY = 'mp_visitor_id_v1';
const FALLBACK_USERS_KEY = 'mp_users_v1';

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getInitialProducts() {
  if (typeof window === 'undefined') return MOTOS;
  const saved = safeParse(localStorage.getItem(PRODUCTS_STORAGE_KEY), null);
  return Array.isArray(saved) && saved.length ? saved : MOTOS;
}

function createVisitorId() {
  return `v_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeProductPayload(input = {}) {
  const year = Number(input.ano ?? input.año);
  const reviews = Number(input.resenas ?? input.reseñas);
  const image = (input.img || '').trim();

  return {
    name: (input.name || '').trim(),
    marca: (input.marca || '').trim(),
    tipo: (input.tipo || 'Moto').trim(),
    estilo: (input.estilo || '').trim(),
    precio: Number(input.precio) || 0,
    cuota: Number(input.cuota) || 0,
    año: Number.isFinite(year) && year > 0 ? year : new Date().getFullYear(),
    km: Number(input.km) || 0,
    color: (input.color || 'Negro').trim(),
    financiamiento: Boolean(input.financiamiento),
    estado: (input.estado || 'Nuevo').trim(),
    rating: Number(input.rating) || 4.5,
    reseñas: Number.isFinite(reviews) && reviews >= 0 ? reviews : 0,
    img: image,
    imgs: image ? [image] : [],
    descripcion: (input.descripcion || 'Moto agregada por el panel admin.').trim(),
    specs: {
      motor: (input.motor || 'N/D').trim(),
      potencia: (input.potencia || 'N/D').trim(),
      par: (input.par || 'N/D').trim(),
      peso: (input.peso || 'N/D').trim(),
      velocidad: (input.velocidad || 'N/D').trim(),
    },
    badge: input.badge?.trim() || null,
  };
}

export function AppProvider({ children }) {
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@motorplace.com').trim().toLowerCase();
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin#2026';

  // ── Auth ──────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // ── Productos (CRUD Admin) ────────────────────────────────
  const [products, setProducts] = useState(getInitialProducts);

  // ── Dashboard Stats ────────────────────────────────────────
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: products.length,
    totalVisits: 0,
    uniqueVisitors: 0,
    activeVisitors: 1,
    registeredUsers: 0,
  });

  const isAdmin = Boolean(user?.email && user.email.toLowerCase() === adminEmail);
  const notifTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = createVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    const now = Date.now();
    const nextVisits = Number(localStorage.getItem(VISITS_STORAGE_KEY) || '0') + 1;
    localStorage.setItem(VISITS_STORAGE_KEY, String(nextVisits));

    const unique = safeParse(localStorage.getItem(VISITORS_STORAGE_KEY), []);
    if (!unique.includes(visitorId)) {
      unique.push(visitorId);
      localStorage.setItem(VISITORS_STORAGE_KEY, JSON.stringify(unique));
    }

    const updateActiveVisitors = () => {
      const active = safeParse(localStorage.getItem(ACTIVE_VISITORS_STORAGE_KEY), {});
      active[visitorId] = Date.now();
      const windowMs = 2 * 60 * 1000;

      Object.keys(active).forEach((id) => {
        if (Date.now() - active[id] > windowMs) delete active[id];
      });

      localStorage.setItem(ACTIVE_VISITORS_STORAGE_KEY, JSON.stringify(active));

      const fallbackUsers = safeParse(localStorage.getItem(FALLBACK_USERS_KEY), []);

      setDashboardStats({
        totalProducts: products.length,
        totalVisits: Number(localStorage.getItem(VISITS_STORAGE_KEY) || '0'),
        uniqueVisitors: safeParse(localStorage.getItem(VISITORS_STORAGE_KEY), []).length,
        activeVisitors: Object.keys(active).length || 1,
        registeredUsers: fallbackUsers.length,
      });
    };

    updateActiveVisitors();
    const interval = setInterval(updateActiveVisitors, 30000);

    return () => {
      clearInterval(interval);
      const active = safeParse(localStorage.getItem(ACTIVE_VISITORS_STORAGE_KEY), {});
      active[visitorId] = now;
      localStorage.setItem(ACTIVE_VISITORS_STORAGE_KEY, JSON.stringify(active));
    };
  }, [products.length]);

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      const res = await getCurrentUser();
      if (!mounted) return;
      if (res.ok) {
        setUser(res.user);
        setAuthError('');
      }
      setAuthLoading(false);
    };

    bootstrapAuth();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    if (!email || !password) {
      setAuthError('Completa todos los campos');
      return false;
    }
    if (password.length < 6) {
      setAuthError('Contrasena muy corta');
      return false;
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    if (normalizedEmail === adminEmail && password === adminPassword) {
      const adminUser = { id: 'admin', name: 'Administrador', email: adminEmail };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mp_session_v1', JSON.stringify(adminUser));
      }
      setUser(adminUser);
      setAuthError('');
      return true;
    }

    const res = await loginUser({ email, password });
    if (!res.ok) {
      setAuthError(res.message || 'No se pudo iniciar sesión');
      return false;
    }

    setUser(res.user);
    setAuthError('');
    return true;
  }, [adminEmail, adminPassword]);

  const register = useCallback(async (name, email, password) => {
    if (!name || !email || !password) {
      setAuthError('Completa todos los campos');
      return false;
    }
    if (password.length < 6) {
      setAuthError('Minimo 6 caracteres');
      return false;
    }

    if ((email || '').trim().toLowerCase() === adminEmail) {
      setAuthError('Ese correo esta reservado para el administrador');
      return false;
    }

    const res = await registerUser({ name, email, password });
    if (!res.ok) {
      setAuthError(res.message || 'No se pudo crear la cuenta');
      return false;
    }

    setUser(res.user);
    setAuthError('');
    return true;
  }, [adminEmail]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const addProduct = useCallback((input) => {
    const normalized = normalizeProductPayload(input);
    if (!normalized.name || !normalized.marca || !normalized.estilo || !normalized.img) {
      return { ok: false, message: 'Completa nombre, marca, estilo e imagen' };
    }

    let created = null;
    setProducts((prev) => {
      const maxId = prev.reduce((acc, p) => Math.max(acc, Number(p.id) || 0), 0);
      created = { id: maxId + 1, ...normalized };
      return [created, ...prev];
    });

    return { ok: true, product: created };
  }, []);

  const updateProduct = useCallback((id, input) => {
    const normalized = normalizeProductPayload(input);
    if (!normalized.name || !normalized.marca || !normalized.estilo || !normalized.img) {
      return { ok: false, message: 'Completa nombre, marca, estilo e imagen' };
    }

    let updated = null;
    setProducts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      updated = {
        ...p,
        ...normalized,
        imgs: normalized.img ? [normalized.img] : p.imgs,
      };
      return updated;
    }));

    if (!updated) return { ok: false, message: 'No se encontro el producto' };
    return { ok: true, product: updated };
  }, []);

  const deleteProduct = useCallback((id) => {
    let deleted = null;
    setProducts((prev) => {
      const next = prev.filter((p) => {
        if (p.id === id) {
          deleted = p;
          return false;
        }
        return true;
      });
      return next;
    });

    if (!deleted) return { ok: false, message: 'No se encontro el producto' };
    return { ok: true, product: deleted };
  }, []);

  // ── Moto seleccionada ─────────────────────────────────────
  const [selectedMoto, setSelectedMoto] = useState(null);

  // ── Favoritos ─────────────────────────────────────────────
  const [favs, setFavs] = useState([]);
  const toggleFav = useCallback((id) => {
    setFavs(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  // ── Simulador financiamiento ─────────────────────────────
  const [financiamiento, setFinanciamiento] = useState({
    enganche: 3000,
    plazo: 24,
    banco: 'BBVA',
    motoId: null,
  });

  // ── Notificaciones ────────────────────────────────────────
  const [notif, setNotif] = useState({ show: false, text: '', type: 'info' });
  const showNotif = useCallback((text, type = 'success') => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotif({ show: true, text, type });
    notifTimerRef.current = setTimeout(() => {
      setNotif((n) => ({ ...n, show: false }));
      notifTimerRef.current = null;
    }, 2800);
  }, []);

  useEffect(() => () => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
  }, []);

  return (
    <AppContext.Provider value={{
      user, authLoading, isAdmin, adminEmail, login, register, logout, authError, setAuthError,
      products, addProduct, updateProduct, deleteProduct, dashboardStats,
      selectedMoto, setSelectedMoto,
      favs, toggleFav,
      financiamiento, setFinanciamiento,
      notif, showNotif,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
