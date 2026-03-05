import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';

import Navbar          from './components/layout/Navbar';
import Footer          from './components/layout/Footer';
import Toast           from './components/ui/Toast';

import HomePage        from './pages/Home';
import CatalogoPage    from './pages/Catalogo';
import DetallePage     from './pages/Detalle';
import FinanciamientoPage from './pages/Financiamiento';
import ContactoPage    from './pages/Contacto';
import LoginPage       from './pages/Login';
import AdminPage       from './pages/Admin';
import AdminEntrySkeleton from './components/ui/AdminEntrySkeleton';

import './styles/globals.css';

function WaFloat() {
  return (
    <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer"
      title="WhatsApp"
      style={{
        position:'fixed', bottom:24, right:24,
        width:56, height:56, background:'#25D366', borderRadius:'50%',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:26, textDecoration:'none',
        boxShadow:'0 4px 20px rgba(37,211,102,0.45)',
        zIndex:998, transition:'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
    >💬</a>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollToTopOnRoute />
        <Navbar />
        <Routes>
          <Route path="/"                element={<HomePage />} />
          <Route path="/catalogo"        element={<CatalogoPage />} />
          <Route path="/detalle"         element={<DetallePage />} />
          <Route path="/financiamiento"  element={<FinanciamientoPage />} />
          <Route path="/contacto"        element={<ContactoPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/admin"           element={<AdminGuard><AdminPage /></AdminGuard>} />
          <Route path="*"                element={<HomePage />} />
        </Routes>
        <Footer />
        <Toast />
        <WaFloat />
      </AppProvider>
    </BrowserRouter>
  );
}

function AdminGuard({ children }) {
  const { authLoading, user, isAdmin } = useApp();

  if (authLoading) {
    return <AdminEntrySkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ScrollToTopOnRoute() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
);
