// Back/src/app.js
const express = require('express');
const path = require('path');

const UserRepository = require('./repositories/UserRepository');
const TutoriaRepository = require('./repositories/TutoriaRepository');
const ScheduleRepository = require('./repositories/ScheduleRepository');
const InscripcionRepository = require('./repositories/InscripcionRepository');

const AuthController = require('./controllers/authController');
const TutoriaController = require('./controllers/tutoriaController');
const inscripcionControllerModule = require('./controllers/inscripcionController');
const scheduleControllerModule = require('./controllers/scheduleController');
const scheduleRoutesModule = require('./routes/scheduleRoutes');

const authRoutesFactory = require('./routes/authRoutes');
const tutoriaRoutesFactory = require('./routes/tutoriaRoutes');
const inscripcionRoutesModule = require('./routes/inscripcionRoutes');

const validation = require('./middleware/validation');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// App-level incoming logger (muy útil para depuración inicial)
app.use((req, res, next) => {
  console.log('[incoming] %s %s headers: cookie=%s authorization=%s',
    req.method,
    req.url,
    !!req.headers.cookie,
    !!req.headers.authorization
  );
  next();
});

// Rutas estáticas: ubicaciones del front
const frontPublic = path.resolve(__dirname, '..', '..', 'Front', 'public');
const frontSrc = path.resolve(__dirname, '..', '..', 'Front', 'src');

if ((process.env.NODE_ENV || 'development') === 'development') {
  console.info('[app] static public:', frontPublic);
  console.info('[app] static src under /src:', frontSrc);
}

// Repositorios (instancias)
const userRepo = new UserRepository();
const tutoriaRepo = new TutoriaRepository();
const scheduleRepo = new ScheduleRepository();
const inscripcionRepo = new InscripcionRepository();

// Controllers
const authcontroller = new AuthController({ userRepository: userRepo });

const tutoriaController = new TutoriaController({
  tutoriaRepository: tutoriaRepo,
  userRepository: userRepo,
  scheduleRepository: scheduleRepo
});

let inscripcionController = null;
try {
  // inscripcionController module exports object with method inscribir
  const mod = inscripcionControllerModule;
  inscripcionController = typeof mod === 'function' ? (mod({ inscripcionRepository: inscripcionRepo }) || mod) : mod;
} catch (e) {
  console.error('[app] error loading inscripcionController', e);
  inscripcionController = null;
}

console.log('[app] controllers ready:', {
  auth: !!authcontroller,
  tutoria: !!tutoriaController,
  inscripcion: !!inscripcionController
});

// Normalizar scheduleController: si el módulo exporta una fábrica que acepta repositorio, invocarla
let scheduleController = null;
try {
  if (typeof scheduleControllerModule === 'function') {
    try {
      scheduleController = scheduleControllerModule({ scheduleRepository: scheduleRepo });
    } catch (e) {
      scheduleController = scheduleControllerModule();
    }
  } else {
    scheduleController = scheduleControllerModule;
  }
} catch (err) {
  scheduleController = scheduleControllerModule;
}

// Rutas (API)
// Auth
app.use(
  '/auth',
  authRoutesFactory({
    authController: authcontroller,
    validateRegister: validation.validateRegister,
    validateLogin: validation.validateLogin
  })
);

// Tutorias (usa authMiddleware para rutas protegidas)
app.use('/tutorias', tutoriaRoutesFactory({ tutoriaController, authMiddleware }));

// Mount horarios routes
let schedulesRouter = null;
try {
  if (typeof scheduleRoutesModule === 'function') {
    try {
      schedulesRouter = scheduleRoutesModule({ scheduleController, authMiddleware });
    } catch (e) {
      schedulesRouter = scheduleRoutesModule();
    }
  } else {
    schedulesRouter = scheduleRoutesModule;
  }
} catch (err) {
  schedulesRouter = null;
}

if (!schedulesRouter || (typeof schedulesRouter !== 'function' && typeof schedulesRouter.use !== 'function')) {
  const fallbackRouter = express.Router();

  fallbackRouter.get('/', async (req, res) => {
    try {
      const all = await (scheduleRepo.readAll ? scheduleRepo.readAll() : scheduleRepo.listAll());
      return res.json(Array.isArray(all) ? all : []);
    } catch (err) {
      console.error('[fallback schedules GET /] error', err);
      return res.status(500).json({ error: 'Error al leer schedules' });
    }
  });

  fallbackRouter.get('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const s = await scheduleRepo.findById(id);
      if (!s) return res.status(404).json({ error: 'Horario no encontrado' });
      return res.json(s);
    } catch (err) {
      console.error('[fallback schedules GET /:id] error', err);
      return res.status(500).json({ error: 'Error al leer schedule' });
    }
  });

  schedulesRouter = fallbackRouter;
}

