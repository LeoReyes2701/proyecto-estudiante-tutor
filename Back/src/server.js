// Back/src/server.js
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Redirige la raíz a /login
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}/login`);
});
