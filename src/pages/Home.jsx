import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOTOS, formatUSD } from '../data/motos';
import { useApp } from '../context/AppContext';
import MotoCard from '../components/ui/MotoCard';
import s from './Home.module.css';

/* ── Hero Carousel ── */
const SLIDES = [
  {
    id: 1, title: 'Encuentra tu\nMoto Ideal',
    sub: 'Más de 500 motos disponibles con financiamiento a tu medida.',
    cta1: { label: 'Ver Catálogo',    path: '/catalogo' },
    cta2: { label: 'Financiamiento',  path: '/financiamiento' },
    bg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600',
  },
  {
    id: 2, title: 'Deportivas\nde Alto Nivel',
    sub: 'Superbikes de las mejores marcas. Ducati, BMW, Kawasaki y más.',
    cta1: { label: 'Ver Deportivas',  path: '/catalogo' },
    cta2: { label: 'Simular Crédito', path: '/financiamiento' },
    bg: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600',
  },
  {
    id: 3, title: 'Financiamiento\nFlexible',
    sub: 'Cuotas desde $179/mes. Aprobación en 24 horas con los mejores bancos.',
    cta1: { label: 'Simular ahora',   path: '/financiamiento' },
    cta2: { label: 'Ver Catálogo',    path: '/catalogo' },
    bg: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1600',
  },
];

function HeroCarousel() {
  const navigate = useNavigate();
  const [cur, setCur] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = useCallback((idx) => {
    setFading(true);
    setTimeout(() => { setCur(idx); setFading(false); }, 300);
  }, []);

  const next = useCallback(() => goTo((cur + 1) % SLIDES.length), [cur, goTo]);
  const prev = useCallback(() => goTo((cur - 1 + SLIDES.length) % SLIDES.length), [cur, goTo]);

  useEffect(() => { const t = setInterval(next, 6000); return () => clearInterval(t); }, [next]);

  const slide = SLIDES[cur];

  return (
    <div className={s.hero}>
      {SLIDES.map((sl, i) => (
        <div key={sl.id} className={`${s.heroBg} ${i === cur ? s.heroBgActive : ''}`}
          style={{ backgroundImage: `url(${sl.bg})` }} />
      ))}
      <div className={s.heroOverlay} />

      <div className={`${s.heroContent} ${fading ? s.fade : ''}`}>
        <h1 className={s.heroTitle}>
          {slide.title.split('\n').map((l, i) => <span key={i}>{l}<br/></span>)}
        </h1>
        <p className={s.heroSub}>{slide.sub}</p>
        <div className={s.heroBtns}>
          <button className={s.btnOrange} onClick={() => navigate(slide.cta1.path)}>
            {slide.cta1.label}
          </button>
          <button className={s.btnGreen} onClick={() => navigate(slide.cta2.path)}>
            ✅ {slide.cta2.label}
          </button>
        </div>
      </div>

      <button className={`${s.arrow} ${s.arrowL}`} onClick={prev}>‹</button>
      <button className={`${s.arrow} ${s.arrowR}`} onClick={next}>›</button>

      <div className={s.dots}>
        {SLIDES.map((_, i) => (
          <button key={i} className={`${s.dot} ${i === cur ? s.dotActive : ''}`} onClick={() => goTo(i)} />
        ))}
      </div>

      <div className={s.progress}><div key={cur} className={s.progressBar} /></div>
    </div>
  );
}

/* ── Home page ── */
export default function HomePage() {
  const navigate = useNavigate();
  const { setSelectedMoto } = useApp();
  const ofertas = MOTOS.slice(0, 3);
  const populares = MOTOS.filter(m => m.rating >= 4.7);

  return (
    <main>
      <HeroCarousel />

      {/* Stats strip */}
      <div className={s.statsBar}>
        {[
          { num: '500+', label: 'Motos disponibles' },
          { num: '12',   label: 'Marcas premium' },
          { num: '6',    label: 'Bancos aliados' },
          { num: '24h',  label: 'Aprobación crédito' },
        ].map(st => (
          <div key={st.label} className={s.statItem}>
            <span className={s.statNum}>{st.num}</span>
            <span className={s.statLabel}>{st.label}</span>
          </div>
        ))}
      </div>

      {/* Ofertas Especiales */}
      <section className={s.section}>
        <div className={s.secHead}>
          <div>
            <span className={s.chip}>🔥 Destacadas</span>
            <h2 className={s.secTitle}>OFERTAS ESPECIALES</h2>
          </div>
          <button className={s.seeAll} onClick={() => navigate('/catalogo')}>Ver Todo →</button>
        </div>
        <div className={s.grid3}>
          {ofertas.map(m => <MotoCard key={m.id} moto={m} />)}
        </div>
      </section>

      {/* Banner financiamiento */}
      <section className={s.finBanner}>
        <div className={s.finLeft}>
          <span className={s.finChip}>💰 Financiamiento</span>
          <h3 className={s.finTitle}>CUOTAS DESDE<br/><span className={s.finAccent}>$179 / MES</span></h3>
          <p className={s.finSub}>Aprobación en 24h · Sin inicial · Tasas competitivas</p>
          <button className={s.btnOrange} onClick={() => navigate('/financiamiento')}>
            Simular mi crédito →
          </button>
        </div>
        <div className={s.finBanks}>
          {['Santander','BBVA','Scotiabank','Banreservas','BAZ'].map(b => (
            <span key={b} className={s.bankChip}>{b}</span>
          ))}
        </div>
      </section>

      {/* Más populares */}
      <section className={s.section}>
        <div className={s.secHead}>
          <div>
            <span className={s.chip}>⭐ Top Rated</span>
            <h2 className={s.secTitle}>MÁS POPULARES</h2>
          </div>
          <button className={s.seeAll} onClick={() => navigate('/catalogo')}>Ver Todo →</button>
        </div>
        <div className={s.grid4}>
          {populares.map(m => <MotoCard key={m.id} moto={m} compact />)}
        </div>
      </section>

      {/* Marcas */}
      <section className={s.marcas}>
        <p className={s.marcasLabel}>Marcas oficiales</p>
        <div className={s.marcasGrid}>
          {['🏍️ Ducati','🏍️ BMW','🏍️ Kawasaki','🏍️ Yamaha','🏍️ Honda','🏍️ Suzuki'].map(m => (
            <button key={m} className={s.marcaChip} onClick={() => navigate('/catalogo')}>{m}</button>
          ))}
        </div>
      </section>
    </main>
  );
}
