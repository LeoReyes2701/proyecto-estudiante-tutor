// Back/src/app.js
const express = require('express');
const path = require('path');

const app = express();

// --- Configuración básica
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

<<<<<<< HEAD
// --- Servir archivos estáticos del frontend (incluye /src para módulos cliente)
const frontPublic = path.resolve(__dirname, '..', '..', 'Front', 'public');
app.use(express.static(frontPublic));

// --- Middleware de protección (opcional, controlable por variable de entorno)
function requireAuth(req, res, next) {
  // Control de entorno: si REQUIRE_AUTH === 'true' se aplica protección estricta,
  // en desarrollo por defecto no bloquea para evitar la "pantalla en blanco".
  const enforce = String(process.env.REQUIRE_AUTH).toLowerCase() === 'true';

  // Si no se fuerza la autenticación, dejamos pasar (útil durante pruebas locales)
  if (!enforce) return next();

  // Lógica mínima: sesión o token Bearer
  if (req.session && req.session.user) return next();
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    // Aquí validarías el token real; en este archivo se permite pasar si existe
    // para que el backend no bloquee sin implementación de verificación.
    return next();
  }

  if (req.accepts('html')) return res.redirect('/login');
  return res.status(401).json({ error: 'No autorizado' });
}

// --- Rutas importadas (si existen en tu proyecto)
try {
  const indexRoutes = require('./routes/index');
  app.use('/', indexRoutes);
} catch (e) {
  // ignore if not present
}
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/auth', authRoutes);
} catch (e) {
  // ignore if not present
}

// --- Rutas de páginas (asegura que las HTML estén accesibles)
=======
// servir frontend (sin modificar front)
// Public: Front/public
app.use(express.static(path.resolve(__dirname, '..', '..', 'Front', 'public')));
// Assets (src JS/CSS): Front/src
app.use('/src', express.static(path.resolve(__dirname, '..', '..', 'Front', 'src')));

// Servir la página de crear cuenta (ruta pública) ANTES de montar routers que puedan capturar /
>>>>>>> b701ab0d1b93a7d4f5bb3547a98c857fbf9aa762
app.get('/crear-cuenta', (req, res) => {
  res.sendFile(path.join(frontPublic, 'crearCuenta.html'));
});

<<<<<<< HEAD
app.get('/login', (req, res) => {
  res.sendFile(path.join(frontPublic, 'login.html'));
});

// Protege /gestion.html solo si REQUIRE_AUTH=true
app.get('/gestion.html', requireAuth, (req, res) => {
  res.sendFile(path.join(frontPublic, 'gestion.html'));
});

// --- Endpoints auxiliares mínimos usados por gestion.js (puedes adaptar)
app.get('/auth/profile', (req, res) => {
  // Si tienes sesión real, devuelve el usuario; aquí devolvemos ejemplo si hay sesión
  if (req.session && req.session.user) return res.json(req.session.user);

  // Ejemplo de respuesta por defecto (útil para desarrollo)
  return res.json({
    userId: 'demo',
    email: 'demo@est.ucab.edu.ve',
    nombre: 'Demo',
    apellido: 'Usuario',
    rol: 'estudiante'
  });
});

app.get('/auth/user/:email', (req, res) => {
  // Endpoint de consulta por email (simulación). Integra con tu datastore en producción.
  const email = decodeURIComponent(req.params.email || '');
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  // Simulación: si contiene 'noexiste' devolvemos 404
  if (email.includes('noexiste')) return res.status(404).json({ error: 'No encontrado' });

  return res.json({
    userId: 'u-' + Date.now(),
    email,
    nombre: 'Nombre',
    apellido: 'Apellido',
    rol: 'tutor'
  });
});

app.post('/auth/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('sid');
      res.json({ ok: true, redirect: '/login' });
    });
    return;
  }
  res.json({ ok: true, redirect: '/login' });
});

// --- Manejo de errores mínimo
app.use((err, req, res, next) => {
  console.error(err && err.stack || err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
=======
// Servir la página de login (ruta pública)
app.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', '..', 'Front', 'public', 'logIn.html'));
});

app.get('/perfil', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', '..', 'Front', 'public', 'consultarPerfil.html'));
});

// Servir index público (raíz) apuntando a crearCuenta.html
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', '..', 'Front', 'public', 'crearCuenta.html'));
});

// Importar routers
const apiRoutes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');

// Montar routers con prefijos explícitos
app.use('/api', apiRoutes);    // rutas generales de API (evita colisiones con rutas públicas)
app.use('/auth', authRoutes);  // rutas de autenticación (registro/login)

module.exports = app;
>>>>>>> b701ab0d1b93a7d4f5bb3547a98c857fbf9aa762
