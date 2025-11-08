const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

const routes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');

app.use('/', routes);                // rutas generales
app.use('/auth', authRoutes);        // todas las rutas de auth vivirán en /auth/*

// servir la página principal
app.get('/crear-cuenta', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', '..', 'Front', 'public', 'crearCuenta.html'));
});

module.exports = app;