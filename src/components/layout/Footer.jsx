import { useNavigate } from 'react-router-dom';
import s from './Footer.module.css';

const LINKS = {
  'Catálogo':      ['Motos Nuevas', 'Motos Usadas', 'Deportivas', 'Naked', 'Adventure'],
  'Financiamiento': ['Simulador de crédito', 'Bancos aliados', 'Requisitos', 'Preguntas frecuentes'],
  'Empresa':       ['Sobre MotorPlace', 'Nuestras sucursales', 'Trabaja con nosotros', 'Blog de motos'],
};

const SOCIALS = [
  { icon: '📸', label: 'Instagram', url: '#' },
  { icon: '▶️',  label: 'YouTube',   url: '#' },
  { icon: '👍', label: 'Facebook',  url: '#' },
  { icon: '💬', label: 'WhatsApp',  url: 'https://wa.me/573000000000' },
];

export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className={s.footer}>

      {/* Strip */}
      <div className={s.strip}>
        <div className={s.stripItem}>🚚 Entrega a domicilio en toda Colombia</div>
        <div className={s.stripItem}>💰 Financiamiento en 24 horas</div>
        <div className={s.stripItem}>🔒 Compra 100% segura y documentada</div>
        <div className={s.stripItem}>⭐ +1200 clientes satisfechos</div>
      </div>

      {/* Main */}
      <div className={s.main}>

        {/* Brand */}
        <div className={s.brand}>
          <div className={s.logo} onClick={() => navigate('/')}>
            <span className={s.logoIcon}>🏍️</span>
            <span className={s.logoText}>Motor<span className={s.logoAccent}>Place</span></span>
          </div>
          <p className={s.brandDesc}>
            La plataforma líder en venta de motocicletas premium en Colombia. Financiamiento, garantía y entrega a domicilio.
          </p>
          <div className={s.socials}>
            {SOCIALS.map(sc => (
              <a key={sc.label} href={sc.url} target="_blank" rel="noreferrer"
                className={s.socialBtn} title={sc.label}>
                {sc.icon}
              </a>
            ))}
          </div>
          <div className={s.contact}>
            <p>📍 Colombia · Bogotá · Medellín · Cali</p>
            <p>💬 +57 300 000 0000 (WhatsApp)</p>
            <p>📧 ventas@motorplace.co</p>
            <p>🕐 Lun–Sab 8:00 AM – 7:00 PM</p>
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(LINKS).map(([title, items]) => (
          <div key={title} className={s.col}>
            <h4 className={s.colTitle}>{title}</h4>
            <ul className={s.colList}>
              {items.map(item => (
                <li key={item}>
                  <button className={s.colLink} onClick={() => navigate('/')}>{item}</button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter */}
        <div className={s.newsletter}>
          <h4 className={s.colTitle}>Novedades</h4>
          <p className={s.newsletterSub}>Entérate primero de nuevas llegadas y ofertas exclusivas.</p>
          <div className={s.newsletterForm}>
            <input type="email" className={s.newsletterInput} placeholder="tu@email.com" />
            <button className={s.newsletterBtn}>→</button>
          </div>
          <p className={s.newsletterNote}>Sin spam. Cancela cuando quieras.</p>

          <div className={s.marcas}>
            <p className={s.marcasLabel}>Marcas oficiales</p>
            <div className={s.marcasGrid}>
              {['Ducati','BMW','Kawasaki','Yamaha','Honda'].map(m => (
                <span key={m} className={s.marcaChip}>{m}</span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bancos */}
      <div className={s.bancosRow}>
        <p className={s.bancosLabel}>Financiamiento con:</p>
        <div className={s.bancos}>
          {['Santander','BBVA','Scotiabank','Banreservas','Itaú','BAZ'].map(b => (
            <span key={b} className={s.bancoChip}>{b}</span>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className={s.bottom}>
        <p className={s.copy}>© {year} MotorPlace. Todos los derechos reservados.</p>
        <div className={s.legal}>
          <button className={s.legalLink}>Términos y condiciones</button>
          <button className={s.legalLink}>Política de privacidad</button>
          <button className={s.legalLink}>Política de cookies</button>
        </div>
      </div>

    </footer>
  );
}
