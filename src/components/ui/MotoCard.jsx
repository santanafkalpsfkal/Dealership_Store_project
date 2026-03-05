import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatUSD } from '../../data/motos';
import s from './MotoCard.module.css';

export default function MotoCard({ moto, compact = false }) {
  const navigate = useNavigate();
  const { favs, toggleFav, showNotif, setSelectedMoto } = useApp();
  const isFav = favs.includes(moto.id);

  const goDetail = () => {
    setSelectedMoto(moto);
    navigate('/detalle');
  };

  const handleFav = (e) => {
    e.stopPropagation();
    toggleFav(moto.id);
    showNotif(isFav ? 'Eliminado de favoritos' : `${moto.name} guardado`, isFav ? 'info' : 'success');
  };

  const BADGE_COLORS = {
    'Más popular':  '#22c55e',
    'Financiamiento': '#f97316',
    'Súper oferta': '#ef4444',
    'Seminueva':    '#f59e0b',
  };

  return (
    <div className={`${s.card} ${compact ? s.compact : ''}`} onClick={goDetail}>
      {/* Imagen */}
      <div className={s.imgWrap}>
        <img src={moto.img} alt={moto.name} className={s.img} loading="lazy"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'; }} />
        <div className={s.imgOverlay} />

        {moto.badge && (
          <span className={s.badge} style={{ background: BADGE_COLORS[moto.badge] || '#f97316' }}>
            {moto.badge}
          </span>
        )}

        <button className={`${s.favBtn} ${isFav ? s.favActive : ''}`} onClick={handleFav}>
          {isFav ? '♥' : '♡'}
        </button>

        {moto.estado === 'Usado' && <span className={s.usadoBadge}>Seminueva</span>}
      </div>

      {/* Info */}
      <div className={s.info}>
        <p className={s.marca}>{moto.marca} · {moto.estilo}</p>
        <h3 className={s.name}>{moto.name}</h3>
        <p className={s.price}>{formatUSD(moto.precio)}</p>

        {moto.financiamiento && (
          <p className={s.cuota}>
            <span className={s.cuotaIcon}>💳</span>
            Financiamiento desde <strong>{formatUSD(moto.cuota)}/mes</strong>
          </p>
        )}

        <div className={s.tags}>
          <span className={s.tag}>🗓️ {moto.año}</span>
          <span className={s.tag}>⚡ {moto.specs.potencia}</span>
          <span className={`${s.tag} ${moto.estado === 'Nuevo' ? s.tagGreen : s.tagOrange}`}>
            {moto.estado}
          </span>
        </div>

        {!compact && (
          <button className={s.cta} onClick={goDetail}>Ver Detalle →</button>
        )}
      </div>
    </div>
  );
}
