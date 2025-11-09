const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

// servir frontend (sin modificar front)
// Public: Front/public
app.use(express.static(path.resolve(__dirname, '..', '..', 'Front', 'public')));
// Assets (src JS/CSS): Front/src
app.use('/src', express.static(path.resolve(__dirname, '..', '..', 'Front', 'src')));

// Servir la página de crear cuenta (ruta pública) ANTES de montar routers que puedan capturar /
app.get('/crear-cuenta', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', '..', 'Front', 'public', 'crearCuenta.html'));
});

// Servir la página de login (ruta pública)
app.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', '..', 'Front', 'public', 'logIn.html'));
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