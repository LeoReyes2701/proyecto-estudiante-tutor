
const express = require('express');
const path = require('path');
const routes = require('./routes/index_tutoria');

const app = express();

app.use(express.json());

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
app.use(routes);

module.exports = app;

