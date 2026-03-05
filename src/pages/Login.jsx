import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import s from './Login.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, authError, setAuthError } = useApp();
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@motorplace.com';
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin#2026';
  const [mode,  setMode]  = useState('login');
  const [form,  setForm]  = useState({ name: '', email: '', password: '', confirm: '' });
  const [show,  setShow]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAdminEmail = (email) => (email || '').trim().toLowerCase() === adminEmail.trim().toLowerCase();

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setAuthError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    if (mode === 'login') {
      if (await login(form.email, form.password)) {
        navigate(isAdminEmail(form.email) ? '/admin' : '/');
      }
    } else {
      if (form.password !== form.confirm) {
        setAuthError('Las contraseñas no coinciden');
        setSubmitting(false);
        return;
      }
      if (await register(form.name, form.email, form.password)) navigate('/');
    }

    setSubmitting(false);
  };

  const switchMode = m => { setMode(m); setForm({ name:'', email:'', password:'', confirm:'' }); setAuthError(''); };

  return (
    <main className={s.page}>

      {/* Decorative panel */}
      <div className={s.panel}>
        <div className={s.panelInner}>
          <div className={s.panelLogo}>
            <span className={s.panelIcon}>🏍️</span>
            <span className={s.panelBrand}>Motor<span className={s.panelAccent}>Place</span></span>
          </div>
          <h2 className={s.panelTitle}>TU MOTO IDEAL<br/>TE ESPERA</h2>
          <p className={s.panelSub}>Accede a financiamiento exclusivo, seguimiento de pedidos y atención personalizada.</p>
          <div className={s.panelStats}>
            {[{ n:'500+', l:'Motos' }, { n:'6', l:'Bancos' }, { n:'24h', l:'Aprobación' }].map(st => (
              <div key={st.l} className={s.panelStat}>
                <span className={s.panelStatNum}>{st.n}</span>
                <span className={s.panelStatLabel}>{st.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className={s.card}>
        <div className={s.logo} onClick={() => navigate('/')}>
          <span>🏍️</span>
          <span className={s.logoText}>Motor<span className={s.logoAccent}>Place</span></span>
        </div>

        {/* Tabs */}
        <div className={s.tabs}>
          <button className={`${s.tab} ${mode === 'login' ? s.tabActive : ''}`} onClick={() => switchMode('login')}>
            Iniciar Sesión
          </button>
          <button className={`${s.tab} ${mode === 'register' ? s.tabActive : ''}`} onClick={() => switchMode('register')}>
            Crear Cuenta
          </button>
        </div>

        <form className={s.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className={s.field}>
              <label className={s.label}>Nombre completo</label>
              <div className={s.inputWrap}>
                <span className={s.inputIcon}>👤</span>
                <input className={s.input} type="text" name="name"
                  value={form.name} onChange={handleChange} placeholder="Juan García" />
              </div>
            </div>
          )}

          <div className={s.field}>
            <label className={s.label}>Correo electrónico</label>
            <div className={s.inputWrap}>
              <span className={s.inputIcon}>📧</span>
              <input className={s.input} type="email" name="email"
                value={form.email} onChange={handleChange} placeholder="juan@email.com" />
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label}>Contraseña</label>
            <div className={s.inputWrap}>
              <span className={s.inputIcon}>🔒</span>
              <input className={s.input} type={show ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange} placeholder="••••••••" />
              <button type="button" className={s.eyeBtn} onClick={() => setShow(!show)}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className={s.field}>
              <label className={s.label}>Confirmar contraseña</label>
              <div className={s.inputWrap}>
                <span className={s.inputIcon}>🔒</span>
                <input className={s.input} type={show ? 'text' : 'password'} name="confirm"
                  value={form.confirm} onChange={handleChange} placeholder="••••••••" />
              </div>
            </div>
          )}

          {authError && <p className={s.error}>⚠️ {authError}</p>}

          {mode === 'login' && (
            <button type="button" className={s.forgotBtn}>¿Olvidaste tu contraseña?</button>
          )}

          <button type="submit" className={s.submitBtn} disabled={submitting}>
            {submitting ? 'Procesando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>

          <div className={s.divider}><span>o continúa con</span></div>

          <div className={s.social}>
            <button type="button" className={s.socialBtn}><b>G</b> Google</button>
            <button type="button" className={s.socialBtn}><b>f</b> Facebook</button>
          </div>
        </form>

        <p className={s.terms}>
          Al continuar aceptas nuestros <button className={s.link}>Términos de Uso</button> y{' '}
          <button className={s.link}>Política de Privacidad</button>.
        </p>
        <p className={s.terms} style={{marginTop:'6px'}}>
          24 días siempre · Más garantías
        </p>
        <p className={s.terms} style={{marginTop:'6px'}}>
          Admin demo: <code>{adminEmail}</code> / <code>{adminPassword}</code>
        </p>
      </div>

    </main>
  );
}
