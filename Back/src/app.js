const express = require("express");
const app = express();
const routes = require("./routes/index");
const authRoutes = require("./routes/authRoutes");

app.use(express.json()); // para leer JSON en las peticiones

module.exports = app;

app.use("/", routes);

app.use("/auth", authRoutes);