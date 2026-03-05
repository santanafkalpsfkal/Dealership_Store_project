# 🏍️ MotorPlace – Plataforma de Venta de Motocicletas

Aplicación React + Vite con arquitectura profesional. Tema oscuro con acento naranja.

---

## 🚀 Instalación

```bash
npm install
npm run dev
```

---

## 🔐 Autenticación (lista para Vercel Postgres)

El proyecto ahora incluye flujo real de login/registro con API serverless:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Variables de entorno

Copia `.env.example` y define:

- `POSTGRES_URL`
- `JWT_SECRET`

En Vercel, agrégalas en **Project Settings → Environment Variables**.

### Esquema SQL

Ejecuta `db/schema.sql` en tu instancia Postgres (o deja que el API cree la tabla `users` automáticamente al primer uso).

### Nota de desarrollo local

Si `/api` no está disponible (por ejemplo al correr solo `vite`), el frontend usa un fallback local (`localStorage`) para que login/registro sigan funcionando durante desarrollo.

---

## 📁 Estructura

```
motorplace/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                  ← Entrada + BrowserRouter + rutas
    │
    ├── context/
    │   └── AppContext.jsx        ← Auth, favoritos, financiamiento, notificaciones
    │
    ├── data/
    │   └── motos.js              ← Catálogo, marcas, bancos, helpers
    │
    ├── styles/
    │   └── globals.css           ← Variables CSS dark theme, tipografía, reset
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.jsx/css    ← Nav sticky, menú usuario, favoritos
    │   │   └── Footer.jsx/css    ← Footer completo con newsletter y bancos
    │   └── ui/
    │       ├── MotoCard.jsx/css  ← Tarjeta de moto reutilizable
    │       └── Toast.jsx/css     ← Notificación flotante
    │
    └── pages/
        ├── Home.jsx/css          ← Carrusel hero, ofertas, financiamiento, populares
        ├── Catalogo.jsx/css      ← Sidebar con filtros, grid/list, sort
        ├── Detalle.jsx/css       ← Galería, specs, tabs, similares
        ├── Financiamiento.jsx/css← Simulador interactivo con cálculo real
        ├── Contacto.jsx/css      ← Chat en vivo con asesor + WhatsApp
        └── Login.jsx/css         ← Login/Registro con panel decorativo
```

---

## ✨ Páginas y funcionalidades

| Ruta | Descripción |
|------|-------------|
| `/` | Inicio con carrusel hero (3 slides), stats, ofertas y financiamiento |
| `/catalogo` | Catálogo con sidebar de filtros (marca, estilo, precio, año), sort y grid/list |
| `/detalle` | Detalle de moto con galería, tabs (Opciones/Descripción/Recurrentes), similares |
| `/financiamiento` | Simulador de crédito con cálculo real de cuotas y selector de banco |
| `/contacto` | Chat en vivo con asesor, respuestas rápidas y WhatsApp |
| `/login` | Login y registro con panel decorativo de fondo |

## 🎨 Diseño
- **Tema**: Oscuro con acento naranja `#f97316`
- **Tipografía**: Barlow Condensed (títulos) + DM Sans (cuerpo)
- **Cards**: Hover con glow naranja
- **Carrusel**: Auto-play 6s, flechas, dots, barra de progreso
- **Simulador**: Cálculo real con amortización francesa
