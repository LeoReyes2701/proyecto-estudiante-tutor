// Back/src/app.js
const express = require('express');
const path = require('path');

const indexRoutes = require('./routes/index_tutoria');

const app = express();
app.use(express.json());

// servir frontend estático
const frontPublic = path.resolve(__dirname, '../../Front/public');
const frontSrc = path.resolve(__dirname, '../../Front/src');

app.use(express.static(frontPublic));
app.use('/src', express.static(frontSrc));

// montar API
app.use('/api', indexRoutes);

// raíz: servir crearHorario.html para facilidad
app.get('/', (req, res) => {
  res.sendFile(path.join(frontPublic, 'crearTutoria.html'));
});

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

module.exports = app;
