import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from '../services/authClient';
import {
  listProducts,
  createProduct,
  editProduct,
  removeProduct,
} from '../services/productsClient';

const AppContext = createContext(null);
const VISITS_STORAGE_KEY = 'mp_visits_v1';
const VISITORS_STORAGE_KEY = 'mp_unique_visitors_v1';
const ACTIVE_VISITORS_STORAGE_KEY = 'mp_active_visitors_v1';
const VISITOR_ID_KEY = 'mp_visitor_id_v1';
const FALLBACK_USERS_KEY = 'mp_users_v1';
const PRODUCTS_STORAGE_KEY = 'mp_products_v1';

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function createVisitorId() {
  return `v_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function AppProvider({ children }) {
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@concesionario.com').trim().toLowerCase();
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

  // ── Auth ──────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ── Productos (CRUD Admin) ────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // ── Dashboard Stats ────────────────────────────────────────
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: products.length,
    totalVisits: 0,
    uniqueVisitors: 0,
    activeVisitors: 1,
    registeredUsers: 0,
  });

  const isAdmin = Boolean(
    (user?.rol && String(user.rol).toLowerCase() === 'admin')
      || (user?.email && user.email.toLowerCase() === adminEmail)
  );
  const notifTimerRef = useRef(null);

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

    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await listProducts();
        if (!mounted) return;
        if (res.ok) {
          setProducts(res.products);
          if (typeof window !== 'undefined') {
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(res.products));
          }
        } else {
          setProducts([]);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(PRODUCTS_STORAGE_KEY);
          }
        }
      } catch {
        if (mounted) {
          setProducts([]);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(PRODUCTS_STORAGE_KEY);
          }
        }
      } finally {
        if (mounted) setProductsLoading(false);
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

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
      setAuthError('Contraseña muy corta');
      return false;
    }

    const res = await loginUser({ email, password });
    if (!res.ok) {
      setAuthError(res.message || 'No se pudo iniciar sesión');
      return { ok: false };
    }

    setLoggingIn(true);
    await new Promise((resolve) => setTimeout(resolve, 240));
    setUser(res.user);
    setAuthError('');
    showNotif(`Inicio de sesión exitoso: ${res.user.name || res.user.email}`, 'success');
    setLoggingIn(false);
    return { ok: true, user: res.user };
  }, [showNotif]);

  const register = useCallback(async (name, email, password) => {
    if (!name || !email || !password) {
      setAuthError('Completa todos los campos');
      return { ok: false };
    }
    if (password.length < 6) {
      setAuthError('Minimo 6 caracteres');
      return { ok: false };
    }

    if ((email || '').trim().toLowerCase() === adminEmail) {
      setAuthError('Ese correo esta reservado para el administrador');
      return { ok: false };
    }

    const res = await registerUser({ name, email, password });
    if (!res.ok) {
      setAuthError(res.message || 'No se pudo crear la cuenta');
      return { ok: false };
    }

    setUser(res.user);
    setAuthError('');
    return { ok: true, user: res.user };
  }, [adminEmail]);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    showNotif('Cerrando sesión...', 'info');
    await new Promise((resolve) => setTimeout(resolve, 280));
    await logoutUser();
    setUser(null);
    showNotif('Sesión cerrada correctamente', 'success');
    setLoggingOut(false);
  }, [showNotif]);

  const addProduct = useCallback((input) => {
    return createProduct(input).then((result) => {
      if (!result.ok) return result;
      setProducts((prev) => [result.product, ...prev.filter((p) => p.id !== result.product.id)]);
      return result;
    }).catch((error) => ({
      ok: false,
      message: error.message || 'No se pudo crear el producto',
    }));
  }, []);

  const updateProduct = useCallback((id, input) => {
    const parsedId = Number(id);
    return editProduct(parsedId, input).then((result) => {
      if (!result.ok) return result;
      setProducts((prev) => prev.map((p) => (Number(p.id) === parsedId ? result.product : p)));
      return result;
    }).catch((error) => ({
      ok: false,
      message: error.message || 'No se pudo actualizar el producto',
    }));
  }, []);

  const deleteProduct = useCallback((id) => {
    const parsedId = Number(id);
    return removeProduct(parsedId).then((result) => {
      if (!result.ok) return result;
      setProducts((prev) => prev.filter((p) => Number(p.id) !== parsedId));
      return result;
    }).catch((error) => ({
      ok: false,
      message: error.message || 'No se pudo eliminar el producto',
    }));
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

  return (
    <AppContext.Provider value={{
      user, authLoading, loggingIn, loggingOut, isAdmin, adminEmail, login, register, logout, authError, setAuthError,
      products, productsLoading, addProduct, updateProduct, deleteProduct, dashboardStats,
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
