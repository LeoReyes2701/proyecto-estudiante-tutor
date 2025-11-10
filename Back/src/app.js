const express = require('express');
const path = require('path');

const UserRepository = require('./repositories/UserRepository');
const TutoriaRepository = require('./repositories/TutoriaRepository');
const ScheduleRepository = require('./repositories/ScheduleRepository');

const AuthController = require('./controllers/authController');
const TutoriaController = require('./controllers/tutoriaController');
const scheduleControllerModule = require('./controllers/scheduleController');
const scheduleRoutesModule = require('./routes/scheduleRoutes');

const authRoutesFactory = require('./routes/authRoutes');
const tutoriaRoutesFactory = require('./routes/tutoriaRoutes');

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

const InscripcionRepository = require('./repositories/InscripcionRepository');
const InscripcionController = require('./controllers/inscripcionController');
const inscripcionesRoutesFactory = require('./routes/inscripcionesRoutes');

// Repositorio
const inscripcionRepo = new InscripcionRepository();

// Controlador
const inscripcionController = new InscripcionController({
  inscripcionRepository: inscripcionRepo,
  userRepository: userRepo,
  tutoriaRepository: tutoriaRepo
});

// Rutas
app.use('/inscripciones', inscripcionesRoutesFactory({ inscripcionController }));


// Controllers
const authcontroller = new AuthController({ userRepository: userRepo });

// Inyectar scheduleRepo en controller de tutorías para validaciones de horario
const tutoriaController = new TutoriaController({
  tutoriaRepository: tutoriaRepo,
  userRepository: userRepo,
  scheduleRepository: scheduleRepo
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

// Montar routes de horarios (horarios)
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
  // Si no obtuvimos un router, creamos uno mínimo para exponer schedules desde scheduleRepo (solo GETs)
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

  // NOTA: fallback POST deliberately removed to avoid duplicate handlers.
  schedulesRouter = fallbackRouter;
}

app.use('/horarios', schedulesRouter);
console.log('[app] /horarios mounted, schedulesRouter type:', schedulesRouter && (schedulesRouter.use ? 'router' : typeof schedulesRouter));

// DEBUG: listar rutas expuestas por schedulesRouter
try {
  const router = schedulesRouter;
  if (router && router.stack && Array.isArray(router.stack)) {
    console.log('[debug] schedulesRouter routes:');
    router.stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        const methods = layer.route.methods ? Object.keys(layer.route.methods).join(',') : '';
        console.log('  route', layer.route.path, 'methods:', methods);
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        layer.handle.stack.forEach((L) => {
          if (L.route && L.route.path) {
            const m = L.route.methods ? Object.keys(L.route.methods).join(',') : '';
            console.log('  subroute', L.route.path, 'methods:', m);
          }
        });
      } else {
        console.log('  layer', layer.name || '(unknown layer)', layer.regexp && layer.regexp.toString());
      }
    });
  } else {
    console.log('[debug] schedulesRouter has no stack or is not express Router');
  }
} catch (e) {
  console.error('[debug] error enumerating schedulesRouter routes', e);
}

// Si no hay POST en '/' en el schedulesRouter, montar uno que delegue a scheduleController.create
(function ensurePostOnSchedules() {
  try {
    let hasRootPost = false;
    const router = schedulesRouter;
    if (router && router.stack && Array.isArray(router.stack)) {
      for (const layer of router.stack) {
        if (layer.route && layer.route.path === '/' && layer.route.methods && layer.route.methods.post) {
          hasRootPost = true;
          break;
        }
        if (layer.name === 'router' && layer.handle && layer.handle.stack) {
          for (const L of layer.handle.stack) {
            if (L.route && L.route.path === '/' && L.route.methods && L.route.methods.post) {
              hasRootPost = true;
              break;
            }
          }
          if (hasRootPost) break;
        }
      }
    }

    if (!hasRootPost) {
      console.log('[app] schedulesRouter has no POST / — registering delegator to scheduleController.create');
      const delegator = express.Router();
      delegator.post('/', async (req, res, next) => {
        try {
          if (!scheduleController || typeof scheduleController.create !== 'function') {
            return res.status(500).json({ error: 'Schedule create handler not available' });
          }
          return scheduleController.create(req, res, next);
        } catch (err) {
          console.error('[delegator POST /horarios] error', err);
          return res.status(500).json({ error: 'Error interno' });
        }
      });
      // mount delegator BEFORE existing router so POST / is handled by delegator
      app.use('/horarios', delegator);
    } else {
      console.log('[app] schedulesRouter already defines POST /');
    }
  } catch (e) {
    console.error('[app] ensurePostOnSchedules error', e);
  }
})();

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