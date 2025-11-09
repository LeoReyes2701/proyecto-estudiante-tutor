const express = require('express');
const path = require('path');

const routes = require('./routes/index_tutoria');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();

app.use(express.json());

// Debug básico para ayudar a detectar exports faltantes en routers/controllers
console.log('Booting app - mounting routers');

// servir frontend (sin modificar front)
// Public: Front/public
app.use(express.static(path.resolve(__dirname, '../../Front/public')));
// Assets (src JS/CSS): Front/src
app.use('/src', express.static(path.resolve(__dirname, '../../Front/src')));

// raíz muestra crearTutoria.html como antes
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../Front/public/crearTutoria.html'));
});

// API routes
// Aseguramos que el router principal se monte bajo /api para evitar confusiones
if (routes && typeof routes === 'function' || (routes && routes.stack)) {
  app.use('/api', routes);
} else {
  // Si routes no es un router, lo mostramos en consola para diagnóstico
  console.warn('Warning: routes (index_tutoria) no parece ser un router válido:', typeof routes);
  app.use('/api', (req, res, next) => next()); // no-op para mantener la app funcionando
}

// Rutas de schedules
// Verificamos que scheduleRoutes exista antes de montarlo
if (scheduleRoutes && typeof scheduleRoutes === 'function' || (scheduleRoutes && scheduleRoutes.stack)) {
  app.use('/api/schedules', scheduleRoutes);
} else {
  console.warn('Warning: scheduleRoutes no parece ser un router válido:', typeof scheduleRoutes);
  // montar un handler mínimo para devolver error claro si algo está mal
  app.use('/api/schedules', (req, res) => res.status(500).json({ error: 'Schedule routes no configuradas correctamente' }));
}

// manejo básico de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;
