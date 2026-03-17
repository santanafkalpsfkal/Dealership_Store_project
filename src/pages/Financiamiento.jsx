import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BANCOS, formatUSD } from '../data/motos';
import { useApp } from '../context/AppContext';
import s from './Financiamiento.module.css';

const PLAZOS = [12, 18, 24, 36, 48, 60];
const TASA_ANUAL = 0.14; // 14% anual

export default function FinanciamientoPage() {
  const navigate = useNavigate();
  const { products } = useApp();
  const [enganche, setEnganche] = useState(3000);
  const [plazo,    setPlazo]    = useState(24);
  const [banco,    setBanco]    = useState('BBVA');
  const [motoId,   setMotoId]   = useState(null);

  useEffect(() => {
    if (!products.length) return;
    const exists = products.some((item) => item.id === motoId);
    if (!exists) {
      setMotoId(products[0].id);
    }
  }, [products, motoId]);

  const moto = products.find((m) => m.id === motoId) ?? products[0];

  if (!moto) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <div className={s.headerLeft}>
            <span className={s.chip}>💰 Simulador</span>
            <h1 className={s.title}>FINANCIAMIENTO</h1>
            <p className={s.sub}>No hay motos activas en la base de datos para simular.</p>
          </div>
        </div>
      </main>
    );
  }

  const { cuotaMensual, totalPagar, interesTotal } = useMemo(() => {
    const capital  = Math.max(0, moto.precio - enganche);
    const tasaMes  = TASA_ANUAL / 12;
    const cuota    = capital > 0
      ? (capital * tasaMes * Math.pow(1 + tasaMes, plazo)) / (Math.pow(1 + tasaMes, plazo) - 1)
      : 0;
    const total    = cuota * plazo + enganche;
    const interes  = total - moto.precio;
    return { cuotaMensual: cuota, totalPagar: total, interesTotal: interes };
  }, [moto.precio, enganche, plazo]);

  const engancheMax = Math.round(moto.precio * 0.7);

  return (
    <main className={s.page}>

      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.chip}>💰 Simulador</span>
          <h1 className={s.title}>FINANCIAMIENTO</h1>
          <p className={s.sub}>Calcula tu cuota mensual y elige el plan ideal para ti.</p>
        </div>
        <div className={s.headerStats}>
          <div className={s.hStat}>
            <span className={s.hStatNum}>6</span>
            <span className={s.hStatLabel}>Bancos aliados</span>
          </div>
          <div className={s.hStat}>
            <span className={s.hStatNum}>24h</span>
            <span className={s.hStatLabel}>Aprobación</span>
          </div>
          <div className={s.hStat}>
            <span className={s.hStatNum}>0%</span>
            <span className={s.hStatLabel}>Comisión apertura</span>
          </div>
        </div>
      </div>

      <div className={s.layout}>

        {/* ── Simulador ── */}
        <div className={s.simulator}>
          <div className={s.simHeader}>
            <span className={s.simIcon}>💰</span>
            <h2 className={s.simTitle}>Financiamiento</h2>
            <div className={s.simBadges}>
              <span className={s.simBadge}>✅ Pago inicial</span>
              <span className={s.simBadgeAlt}>🔴 Reset Ahorro</span>
            </div>
          </div>

          {/* Moto selector */}
          <div className={s.field}>
            <label className={s.label}>Selecciona la moto</label>
            <select className={s.select} value={motoId} onChange={e => setMotoId(+e.target.value)}>
              {products.map(m => (
                <option key={m.id} value={m.id}>{m.name} — {formatUSD(m.precio)}</option>
              ))}
            </select>
          </div>

          {/* Moto preview */}
          <div className={s.motoPreview}>
            <img src={moto.img} alt={moto.name} className={s.previewImg}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'; }} />
            <div className={s.previewInfo}>
              <p className={s.previewName}>{moto.name}</p>
              <p className={s.previewPrice}>{formatUSD(moto.precio)}</p>
            </div>
          </div>

          {/* Enganche slider */}
          <div className={s.field}>
            <div className={s.sliderHead}>
              <label className={s.label}>Monto de Inicio (Enganche)</label>
              <div className={s.sliderVal}>
                <span className={s.sliderNum}>{formatUSD(enganche)}</span>
                <button className={s.sliderArrow}>›</button>
              </div>
            </div>
            <p className={s.sliderSub}>Monto mínimo recomendado</p>
            <input type="range" className={s.range}
              min={0} max={engancheMax} step={100}
              value={enganche} onChange={e => setEnganche(+e.target.value)} />
            <div className={s.rangeLabels}>
              <span>$0</span><span>{formatUSD(engancheMax)}</span>
            </div>
          </div>

          {/* Plazo */}
          <div className={s.field}>
            <label className={s.label}>Plazo (meses)</label>
            <div className={s.plazoBtns}>
              {PLAZOS.map(p => (
                <button key={p}
                  className={`${s.plazoBtn} ${plazo === p ? s.plazoBtnActive : ''}`}
                  onClick={() => setPlazo(p)}>
                  {p} <span className={s.plazoSub}>{p < 24 ? 'meses' : p < 36 ? 'año' : 'años'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Resultado cuota */}
          <div className={s.cuotaResult}>
            <div className={s.cuotaMain}>
              <span className={s.cuotaLabel}>Cuota mensual estimada</span>
              <span className={s.cuotaNum}>{formatUSD(Math.round(cuotaMensual))}</span>
              <span className={s.cuotaPer}>/ mes</span>
            </div>
            <button className={s.cuotaArrow} onClick={() => navigate('/contacto')}>›</button>
          </div>

          {/* Bancos */}
          <div className={s.field}>
            <label className={s.label}>Banco preferido</label>
            <div className={s.bancosGrid}>
              {BANCOS.map(b => (
                <button key={b}
                  className={`${s.bancoBtn} ${banco === b ? s.bancoBtnActive : ''}`}
                  onClick={() => setBanco(b)}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <p className={s.disclaimer}>
            Comparativa al financiamiento únicamente. Los términos exactos dependen del banco seleccionado. ● Seguros ● Marcas Motor
          </p>
        </div>

        {/* ── Resumen ── */}
        <div className={s.summary}>
          <h3 className={s.summaryTitle}>Resumen del Crédito</h3>

          <div className={s.summaryMoto}>
            <img src={moto.img} alt={moto.name} className={s.summaryImg}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'; }} />
            <div>
              <p className={s.summaryMotoName}>{moto.name}</p>
              <p className={s.summaryMotoPrice}>{formatUSD(moto.precio)}</p>
            </div>
          </div>

          <div className={s.summaryRows}>
            {[
              { label: 'Precio de la moto',  val: formatUSD(moto.precio) },
              { label: 'Enganche',           val: formatUSD(enganche) },
              { label: 'Monto a financiar',  val: formatUSD(Math.max(0, moto.precio - enganche)) },
              { label: 'Plazo',              val: `${plazo} meses` },
              { label: 'Banco',              val: banco },
              { label: 'Tasa anual est.',    val: `${TASA_ANUAL * 100}%` },
            ].map(r => (
              <div key={r.label} className={s.summaryRow}>
                <span className={s.summaryKey}>{r.label}</span>
                <span className={s.summaryVal}>{r.val}</span>
              </div>
            ))}
            <div className={`${s.summaryRow} ${s.summaryTotal}`}>
              <span>Total a pagar</span>
              <span>{formatUSD(Math.round(totalPagar))}</span>
            </div>
            <div className={`${s.summaryRow} ${s.summaryInterest}`}>
              <span>Intereses</span>
              <span>+{formatUSD(Math.round(interesTotal))}</span>
            </div>
          </div>

          <button className={s.applyBtn} onClick={() => navigate('/contacto')}>
            💬 Hablar con un Asesor
          </button>
          <button className={s.catalogBtn} onClick={() => navigate('/catalogo')}>
            Ver Catálogo →
          </button>

          {/* Proceso */}
          <div className={s.proceso}>
            <p className={s.procesoTitle}>¿Cómo es el proceso?</p>
            {[
              { n: '01', t: 'Selecciona tu moto', s: 'Elige del catálogo' },
              { n: '02', t: 'Llena tu solicitud',  s: 'En menos de 5 min' },
              { n: '03', t: 'Aprobación rápida',   s: 'Respuesta en 24h' },
              { n: '04', t: '¡Recibe tu moto!',    s: 'Entrega a domicilio' },
            ].map(p => (
              <div key={p.n} className={s.procesoStep}>
                <span className={s.procesoNum}>{p.n}</span>
                <div>
                  <p className={s.procesoT}>{p.t}</p>
                  <p className={s.procesoS}>{p.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
