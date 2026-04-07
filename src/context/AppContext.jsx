import { useEffect, useRef } from 'react';
import { logoutOnPageExit } from '../services/authClient';
import { useAppStore } from '../store/appStore';

const VISITS_STORAGE_KEY = 'mp_visits_v1';
const VISITORS_STORAGE_KEY = 'mp_unique_visitors_v1';
const ACTIVE_VISITORS_STORAGE_KEY = 'mp_active_visitors_v1';
const VISITOR_ID_KEY = 'mp_visitor_id_v1';

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
  const user = useAppStore((state) => state.user);
  const isAdmin = useAppStore((state) => state.isAdmin);
  const productsLength = useAppStore((state) => state.products.length);
  const adminIdleMinutes = useAppStore((state) => state.adminIdleMinutes);
  const userIdleMinutes = useAppStore((state) => state.userIdleMinutes);
  const logoutInFlight = useAppStore((state) => state.logoutInFlight);
  const logout = useAppStore((state) => state.logout);
  const showNotif = useAppStore((state) => state.showNotif);
  const clearNotifTimer = useAppStore((state) => state.clearNotifTimer);
  const refreshDashboardStats = useAppStore((state) => state.refreshDashboardStats);
  const getRegisteredUsersCount = useAppStore((state) => state.getRegisteredUsersCount);
  const bootstrapProducts = useAppStore((state) => state.bootstrapProducts);
  const bootstrapAuth = useAppStore((state) => state.bootstrapAuth);

  const inactivityTimerRef = useRef(null);

  useEffect(() => {
    bootstrapProducts();
    bootstrapAuth();
  }, [bootstrapProducts, bootstrapAuth]);

  useEffect(() => {
    return () => {
      clearNotifTimer();
    };
  }, [clearNotifTimer]);

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

      refreshDashboardStats({
        totalVisits: Number(localStorage.getItem(VISITS_STORAGE_KEY) || '0'),
        uniqueVisitors: safeParse(localStorage.getItem(VISITORS_STORAGE_KEY), []).length,
        activeVisitors: Object.keys(active).length || 1,
        registeredUsers: getRegisteredUsersCount(),
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
  }, [productsLength, getRegisteredUsersCount, refreshDashboardStats]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;

    const minutes = isAdmin ? adminIdleMinutes : userIdleMinutes;
    const timeoutMs = Math.max(1, minutes) * 60 * 1000;

    const clearTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };

    const scheduleLogout = () => {
      clearTimer();
      inactivityTimerRef.current = setTimeout(async () => {
        if (logoutInFlight) return;
        showNotif('Sesion cerrada por inactividad', 'warning');
        await logout();
      }, timeoutMs);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, scheduleLogout, { passive: true });
    });

    scheduleLogout();

    return () => {
      clearTimer();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, scheduleLogout);
      });
    };
  }, [user, isAdmin, adminIdleMinutes, userIdleMinutes, logout, logoutInFlight, showNotif]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user || !isAdmin) return;

    const handlePageExit = () => {
      logoutOnPageExit();
    };

    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);

    return () => {
      window.removeEventListener('pagehide', handlePageExit);
      window.removeEventListener('beforeunload', handlePageExit);
    };
  }, [user, isAdmin]);

  return children;
}

export const useApp = () => useAppStore();
