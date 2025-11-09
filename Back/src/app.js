// Back/src/app.js
const express = require('express');
const path = require('path');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve frontend static files (Front/public)
const frontPublic = path.resolve(__dirname, '..', '..', 'Front', 'public');
app.use(express.static(frontPublic));

// Simple routes to serve key HTML pages
app.get('/login', (req, res) => {
  res.sendFile(path.join(frontPublic, 'login.html'));
});

app.get('/crear-cuenta', (req, res) => {
  res.sendFile(path.join(frontPublic, 'crearCuenta.html'));
});

app.get('/gestion.html', (req, res) => {
  res.sendFile(path.join(frontPublic, 'gestion.html'));
});

// Minimal auth-related endpoints used by the frontend during development.
// Replace or extend these with your real auth & data logic.
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email y password son requeridos' });

  // Development stub: accept any institutional email
  if (!email.endsWith('@est.ucab.edu.ve')) return res.status(401).json({ error: 'Correo no institucional' });

  // Return a minimal successful response; frontend will redirect a posteriori
  return res.json({ ok: true, redirect: '/gestion.html', token: 'dev-token' });
});

app.post('/auth/logout', (req, res) => {
  // Development stub: simply respond OK
  return res.json({ ok: true, redirect: '/login' });
});

app.get('/auth/profile', (req, res) => {
  // Development stub: return a demo profile
  return res.json({
    userId: 'demo',
    email: 'demo@est.ucab.edu.ve',
    nombre: 'Demo',
    apellido: 'Usuario',
    rol: 'estudiante'
  });
});

app.get('/auth/user/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email || '');
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  if (email.includes('noexiste')) return res.status(404).json({ error: 'No encontrado' });

  return res.json({
    userId: 'u-' + Date.now(),
    email,
    nombre: 'Nombre',
    apellido: 'Apellido',
    rol: 'tutor'
  });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err && err.stack || err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
