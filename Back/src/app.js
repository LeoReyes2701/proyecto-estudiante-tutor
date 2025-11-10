// Back/src/app.js
const express = require('express');
const path = require('path');

const UserRepository = require('./repositories/UserRepository');
const TutoriaRepository = require('./repositories/TutoriaRepository');

const AuthController = require('./controllers/authController');
const TutoriaController = require('./controllers/tutoriaController');

const authRoutesFactory = require('./routes/authRoutes');
const tutoriaRoutesFactory = require('./routes/tutoriaRoutes');

const validation = require('./middleware/validation');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas estáticas: servir /src primero (módulos) y luego public
const frontPublic = path.resolve(__dirname, '..', '..', 'Front', 'public');
const frontSrc = path.resolve(__dirname, '..', '..', 'Front', 'src');

app.use('/src', express.static(frontSrc));
app.use(express.static(frontPublic));

if ((process.env.NODE_ENV || 'development') === 'development') {
  console.info('[app] static public:', frontPublic);
  console.info('[app] static src under /src:', frontSrc);
}

// Repositories
const userRepo = new UserRepository();
const tutoriaRepo = new TutoriaRepository();

// Controllers (inyección de dependencias)
const authcontroller = new AuthController({ userRepository: userRepo });
const tutoriaController = new TutoriaController({ tutoriaRepository: tutoriaRepo, userRepository: userRepo });

// Routes (API) - monta auth y tutoria routes
app.use('/auth', authRoutesFactory({
  authController: authcontroller,
  validateRegister: validation.validateRegister,
  validateLogin: validation.validateLogin
}));

app.use('/tutorias', tutoriaRoutesFactory({ tutoriaController, authMiddleware }));

// Helper: leer cookie 'usuario' desde header (base64 JSON)
function readUsuarioCookie(req) {
  const cookieHeader = req.headers.cookie || '';
  const parts = cookieHeader.split(';').map(p => p.trim()).filter(Boolean);
  const kv = parts.find(p => p.startsWith('usuario='));
  if (!kv) return null;
  const val = kv.split('=')[1];
  if (!val) return null;
  try {
    return JSON.parse(Buffer.from(val, 'base64').toString('utf8'));
  } catch (e) {
    return null;
  }
}

// Pages: servir archivos HTML explícitos que existen en Front/public
app.get(['/', '/index.html', '/login.html'], (req, res) => {
  return res.sendFile(path.join(frontPublic, 'login.html'));
});

// servir /login (sin .html) para compatibilidad con enlaces que usan /login
app.get('/login', (req, res) => {
  return res.sendFile(path.join(frontPublic, 'login.html'));
});

app.get('/crearCuenta.html', (req, res) => {
  return res.sendFile(path.join(frontPublic, 'crearCuenta.html'));
});

// gestión para TUTORES: requiere cookie usuario con rol 'tutor'
app.get('/gestion.html', (req, res) => {
  const user = readUsuarioCookie(req);
  if (!user) return res.redirect('/login.html');
  if (String(user.rol || '').toLowerCase() !== 'tutor') return res.redirect('/login.html');
  return res.sendFile(path.join(frontPublic, 'gestion.html'));
});

// gestión para ESTUDIANTES: requiere cookie usuario con rol 'estudiante'
app.get('/gestion_estudiante.html', (req, res) => {
  const user = readUsuarioCookie(req);
  if (!user) return res.redirect('/login.html');
  if (String(user.rol || '').toLowerCase() !== 'estudiante') return res.redirect('/login.html');
  return res.sendFile(path.join(frontPublic, 'gestion_estudiante.html'));
});

// proteger crearTutoria (ejemplo) -> solo tutores
app.get('/crearTutoria.html', (req, res) => {
  const user = readUsuarioCookie(req);
  if (!user) return res.redirect('/login.html');
  if (String(user.rol || '').toLowerCase() !== 'tutor') return res.redirect('/login.html');
  return res.sendFile(path.join(frontPublic, 'crearTutoria.html'));
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Optional: quick request logger for debugging (uncomment while debugging)
// app.use((req, res, next) => { console.log('[REQ]', req.method, req.url); next(); });

// Minimal error handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err && err.status ? err.status : 500;
  const payload = { error: err && err.message ? err.message : 'Internal server error' };
  if ((process.env.NODE_ENV || 'development') === 'development') payload.stack = err.stack;
  res.status(status).json(payload);
});

module.exports = app;