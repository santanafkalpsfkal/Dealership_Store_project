import { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
    const image = (input.img || '').trim();

    const next = {
      name: input.name.trim(),
      marca: input.marca.trim(),
      tipo: input.tipo.trim() || 'Moto',
      estilo: input.estilo.trim(),
      precio: Number(input.precio) || 0,
      cuota: Number(input.cuota) || 0,
      año: Number(input.año) || new Date().getFullYear(),
      km: Number(input.km) || 0,
      color: input.color.trim() || 'Negro',
      financiamiento: Boolean(input.financiamiento),
      estado: input.estado.trim() || 'Nuevo',
      rating: Number(input.rating) || 4.5,
      reseñas: Number(input.reseñas) || 0,
      img: image,
      imgs: image ? [image] : [],
      descripcion: input.descripcion.trim() || 'Moto agregada por el panel admin.',
      specs: {
        motor: input.motor?.trim() || 'N/D',
        potencia: input.potencia?.trim() || 'N/D',
        par: input.par?.trim() || 'N/D',
        peso: input.peso?.trim() || 'N/D',
        velocidad: input.velocidad?.trim() || 'N/D',
      },
      badge: input.badge?.trim() || null,
    };

    setProducts((prev) => {
      const maxId = prev.reduce((acc, p) => Math.max(acc, Number(p.id) || 0), 0);
      return [{ id: maxId + 1, ...next }, ...prev];
    });
  }, []);

  const updateProduct = useCallback((id, input) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const image = (input.img || '').trim();
      return {
        ...p,
        name: input.name.trim(),
        marca: input.marca.trim(),
        tipo: input.tipo.trim(),
        estilo: input.estilo.trim(),
        precio: Number(input.precio) || 0,
        cuota: Number(input.cuota) || 0,
        año: Number(input.año) || p.año,
        km: Number(input.km) || 0,
        color: input.color.trim(),
        financiamiento: Boolean(input.financiamiento),
        estado: input.estado.trim(),
        rating: Number(input.rating) || 0,
        reseñas: Number(input.reseñas) || 0,
        img: image,
        imgs: image ? [image] : p.imgs,
        descripcion: input.descripcion.trim(),
        specs: {
          motor: input.motor?.trim() || 'N/D',
          potencia: input.potencia?.trim() || 'N/D',
          par: input.par?.trim() || 'N/D',
          peso: input.peso?.trim() || 'N/D',
          velocidad: input.velocidad?.trim() || 'N/D',
        },
        badge: input.badge?.trim() || null,
      };
    }));
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
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
    setNotif({ show: true, text, type });
    setTimeout(() => setNotif(n => ({ ...n, show: false })), 2800);
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
