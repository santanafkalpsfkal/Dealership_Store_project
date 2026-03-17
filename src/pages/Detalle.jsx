import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MOTOS, formatUSD } from '../data/motos';
import MotoCard from '../components/ui/MotoCard';
import s from './Detalle.module.css';

const TABS = ['Opciones', 'Descripción', 'Recurrentes'];

export default function DetallePage() {
  const navigate  = useNavigate();
  const { selectedMoto, favs, toggleFav, showNotif, setSelectedMoto } = useApp();
  const moto = selectedMoto ?? MOTOS[0];
  const [activeImg,  setActiveImg]  = useState(0);
  const [activeTab,  setActiveTab]  = useState('Opciones');

  const isFav = favs.includes(moto.id);
  const similares = MOTOS.filter(m => m.estilo === moto.estilo && m.id !== moto.id).slice(0, 3);

  return (
    <main className={s.page}>
      {/* Breadcrumb */}
      <div className={s.crumb}>
        <button onClick={() => navigate('/')}>Inicio</button>
        <span>›</span>
        <button onClick={() => navigate('/catalogo')}>Catálogo</button>
        <span>›</span>
        <span className={s.crumbCurrent}>{moto.name}</span>
      </div>

      <div className={s.layout}>
        {/* ── Gallery ── */}
        <div className={s.gallery}>
          <div className={s.mainImgWrap}>
            <img src={moto.imgs?.[activeImg] ?? moto.img} alt={moto.name} className={s.mainImg}
              referrerPolicy="no-referrer"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'; }} />
            <button
              className={`${s.favBtn} ${isFav ? s.favActive : ''}`}
              onClick={() => { toggleFav(moto.id); showNotif(isFav ? 'Eliminado' : 'Guardado en favoritos'); }}
            >
              {isFav ? '♥' : '♡'}
            </button>
          </div>
          <div className={s.thumbs}>
            {(moto.imgs ?? [moto.img]).map((img, i) => (
              <div key={i} className={`${s.thumb} ${i === activeImg ? s.thumbActive : ''}`}
                onClick={() => setActiveImg(i)}>
                <img src={img} alt="" referrerPolicy="no-referrer" onError={e => { e.target.src = moto.img; }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Info ── */}
        <div className={s.info}>
          <div className={s.infoTop}>
            {/* Badges */}
            <div className={s.badges}>
              {moto.financiamiento && <span className={s.badgeGreen}>✅ Solo quedan unidades disponibles</span>}
              {moto.estado === 'Nuevo' && <span className={s.badgeOrange}>🔥 Entrega inmediata en toda Bolivia</span>}
            </div>
            <h1 className={s.name}>{moto.name}</h1>
            <p className={s.price}>{formatUSD(moto.precio)}</p>

            <div className={s.metaRow}>
              <span className={s.metaItem}>
                <span className={s.metaIcon}>⭐</span>
                {moto.rating} ({moto.reseñas} reseñas)
              </span>
              <span className={s.metaItem}>
                <span className={s.metaIcon}>📅</span>
                {moto.año}
              </span>
              <span className={s.metaItem}>
                <span className={s.metaIcon}>✅</span>
                {moto.estado}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className={s.ctaGroup}>
            <button className={s.btnOrange} onClick={() => navigate('/contacto')}>
              💬 Hablar con Asesor
            </button>
            <button className={s.btnGreen} onClick={() => navigate('/financiamiento')}>
              💰 Simular Crédito
            </button>
          </div>

          {/* Tabs */}
          <div className={s.tabs}>
            {TABS.map(t => (
              <button key={t}
                className={`${s.tab} ${activeTab === t ? s.tabActive : ''}`}
                onClick={() => setActiveTab(t)}>
                {t}
              </button>
            ))}
          </div>

          <div className={s.tabContent}>
            {activeTab === 'Opciones' && (
              <div className={s.specs}>
                {Object.entries(moto.specs).map(([k, v]) => (
                  <div key={k} className={s.specRow}>
                    <span className={s.specKey}>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                    <span className={s.specVal}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'Descripción' && (
              <p className={s.desc}>{moto.descripcion}</p>
            )}
            {activeTab === 'Recurrentes' && (
              <div className={s.recurrentes}>
                {['Seguro de vida incluido 1 año', 'Garantía de fábrica 2 años', 'Mantenimiento gratuito 6 meses', 'Documentación y traspaso incluido'].map(r => (
                  <div key={r} className={s.recRow}>
                    <span className={s.recIcon}>✅</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similares */}
      {similares.length > 0 && (
        <section className={s.similares}>
          <h2 className={s.similTitle}>Motos Similares</h2>
          <div className={s.similGrid}>
            {similares.map(m => (
              <MotoCard key={m.id} moto={m} compact onClick={() => { setSelectedMoto(m); navigate('/detalle'); }} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
