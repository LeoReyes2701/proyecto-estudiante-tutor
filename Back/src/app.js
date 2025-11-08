const express = require("express");
const app = express();

app.use(express.json());

// Importar y usar las rutas de horarios
const scheduleRoutes = require("./routes/scheduleRoutes");
app.use("/schedules", scheduleRoutes);

module.exports = app;