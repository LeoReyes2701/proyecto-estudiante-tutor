// Back/src/middleware/authMiddleware.js
const UserRepository = require('../repositories/UserRepository');
const userRepo = new UserRepository();

function parseUsuarioCookie(cookieHeader = '') {
  try {
    const cookie = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('usuario='));
    if (!cookie) return null;
    const val = cookie.split('=')[1];
    // cookie value expected base64 JSON
    const json = Buffer.from(val, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

module.exports = async function authMiddleware(req, res, next) {
  try {
    // Dev helper: saltar auth si NODE_ENV=development y cabecera específica presente
    if (process.env.NODE_ENV === 'development' && req.headers['x-dev-skip-auth'] === '1') {
      console.log('[auth] dev-skip-auth');
      req.user = { id: 'dev', email: 'dev@local', rol: 'tutor' };
      req.userFull = null;
      return next();
    }

    // 1) Intentar cookie 'usuario' (base64 JSON)
    const usuario = parseUsuarioCookie(req.headers.cookie || '');
    if (usuario && (usuario.id || usuario.email)) {
      // si repositorio tiene findById, usarlo para obtener datos actuales; si no, aceptar el payload
      try {
        const maybe = typeof userRepo.findById === 'function' ? userRepo.findById(usuario.id || usuario._id || usuario.email) : null;
        const user = (maybe && typeof maybe.then === 'function') ? await maybe : maybe || null;
        if (user) {
          req.user = { id: user.id, email: user.email, rol: user.rol };
          req.userFull = user;
          return next();
        }
      } catch (e) {
        // fallback a usar el objeto de la cookie si tiene mínimos
        req.user = { id: usuario.id || usuario._id || null, email: usuario.email || null, rol: usuario.rol || 'tutor' };
        req.userFull = null;
        return next();
      }

      // si findById no existió o devolvió null pero cookie tenía info mínima, aceptar (opcional)
      req.user = { id: usuario.id || usuario._id || null, email: usuario.email || null, rol: usuario.rol || 'tutor' };
      req.userFull = null;
      return next();
    }

    // 2) Si no hay cookie, intentar Bearer (compatibilidad)
    const auth = String(req.headers.authorization || '');
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice(7).trim();
      if (!token) return res.status(401).json({ error: 'No autorizado' });

      // soportar findByToken sync/async
      const maybe = userRepo.findByToken && typeof userRepo.findByToken === 'function' ? userRepo.findByToken(token) : null;
      const user = (maybe && typeof maybe.then === 'function') ? await maybe : maybe;
      if (!user) return res.status(401).json({ error: 'Token inválido' });

      req.user = { id: user.id, email: user.email, rol: user.rol };
      req.userFull = user;
      return next();
    }

    // 3) ningún método válido: rechazar
    return res.status(401).json({ error: 'No autorizado' });
  } catch (err) {
    console.error('[authMiddleware] error', err);
    return res.status(500).json({ error: 'Error de autenticación' });
  }
};