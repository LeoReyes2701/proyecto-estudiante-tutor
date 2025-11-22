// Back/src/controllers/authcontroller.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const TutoriaRepository = require('../repositories/TutoriaRepository');
const ScheduleRepository = require('../repositories/ScheduleRepository');

const usuariosFile = path.resolve(__dirname, '..', 'models', 'data', 'usuarios.json');

function readUsuariosFromFile() {
  try {
    const raw = fs.readFileSync(usuariosFile, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function safeUser(user) {
  if (!user) return null;
  if (typeof user.toPublic === 'function') return user.toPublic();
  const copy = Object.assign({}, user);
  delete copy.password;
  delete copy.currentToken;
  return copy;
}

function base64EncodeJson(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}
function base64DecodeJson(str) {
  return JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
}

class AuthController {
  constructor({ userRepository } = {}) {
    this.userRepository = userRepository || new (require('../repositories/UserRepository'))();
    // Bind methods to preserve 'this' context when used as Express middleware
    this.updateProfile = this.updateProfile.bind(this);
    this.deleteProfile = this.deleteProfile.bind(this);
  }

  // obtiene todos los usuarios: soporta repo sync/async o lectura directa de archivo
  async _getAllUsers() {
    try {
      if (this.userRepository) {
        if (typeof this.userRepository.findAll === 'function') {
          const maybe = this.userRepository.findAll();
          return (maybe && typeof maybe.then === 'function') ? await maybe : maybe;
        }
        if (typeof this.userRepository.getAll === 'function') {
          const maybe = this.userRepository.getAll();
          return (maybe && typeof maybe.then === 'function') ? await maybe : maybe;
        }
      }
      return readUsuariosFromFile();
    } catch (e) {
      console.error('[authcontroller]._getAllUsers error', e);
      return [];
    }
  }

  // guarda todos los usuarios: soporta repo.saveAll/save o escritura directa
  async _saveAllUsers(users) {
    try {
      if (this.userRepository) {
        if (typeof this.userRepository.saveAll === 'function') {
          const maybe = this.userRepository.saveAll(users);
          return (maybe && typeof maybe.then === 'function') ? await maybe : maybe;
        }
        if (typeof this.userRepository.save === 'function') {
          // si el repo expone storagePath podemos hacer un write atomic directo
          if (this.userRepository.storagePath) {
            const tmp = `${this.userRepository.storagePath}.tmp`;
            try {
              fs.writeFileSync(tmp, JSON.stringify(users, null, 2), 'utf8');
              fs.renameSync(tmp, this.userRepository.storagePath);
              return true;
            } catch (e) {
              try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
              throw e;
            }
          }
          // fallback: intentar guardar uno por uno usando save (puede lanzar)
          for (const u of users) {
            // si vienen plain objects, convertir a User para normalizar
            const inst = (u instanceof User) ? u : new User(u);
            this.userRepository.save(inst);
          }
          return true;
        }
      }

      // fallback directo a filesystem (asegura directorio)
      const dir = path.dirname(usuariosFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = `${usuariosFile}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(users, null, 2), 'utf8');
      fs.renameSync(tmp, usuariosFile);
      return true;
    } catch (e) {
      console.error('[authcontroller]._saveAllUsers error', e);
      return false;
    }
  }

  // Registro: crea instancia User, persiste con repo.save() si existe, o usa _saveAllUsers fallback
  async register(req, res, next) {
    try {
      const { email, password, nombre, apellido, rol } = req.body || {};
      if (!email || !password) return res.status(400).json({ ok: false, error: 'Faltan campos' });

      // existencia preferentemente por repo
      if (this.userRepository && typeof this.userRepository.findByEmail === 'function') {
        try {
          const exists = this.userRepository.findByEmail(email);
          const maybe = (exists && typeof exists.then === 'function') ? await exists : exists;
          if (maybe) return res.status(409).json({ ok: false, error: 'Usuario ya existe' });
        } catch (e) {
          console.error('[register] repo.findByEmail error', e);
          // seguir con fallback de lectura completa
        }
      } else {
        let users = await this._getAllUsers();
        users = Array.isArray(users) ? users : [];
        if (users.find(u => String(u.email || '').trim().toLowerCase() === String(email).trim().toLowerCase())) {
          return res.status(409).json({ ok: false, error: 'Usuario ya existe' });
        }
      }

      const hashedPassword = await bcrypt.hash(String(password).trim(), 10);

      const minimal = {
        email: String(email).trim(),
        password: hashedPassword,
        nombre: nombre || '',
        apellido: apellido || '',
        rol: rol || 'estudiante'
      };

      const newUserInstance = new User(minimal);

      if (this.userRepository && typeof this.userRepository.save === 'function') {
        try {
          const saved = this.userRepository.save(newUserInstance);
          const created = (saved && typeof saved.then === 'function') ? await saved : saved;
          return res.json({ ok: true, user: safeUser(created) });
        } catch (err) {
          console.error('[register] repo.save error', err);
          if (String(err.message || '').toLowerCase().includes('email')) {
            return res.status(409).json({ ok: false, error: 'Usuario ya existe' });
          }
          return res.status(500).json({ ok: false, error: 'No se pudo guardar usuario' });
        }
      }

      // fallback: push a array y escribir todo
      let users = await this._getAllUsers();
      users = Array.isArray(users) ? users : [];
      users.push(newUserInstance.toJSON());
      const saved = await this._saveAllUsers(users);
      if (!saved) {
        console.error('[register] failed to save users to', usuariosFile);
        return res.status(500).json({ ok: false, error: 'No se pudo guardar usuario' });
      }

      console.log('[register] user created ->', newUserInstance.email);
      return res.json({ ok: true, user: safeUser(newUserInstance) });
    } catch (err) {
      console.error('[register] unexpected error:', err);
      return next(err);
    }
  }

  // Login: busca por email (repo.findByEmail preferido), verifica password, actualiza lastLogin/updatedAt y persiste
  async login(req, res, next) {
    try {
      const { email: rawEmail, password: rawPassword } = req.body || {};
      const email = rawEmail ? String(rawEmail).trim().toLowerCase() : '';
      const password = rawPassword ? String(rawPassword).trim() : '';

      if (!email || !password) return res.status(400).json({ ok: false, error: 'Faltan credenciales' });

      let user = null;

      if (this.userRepository && typeof this.userRepository.findByEmail === 'function') {
        const maybe = this.userRepository.findByEmail(email);
        user = (maybe && typeof maybe.then === 'function') ? await maybe : maybe;
      } else {
        const users = await this._getAllUsers();
        const list = Array.isArray(users) ? users : [];
        const found = list.find(u => String(u.email || '').trim().toLowerCase() === email);
        if (found) user = (found instanceof User) ? found : new User(found);
      }

      if (!user) {
        console.log('[LOGIN] no matching user for', email);
        return res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos' });
      }

      const passwordMatch = await bcrypt.compare(password, String(user.password || '').trim());
      if (!passwordMatch) {
        return res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos' });
      }


      // actualizar lastLogin y updatedAt
      user.lastLogin = new Date().toISOString();
      user.updatedAt = user.lastLogin;

      if (this.userRepository && typeof this.userRepository.save === 'function') {
        try {
          const saved = this.userRepository.save(user);
          user = (saved && typeof saved.then === 'function') ? await saved : saved;
        } catch (err) {
          console.error('[login] repo.save error updating lastLogin', err);
          // no fatal: proceder con lo que tenemos
        }
      } else {
        // fallback: reescribir todo usando saveAll
        const users = await this._getAllUsers();
        const list = Array.isArray(users) ? users : [];
        const idx = list.findIndex(u => String(u.email || '').trim().toLowerCase() === email);
        if (idx !== -1) {
          list[idx] = user.toJSON ? user.toJSON() : user;
          await this._saveAllUsers(list);
        }
      }

      const sUser = safeUser(user);
      const cookieVal = base64EncodeJson(sUser);
      const expiresDate = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8h

      res.setHeader('Set-Cookie', `usuario=${cookieVal}; Path=/; Expires=${expiresDate.toUTCString()}; SameSite=Lax`);

      const redirect = (String(sUser.rol).toLowerCase() === 'tutor') ? '/gestion.html' : '/gestion_estudiante.html';
      return res.json({ ok: true, user: sUser, redirect });
    } catch (err) {
      console.error('[login] unexpected error', err);
      return next(err);
    }
  }

  profile(req, res, next) {
    try {
      const cookieHeader = req.headers.cookie || '';
      const part = cookieHeader.split(';').map(p => p.trim()).find(p => p.startsWith('usuario='));
      if (!part) return res.status(401).json({ ok: false, error: 'No autenticado' });
      const val = part.split('=')[1];
      try {
        const user = base64DecodeJson(val);
        return res.json({ ok: true, user });
      } catch (e) {
        return res.status(401).json({ ok: false, error: 'Cookie inválida' });
      }
    } catch (err) {
      return next(err);
    }
  }

  // Actualizar perfil del usuario autenticado
  async updateProfile(req, res, next) {
    try {
      // Obtener usuario de la cookie
      const cookieHeader = req.headers.cookie || '';
      const part = cookieHeader.split(';').map(p => p.trim()).find(p => p.startsWith('usuario='));
      if (!part) return res.status(401).json({ ok: false, error: 'No autenticado' });
      const val = part.split('=')[1];
      let currentUser;
      try {
        currentUser = base64DecodeJson(val);
      } catch (e) {
        return res.status(401).json({ ok: false, error: 'Cookie inválida' });
      }

      const { nombre, apellido, email, password } = req.body || {};
      const updates = {};

      if (nombre !== undefined) updates.nombre = String(nombre).trim();
      if (apellido !== undefined) updates.apellido = String(apellido).trim();
      if (email !== undefined) {
        const newEmail = String(email).trim().toLowerCase();
        // Verificar si el email ya existe en otro usuario
        if (this.userRepository && typeof this.userRepository.findByEmail === 'function') {
          try {
            const existing = this.userRepository.findByEmail(newEmail);
            const existingUser = (existing && typeof existing.then === 'function') ? await existing : existing;
            if (existingUser && String(existingUser.id) !== String(currentUser.id)) {
              return res.status(409).json({ ok: false, error: 'Email ya registrado por otro usuario' });
            }
          } catch (e) {
            console.error('[updateProfile] error checking email uniqueness:', e);
            // Continue with fallback check
          }
        } else {
          // Fallback: check manually
          let users = await this._getAllUsers();
          users = Array.isArray(users) ? users : [];
          const existing = users.find(u => String(u.email || '').trim().toLowerCase() === newEmail && String(u.id) !== String(currentUser.id));
          if (existing) {
            return res.status(409).json({ ok: false, error: 'Email ya registrado por otro usuario' });
          }
        }
        updates.email = newEmail;
      }
      if (password !== undefined) {
        const hashedPassword = await bcrypt.hash(String(password).trim(), 10);
        updates.password = hashedPassword;
      }

      // Actualizar en repositorio
      let updatedUser;
      if (this.userRepository && typeof this.userRepository.updateById === 'function') {
        updatedUser = this.userRepository.updateById(currentUser.id, updates);
        if (updatedUser && typeof updatedUser.then === 'function') updatedUser = await updatedUser;
      } else {
        // Fallback: actualizar manualmente
        let users = await this._getAllUsers();
        const idx = users.findIndex(u => String(u.id) === String(currentUser.id));
        if (idx === -1) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        Object.assign(users[idx], updates);
        const saved = await this._saveAllUsers(users);
        if (!saved) return res.status(500).json({ ok: false, error: 'No se pudo actualizar el perfil' });
        updatedUser = users[idx];
      }


      // Actualizar cookie con nuevos datos
      const sUser = safeUser(updatedUser);
      const cookieVal = base64EncodeJson(sUser);
      const expiresDate = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8h
      res.setHeader('Set-Cookie', `usuario=${cookieVal}; Path=/; Expires=${expiresDate.toUTCString()}; SameSite=Lax`);

      return res.json({ ok: true, user: sUser });
    } catch (err) {
      console.error('[updateProfile] error:', err);
      return next(err);
    }
  }

  // Eliminar perfil del usuario autenticado
  async deleteProfile(req, res, next) {
    try {
      // Obtener usuario de la cookie
      const cookieHeader = req.headers.cookie || '';
      const part = cookieHeader.split(';').map(p => p.trim()).find(p => p.startsWith('usuario='));
      if (!part) return res.status(401).json({ ok: false, error: 'No autenticado' });
      const val = part.split('=')[1];
      let currentUser;
      try {
        currentUser = base64DecodeJson(val);
      } catch (e) {
        return res.status(401).json({ ok: false, error: 'Cookie inválida' });
      }

      // Instanciar repositorios
      const tutoriaRepo = new TutoriaRepository();
      const scheduleRepo = new ScheduleRepository();

      // Manejar dependencias según el rol
      if (String(currentUser.rol).toLowerCase() === 'tutor') {
        // Eliminar todas las tutorías creadas por el tutor
        const allTutorias = await tutoriaRepo.getAll();
        const tutorTutorias = allTutorias.filter(t => String(t.creadorId) === String(currentUser.id));
        for (const tutoria of tutorTutorias) {
          await tutoriaRepo.delete(tutoria.id);
        }

        // Eliminar todos los horarios del tutor
        const tutorSchedules = await scheduleRepo.findByTutorId(currentUser.id);
        for (const schedule of tutorSchedules) {
          await scheduleRepo.delete(schedule.id);
        }
      } else if (String(currentUser.rol).toLowerCase() === 'estudiante') {
        // Remover al estudiante de todas las tutorías donde esté inscrito
        const allTutorias = await tutoriaRepo.getAll();
        for (const tutoria of allTutorias) {
          if (Array.isArray(tutoria.estudiantesInscritos)) {
            const originalLength = tutoria.estudiantesInscritos.length;
            tutoria.estudiantesInscritos = tutoria.estudiantesInscritos.filter(e => String(e.id) !== String(currentUser.id));
            if (tutoria.estudiantesInscritos.length !== originalLength) {
              // Solo guardar si hubo cambios
              await tutoriaRepo.save(tutoria);
            }
          }
        }
      }

      // Eliminar del repositorio de usuarios
      let deleted = false;
      if (this.userRepository && typeof this.userRepository.deleteById === 'function') {
        try {
          deleted = this.userRepository.deleteById(currentUser.id);
          if (deleted && typeof deleted.then === 'function') deleted = await deleted;
        } catch (e) {
          console.error('[deleteProfile] repo.deleteById error:', e);
          // Continue with fallback
        }
      }

      if (!deleted) {
        // Fallback: eliminar manualmente
        let users = await this._getAllUsers();
        const idx = users.findIndex(u => String(u.id) === String(currentUser.id));
        if (idx !== -1) {
          users.splice(idx, 1);
          deleted = await this._saveAllUsers(users);
        }
      }

      if (!deleted) return res.status(500).json({ ok: false, error: 'No se pudo eliminar el perfil' });

      // Limpiar cookie
      res.setHeader('Set-Cookie', 'usuario=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax');

      return res.json({ ok: true, message: 'Perfil eliminado exitosamente' });
    } catch (err) {
      console.error('[deleteProfile] error:', err);
      return next(err);
    }
  }
}

module.exports = AuthController;