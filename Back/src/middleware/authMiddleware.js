// Back/src/middleware/authMiddleware.js
// Comprueba Authorization: Bearer <token>
// Busca el usuario que tiene currentToken == token
// Adjunta:
//   req.user = { id, email, rol }   (ligero, seguro para handlers)
//   req.userFull = User instance (si necesitas acceder al repo)
const UserRepository = require('../repositories/UserRepository');
const userRepo = new UserRepository(); // repo simple compartido; si tienes singleton usa ese

module.exports = async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  const token = auth.slice(7);
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const user = await Promise.resolve(userRepo.findByToken(token));
    if (!user) return res.status(401).json({ error: 'Token inválido' });

    // attach minimal and full
    req.user = { id: user.id, email: user.email, rol: user.rol };
    req.userFull = user;
    return next();
  } catch (err) {
    console.error('[authMiddleware] error', err);
    return res.status(500).json({ error: 'Error de autenticación' });
  }
};