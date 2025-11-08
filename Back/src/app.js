const express = require('express');
const path = require('path');
const routes = require('./routes/index_tutoria');

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos desde Front/public
app.use(express.static(path.resolve(__dirname, '../../Front/public')));

// Servir archivos JS y CSS desde Front/src
app.use('/src', express.static(path.resolve(__dirname, '../../Front/src')));

// Ruta raíz que carga crearTutoria.html
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../Front/public/consultarTutoria.html'));
});

// Rutas API
app.use(routes);

module.exports = app;
