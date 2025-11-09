const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

const scheduleRoutes = require("./routes/scheduleRoutes");

app.use(express.static(path.resolve(__dirname, "../../Front/public")));
app.use("/src", express.static(path.resolve(__dirname, "../../Front/src")));

app.get("/", (req, res) => {
  //res.sendFile(path.resolve(__dirname, "../../Front/public/crearHorario.html"));
  res.sendFile(path.resolve(__dirname, "../../Front/public/consultarHorario.html"));
});

app.use("/schedules", scheduleRoutes);

module.exports = app;