app.use('/horarios', schedulesRouter);
console.log('[app] /horarios mounted, schedulesRouter type:', schedulesRouter && (schedulesRouter.use ? 'router' : typeof schedulesRouter));

// Inscripcion routes (con inyección del controller y authMiddleware)
let inscripcionRouter = null;
try {
  if (typeof inscripcionRoutesModule === 'function') {
    try {
      inscripcionRouter = inscripcionRoutesModule({ inscripcionController, authMiddleware });
    } catch (e) {
      inscripcionRouter = inscripcionRoutesModule();
    }
  } else {
    inscripcionRouter = inscripcionRoutesModule;
  }
} catch (err) {
  inscripcionRouter = null;
}

// Fallback si no hay router implementado
if (!inscripcionRouter) {
  const r = express.Router();
  r.post('/', (req, res) => res.status(501).json({ error: 'Inscripcion API no implementada en el servidor' }));
  inscripcionRouter = r;
}
app.use('/inscripcion', inscripcionRouter);
console.log('[app] /inscripcion mounted');

// DEBUG temporal: inspeccionar headers y cantidad de tutorías
app.get('/__debug/tutorias-headers', async (req, res) => {
  try {
    console.log('[debug] headers:', { cookie: req.headers.cookie, authorization: req.headers.authorization });
    const count = typeof tutoriaRepo !== 'undefined' && (tutoriaRepo.readAll || tutoriaRepo.listAll)
      ? (await (tutoriaRepo.readAll ? tutoriaRepo.readAll() : tutoriaRepo.listAll())).length
      : null;
    return res.json({ ok: true, cookie: req.headers.cookie || null, tutoriaCount: count });
  } catch (err) {
    console.error('[debug] error', err);
    return res.status(500).json({ error: 'debug error' });
  }
});

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

// Páginas públicas y protección para vistas específicas
app.get(['/', '/index.html', '/login.html', '/login'], (req, res) => {
  return res.sendFile(path.join(frontPublic, 'login.html'));
});

app.get('/crearCuenta.html', (req, res) => {
  return res.sendFile(path.join(frontPublic, 'crearCuenta.html'));
});

app.get('/gestion.html', (req, res) => {
  const user = readUsuarioCookie(req);
  if (!user) return res.redirect('/login.html');
  if (String(user.rol || '').toLowerCase() !== 'tutor') return res.redirect('/login.html');
  return res.sendFile(path.join(frontPublic, 'gestion.html'));
});

app.get('/gestion_estudiante.html', (req, res) => {
  const user = readUsuarioCookie(req);
  if (!user) return res.redirect('/login.html');
  if (String(user.rol || '').toLowerCase() !== 'estudiante') return res.redirect('/login.html');
  return res.sendFile(path.join(frontPublic, 'gestion_estudiante.html'));
});

app.get('/crearTutoria.html', (req, res) => {
  const user = readUsuarioCookie(req);
  if (!user) return res.redirect('/login.html');
  if (String(user.rol || '').toLowerCase() !== 'tutor') return res.redirect('/login.html');
  return res.sendFile(path.join(frontPublic, 'crearTutoria.html'));
});

// Nueva ruta para inscribirse en cursos (solo estudiantes)
app.get('/inscribirseCurso.html', (req, res) => {
  const user = readUsuarioCookie(req);
  if (!user) return res.redirect('/login.html');
  if (String(user.rol || '').toLowerCase() !== 'estudiante') return res.redirect('/login.html');
  return res.sendFile(path.join(frontPublic, 'inscribirseCurso.html'));
});

// Ahora montamos las rutas estáticas (después de las rutas explícitas anteriores)
app.use('/src', express.static(frontSrc));
app.use(express.static(frontPublic));

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Minimal error handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err && err.status ? err.status : 500;
  const payload = { error: err && err.message ? err.message : 'Internal server error' };
  if ((process.env.NODE_ENV || 'development') === 'development' && err) payload.stack = err.stack;
  res.status(status).json(payload);
});

module.exports = app;
