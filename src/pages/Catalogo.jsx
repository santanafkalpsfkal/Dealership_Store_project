import { useState, useMemo } from 'react';
import { MOTOS, MARCAS, ESTILOS, formatUSD } from '../data/motos';
import MotoCard from '../components/ui/MotoCard';
import s from './Catalogo.module.css';

const TIPOS_NAV = ['Moto', 'Ducati', 'Scooter', 'Estilo', 'Sección · Cortina', 'Sam ▾'];

export default function CatalogoPage() {
  const [marcasFilt,  setMarcasFilt]  = useState([]);
  const [estilosFilt, setEstilosFilt] = useState([]);
  const [precioMax,   setPrecioMax]   = useState(30000);
  const [precioMin,   setPrecioMin]   = useState(0);
  const [añoFilt,     setAñoFilt]     = useState('');
  const [conFin,      setConFin]      = useState(false);
  const [sortBy,      setSortBy]      = useState('relevancia');
  const [view,        setView]        = useState('grid'); // grid | list

  const toggleArr = (arr, set, val) =>
    set(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  const filtered = useMemo(() => {
    let res = [...MOTOS];
    if (marcasFilt.length)  res = res.filter(m => marcasFilt.includes(m.marca));
    if (estilosFilt.length) res = res.filter(m => estilosFilt.includes(m.estilo));
    if (conFin)             res = res.filter(m => m.financiamiento);
    if (añoFilt)            res = res.filter(m => String(m.año) === añoFilt);
    res = res.filter(m => m.precio >= precioMin && m.precio <= precioMax);
    if (sortBy === 'precio-asc')  res.sort((a, b) => a.precio - b.precio);
    if (sortBy === 'precio-desc') res.sort((a, b) => b.precio - a.precio);
    if (sortBy === 'rating')      res.sort((a, b) => b.rating - a.rating);
    return res;
  }, [marcasFilt, estilosFilt, conFin, añoFilt, precioMin, precioMax, sortBy]);

  return (
    <main className={s.page}>
      {/* ── Top nav tabs ── */}
      <div className={s.topBar}>
        <div className={s.topLeft}>
          <h1 className={s.title}>Catálogo</h1>
          <span className={s.count}>{filtered.length} motos encontradas</span>
        </div>
        <div className={s.topRight}>
          <select className={s.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="relevancia">Relevancia</option>
            <option value="precio-asc">Precio: Menor a mayor</option>
            <option value="precio-desc">Precio: Mayor a menor</option>
            <option value="rating">Mejor valoradas</option>
          </select>
          <button className={`${s.viewBtn} ${view === 'grid' ? s.viewActive : ''}`} onClick={() => setView('grid')}>⊞</button>
          <button className={`${s.viewBtn} ${view === 'list' ? s.viewActive : ''}`} onClick={() => setView('list')}>☰</button>
        </div>
      </div>

      <div className={s.layout}>
        {/* ── Sidebar ── */}
        <aside className={s.sidebar}>
          <div className={s.sideSection}>
            <p className={s.sideTitle}>📋 Catálogo</p>
            {['Moto','Scooter','ATV'].map(t => (
              <button key={t} className={s.sideItem}>{t}</button>
            ))}
          </div>

          <div className={s.sideSection}>
            <p className={s.sideTitle}>🏷️ Marca</p>
            {MARCAS.map(m => (
              <label key={m} className={s.checkRow}>
                <input type="checkbox" className={s.check}
                  checked={marcasFilt.includes(m)}
                  onChange={() => toggleArr(marcasFilt, setMarcasFilt, m)} />
                <span>{m}</span>
              </label>
            ))}
          </div>

          <div className={s.sideSection}>
            <p className={s.sideTitle}>🏍️ Estilo</p>
            {ESTILOS.map(e => (
              <label key={e} className={s.checkRow}>
                <input type="checkbox" className={s.check}
                  checked={estilosFilt.includes(e)}
                  onChange={() => toggleArr(estilosFilt, setEstilosFilt, e)} />
                <span>{e}</span>
              </label>
            ))}
          </div>

          <div className={s.sideSection}>
            <p className={s.sideTitle}>💲 Precio</p>
            <div className={s.rangeRow}>
              <span className={s.rangeVal}>{formatUSD(precioMin)}</span>
              <span className={s.rangeVal}>{formatUSD(precioMax)}</span>
            </div>
            <input type="range" className={s.range} min={0} max={30000} step={500}
              value={precioMax} onChange={e => setPrecioMax(+e.target.value)} />
          </div>

          <div className={s.sideSection}>
            <p className={s.sideTitle}>📅 Año</p>
            {['2023','2022','2021'].map(a => (
              <label key={a} className={s.checkRow}>
                <input type="radio" className={s.check}
                  checked={añoFilt === a}
                  onChange={() => setAñoFilt(añoFilt === a ? '' : a)} />
                <span>{a}</span>
              </label>
            ))}
          </div>

          <div className={s.sideSection}>
            <label className={s.checkRow}>
              <input type="checkbox" className={s.check}
                checked={conFin} onChange={() => setConFin(!conFin)} />
              <span>Con Financiamiento</span>
            </label>
          </div>

          {(marcasFilt.length || estilosFilt.length || conFin || añoFilt) ? (
            <button className={s.clearBtn}
              onClick={() => { setMarcasFilt([]); setEstilosFilt([]); setConFin(false); setAñoFilt(''); }}>
              ✕ Limpiar filtros
            </button>
          ) : null}
        </aside>

        {/* ── Grid ── */}
        <div className={s.results}>
          {filtered.length === 0 ? (
            <div className={s.empty}>
              <span className={s.emptyIcon}>🏍️</span>
              <p>No se encontraron motos con esos filtros</p>
            </div>
          ) : (
            <div className={view === 'grid' ? s.grid : s.list}>
              {filtered.map(m => <MotoCard key={m.id} moto={m} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
