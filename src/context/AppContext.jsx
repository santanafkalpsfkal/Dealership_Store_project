import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from '../services/authClient';

const AppContext = createContext(null);

export function AppProvider({ children }) {

  // ── Auth ──────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

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

    const res = await loginUser({ email, password });
    if (!res.ok) {
      setAuthError(res.message || 'No se pudo iniciar sesión');
      return false;
    }

    setUser(res.user);
    setAuthError('');
    return true;
  }, []);

  const register = useCallback(async (name, email, password) => {
    if (!name || !email || !password) {
      setAuthError('Completa todos los campos');
      return false;
    }
    if (password.length < 6) {
      setAuthError('Minimo 6 caracteres');
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
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
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
      user, authLoading, login, register, logout, authError, setAuthError,
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
