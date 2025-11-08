const express = require('express');
const path = require('path');
const routes = require('./routes/index_tutoria');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'Front', 'public')));

app.use(routes);

module.exports = app;
