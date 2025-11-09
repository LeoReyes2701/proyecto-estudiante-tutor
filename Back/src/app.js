const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

const scheduleRoutes = require("./routes/scheduleRoutes");

// Public: Front/public LEO
app.use(express.static(path.resolve(__dirname, '..', '..', 'Front', 'public')));
app.use('/src', express.static(path.resolve(__dirname, '..', '..', 'Front', 'src')));

app.get('/crear-cuenta', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', '..', 'Front', 'public', 'crearCuenta.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', '..', 'Front', 'public', 'logIn.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', '..', 'Front', 'public', 'crearCuenta.html'));
});

// Importar routers
const apiRoutes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');

// Montar routers con prefijos explícitos
app.use('/api', apiRoutes);    // rutas generales de API (evita colisiones con rutas públicas)
app.use('/auth', authRoutes);  // rutas de autenticación (registro/login)

//YO
app.use(express.static(path.resolve(__dirname, "../../Front/public")));
app.use("/src", express.static(path.resolve(__dirname, "../../Front/src")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../../Front/public/consultarHorario.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../../Front/public/crearHorario.html"));
});

app.use("/schedules", scheduleRoutes);

module.exports = app;
