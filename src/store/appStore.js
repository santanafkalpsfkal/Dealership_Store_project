import { create } from 'zustand';
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

const FALLBACK_USERS_KEY = 'mp_users_v1';
const PRODUCTS_STORAGE_KEY = 'mp_products_v1';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@concesionario.com').trim().toLowerCase();
const ADMIN_IDLE_MINUTES = Number(import.meta.env.VITE_ADMIN_IDLE_MINUTES || 15);
const USER_IDLE_MINUTES = Number(import.meta.env.VITE_USER_IDLE_MINUTES || 60);

let notifTimer = null;

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function computeIsAdmin(user) {
  const role = String(user?.rol || '').toLowerCase();
  const email = String(user?.email || '').toLowerCase();
  return role === 'admin' || email === ADMIN_EMAIL;
}

function setUserState(set, user) {
  set({
    user,
    isAdmin: computeIsAdmin(user),
  });
}

export const useAppStore = create((set, get) => ({
  adminEmail: ADMIN_EMAIL,
  adminIdleMinutes: ADMIN_IDLE_MINUTES,
  userIdleMinutes: USER_IDLE_MINUTES,

  user: null,
  isAdmin: false,
  authLoading: true,
  authError: '',
  loggingIn: false,
  loggingOut: false,

  products: [],
  productsLoading: true,

  dashboardStats: {
    totalProducts: 0,
    totalVisits: 0,
    uniqueVisitors: 0,
    activeVisitors: 1,
    registeredUsers: 0,
  },

  selectedMoto: null,
  favs: [],
  financiamiento: {
    enganche: 3000,
    plazo: 24,
    banco: 'BBVA',
    motoId: null,
  },

  notif: { show: false, text: '', type: 'info' },
  logoutInFlight: false,

  setAuthError: (message) => set({ authError: message || '' }),

  showNotif: (text, type = 'success') => {
    if (notifTimer) clearTimeout(notifTimer);
    set({ notif: { show: true, text, type } });
    notifTimer = setTimeout(() => {
      set((state) => ({
        notif: { ...state.notif, show: false },
      }));
      notifTimer = null;
    }, 2800);
  },

  clearNotifTimer: () => {
    if (notifTimer) {
      clearTimeout(notifTimer);
      notifTimer = null;
    }
  },

  setSelectedMoto: (moto) => set({ selectedMoto: moto }),

  toggleFav: (id) => {
    set((state) => {
      const exists = state.favs.includes(id);
      return {
        favs: exists ? state.favs.filter((item) => item !== id) : [...state.favs, id],
      };
    });
  },

  setFinanciamiento: (value) => {
    set((state) => ({
      financiamiento: typeof value === 'function' ? value(state.financiamiento) : value,
    }));
  },

  refreshDashboardStats: (partial = {}) => {
    set((state) => ({
      dashboardStats: {
        ...state.dashboardStats,
        ...partial,
        totalProducts: state.products.length,
      },
    }));
  },

  bootstrapProducts: async () => {
    set({ productsLoading: true });

    try {
      const res = await listProducts();
      if (res.ok) {
        set({ products: res.products });
        if (typeof window !== 'undefined') {
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(res.products));
        }
      } else {
        set({ products: [] });
        if (typeof window !== 'undefined') {
          localStorage.removeItem(PRODUCTS_STORAGE_KEY);
        }
      }
    } catch {
      set({ products: [] });
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PRODUCTS_STORAGE_KEY);
      }
    } finally {
      set({ productsLoading: false });
      get().refreshDashboardStats();
    }
  },

  bootstrapAuth: async () => {
    const res = await getCurrentUser();
    if (res.ok) {
      setUserState(set, res.user);
      set({ authError: '' });
    }
    set({ authLoading: false });
  },

  login: async (email, password) => {
    if (!email || !password) {
      set({ authError: 'Completa todos los campos' });
      return { ok: false };
    }

    if (password.length < 6) {
      set({ authError: 'Contrasena muy corta' });
      return { ok: false };
    }

    const res = await loginUser({ email, password });
    if (!res.ok) {
      set({ authError: res.message || 'No se pudo iniciar sesion' });
      return { ok: false };
    }

    set({ loggingIn: true });
    await new Promise((resolve) => setTimeout(resolve, 240));
    setUserState(set, res.user);
    set({ authError: '', loggingIn: false });
    get().showNotif(`Inicio de sesion exitoso: ${res.user.name || res.user.email}`, 'success');

    return { ok: true, user: res.user };
  },

  register: async (name, email, password) => {
    if (!name || !email || !password) {
      set({ authError: 'Completa todos los campos' });
      return { ok: false };
    }

    if (password.length < 6) {
      set({ authError: 'Minimo 6 caracteres' });
      return { ok: false };
    }

    if ((email || '').trim().toLowerCase() === ADMIN_EMAIL) {
      set({ authError: 'Ese correo esta reservado para el administrador' });
      return { ok: false };
    }

    const res = await registerUser({ name, email, password });
    if (!res.ok) {
      set({ authError: res.message || 'No se pudo crear la cuenta' });
      return { ok: false };
    }

    setUserState(set, res.user);
    set({ authError: '' });
    return { ok: true, user: res.user };
  },

  logout: async () => {
    if (get().logoutInFlight) return;

    set({ logoutInFlight: true, loggingOut: true });
    get().showNotif('Cerrando sesion...', 'info');
    await new Promise((resolve) => setTimeout(resolve, 280));

    await logoutUser();
    setUserState(set, null);
    get().showNotif('Sesion cerrada correctamente', 'success');
    set({ loggingOut: false, logoutInFlight: false });
  },

  addProduct: async (input) => {
    try {
      const result = await createProduct(input);
      if (!result.ok) return result;

      set((state) => ({
        products: [result.product, ...state.products.filter((p) => p.id !== result.product.id)],
      }));
      get().refreshDashboardStats();
      return result;
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'No se pudo crear el producto',
      };
    }
  },

  updateProduct: async (id, input) => {
    const parsedId = Number(id);

    try {
      const result = await editProduct(parsedId, input);
      if (!result.ok) return result;

      set((state) => ({
        products: state.products.map((p) => (Number(p.id) === parsedId ? result.product : p)),
      }));
      return result;
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'No se pudo actualizar el producto',
      };
    }
  },

  deleteProduct: async (id) => {
    const parsedId = Number(id);

    try {
      const result = await removeProduct(parsedId);
      if (!result.ok) return result;

      set((state) => ({
        products: state.products.filter((p) => Number(p.id) !== parsedId),
      }));
      get().refreshDashboardStats();
      return result;
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'No se pudo eliminar el producto',
      };
    }
  },

  getRegisteredUsersCount: () => {
    if (typeof window === 'undefined') return 0;
    const fallbackUsers = safeParse(localStorage.getItem(FALLBACK_USERS_KEY), []);
    return fallbackUsers.length;
  },
}));