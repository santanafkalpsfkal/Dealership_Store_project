import { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatUSD } from '../data/motos';
import s from './Admin.module.css';

const EMPTY_FORM = {
  name: '',
  marca: '',
  tipo: 'Moto',
  estilo: '',
  precio: '',
  cuota: '',
  ano: '',
  km: '',
  color: 'Negro',
  financiamiento: true,
  estado: 'Nuevo',
  rating: '4.5',
  resenas: '0',
  img: '',
  descripcion: '',
  motor: '',
  potencia: '',
  par: '',
  peso: '',
  velocidad: '',
  badge: '',
};

export default function AdminPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    dashboardStats,
    showNotif,
    adminEmail,
  } = useApp();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);

  const topBrands = useMemo(() => {
    const map = products.reduce((acc, p) => {
      const key = p.marca || 'Sin marca';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [products]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      marca: product.marca || '',
      tipo: product.tipo || 'Moto',
      estilo: product.estilo || '',
      precio: String(product.precio ?? ''),
      cuota: String(product.cuota ?? ''),
      ano: String(product.año ?? ''),
      km: String(product.km ?? ''),
      color: product.color || '',
      financiamiento: Boolean(product.financiamiento),
      estado: product.estado || 'Nuevo',
      rating: String(product.rating ?? ''),
      resenas: String(product.reseñas ?? ''),
      img: product.img || '',
      descripcion: product.descripcion || '',
      motor: product.specs?.motor || '',
      potencia: product.specs?.potencia || '',
      par: product.specs?.par || '',
      peso: product.specs?.peso || '',
      velocidad: product.specs?.velocidad || '',
      badge: product.badge || '',
    });
    showNotif(`Editando: ${product.name}`, 'info');

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      const result = updateProduct(editingId, form);
      if (!result.ok) {
        showNotif(result.message, 'error');
        return;
      }
      showNotif(`Producto actualizado: ${result.product.name}`, 'success');
    } else {
      const result = addProduct(form);
      if (!result.ok) {
        showNotif(result.message, 'error');
        return;
      }
      showNotif(`Producto agregado: ${result.product.name}`, 'success');
    }

    resetForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Seguro que deseas eliminar este producto?')) return;
    const result = deleteProduct(id);
    if (!result.ok) {
      showNotif(result.message, 'error');
      return;
    }
    if (editingId === id) resetForm();
    showNotif(`Producto eliminado: ${result.product.name}`, 'warning');
  };

  return (
    <main className={s.page}>
      <section className={s.header}>
        <div>
          <p className={s.kicker}>Panel de Administracion</p>
          <h1>Dashboard + CRUD de Catalogo</h1>
          <p className={s.sub}>Acceso exclusivo para admin: {adminEmail}</p>
        </div>
      </section>

      <section className={s.stats}>
        <article className={s.card}><p>Productos</p><strong>{products.length}</strong></article>
        <article className={s.card}><p>Visitas totales</p><strong>{dashboardStats.totalVisits}</strong></article>
        <article className={s.card}><p>Usuarios activos</p><strong>{dashboardStats.activeVisitors}</strong></article>
        <article className={s.card}><p>Usuarios registrados</p><strong>{dashboardStats.registeredUsers}</strong></article>
      </section>

      <section className={s.grid}>
        <form className={s.form} onSubmit={handleSubmit} ref={formRef}>
          <div className={s.formHead}>
            <h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
            {editingId && <button type="button" onClick={resetForm} className={s.ghostBtn}>Cancelar</button>}
          </div>

          <div className={s.fields}>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" />
            <input name="marca" value={form.marca} onChange={handleChange} placeholder="Marca" />
            <input name="estilo" value={form.estilo} onChange={handleChange} placeholder="Estilo" />
            <input name="tipo" value={form.tipo} onChange={handleChange} placeholder="Tipo" />
            <input name="precio" type="number" value={form.precio} onChange={handleChange} placeholder="Precio" />
            <input name="cuota" type="number" value={form.cuota} onChange={handleChange} placeholder="Cuota" />
            <input name="ano" type="number" value={form.ano} onChange={handleChange} placeholder="Ano" />
            <input name="km" type="number" value={form.km} onChange={handleChange} placeholder="KM" />
            <input name="color" value={form.color} onChange={handleChange} placeholder="Color" />
            <input name="estado" value={form.estado} onChange={handleChange} placeholder="Estado" />
            <input name="rating" type="number" step="0.1" value={form.rating} onChange={handleChange} placeholder="Rating" />
            <input name="resenas" type="number" value={form.resenas} onChange={handleChange} placeholder="Resenas" />
            <input className={s.full} name="img" value={form.img} onChange={handleChange} placeholder="URL imagen" />
            <textarea className={s.full} name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} placeholder="Descripcion" />
            <input name="motor" value={form.motor} onChange={handleChange} placeholder="Motor" />
            <input name="potencia" value={form.potencia} onChange={handleChange} placeholder="Potencia" />
            <input name="par" value={form.par} onChange={handleChange} placeholder="Par" />
            <input name="peso" value={form.peso} onChange={handleChange} placeholder="Peso" />
            <input name="velocidad" value={form.velocidad} onChange={handleChange} placeholder="Velocidad" />
            <input name="badge" value={form.badge} onChange={handleChange} placeholder="Badge (opcional)" />
          </div>

          <label className={s.checkRow}>
            <input type="checkbox" name="financiamiento" checked={form.financiamiento} onChange={handleChange} />
            <span>Disponible para financiamiento</span>
          </label>

          <button className={s.submitBtn} type="submit">
            {editingId ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </form>

        <aside className={s.side}>
          <h3>Concurrencia y tendencia</h3>
          <p>Visitantes unicos: <b>{dashboardStats.uniqueVisitors}</b></p>
          <p>Usuarios activos (ult. 2 min): <b>{dashboardStats.activeVisitors}</b></p>
          <p>Catalogo total: <b>{dashboardStats.totalProducts}</b></p>
          <div className={s.brands}>
            <p>Top marcas</p>
            {topBrands.map(([brand, count]) => (
              <div key={brand} className={s.brandRow}>
                <span>{brand}</span>
                <b>{count}</b>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className={s.tableWrap}>
        <h2>Productos del catalogo</h2>
        <table className={s.table}>
          <thead>
            <tr>
              <th>ID</th><th>Producto</th><th>Marca</th><th>Precio</th><th>Ano</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.marca}</td>
                <td>{formatUSD(Number(p.precio) || 0)}</td>
                <td>{p.año}</td>
                <td className={s.actions}>
                  <button type="button" onClick={() => handleEdit(p)} className={s.editBtn}>Editar</button>
                  <button type="button" onClick={() => handleDelete(p.id)} className={s.deleteBtn}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
