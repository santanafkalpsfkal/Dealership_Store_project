import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import s from './Navbar.module.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout, favs, isAdmin } = useApp();

  const links = [
    { label: 'Inicio',          path: '/' },
    { label: 'Catálogo',        path: '/catalogo' },
    { label: 'Financiamiento',  path: '/financiamiento' },
    { label: 'Contacto',        path: '/contacto' },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin' }] : []),
  ];

  return (
    <nav className={s.nav}>
      <div className={s.logo} onClick={() => navigate('/')}>
        <span className={s.logoIcon}>🏍️</span>
        <span className={s.logoText}>Motor<span className={s.logoAccent}>Place</span></span>
      </div>

      <ul className={s.links}>
        {links.map(l => (
          <li key={l.path}>
            <a
              href="#"
              className={pathname === l.path ? s.active : ''}
              onClick={e => { e.preventDefault(); navigate(l.path); }}
            >
              {l.label}
              {l.label === 'Catálogo' && <span className={s.linkArrow}>▾</span>}
            </a>
          </li>
        ))}
      </ul>

      <div className={s.actions}>
        <button className={s.iconBtn} onClick={() => navigate('/catalogo')} title="Buscar">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>

        <button className={s.iconBtn} onClick={() => navigate('/catalogo')} title="Favoritos" style={{position:'relative'}}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {favs.length > 0 && <span className={s.badge}>{favs.length}</span>}
        </button>

        <button className={s.iconBtn} onClick={() => navigate('/catalogo')} title="Comparar">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 20V10M12 20V4M6 20v-6"/>
          </svg>
        </button>

        {user ? (
          <div className={s.userMenu}>
            <button className={s.avatarBtn}>
              <div className={s.avatar}>{user.name[0].toUpperCase()}</div>
              <span className={s.userName}>{user.name}</span>
              <span className={s.chevron}>▾</span>
            </button>
            <div className={s.dropdown}>
              <p className={s.dropEmail}>{user.email}</p>
              <hr className={s.dropDivider}/>
              <button className={s.dropItem} onClick={() => navigate('/catalogo')}>🏍️ Mis Favoritos</button>
              <button className={s.dropItem} onClick={() => navigate('/financiamiento')}>💰 Mi Financiamiento</button>
              {isAdmin && <button className={s.dropItem} onClick={() => navigate('/admin')}>🛠️ Panel Admin</button>}
              <button className={s.dropItem} onClick={async () => { await logout(); navigate('/'); }}>🚪 Cerrar Sesión</button>
            </div>
          </div>
        ) : (
          <button className={s.loginBtn} onClick={() => navigate('/login')}>
            Iniciar Sesión
          </button>
        )}
      </div>
    </nav>
  );
}
