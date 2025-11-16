const Tutoria = require('../models/Tutoria');

function parseUsuarioCookie(cookieHeader = '') {
  try {
    const cookie = String(cookieHeader || '').split(';').map(s => s.trim()).find(s => s.startsWith('usuario='));
    if (!cookie) return null;
    const val = cookie.split('=')[1];
    if (!val) return null;
    return JSON.parse(Buffer.from(val, 'base64').toString('utf8'));
  } catch (e) {
    console.warn('[tutoriaController] parseUsuarioCookie failed', e);
    return null;
  }
}

class TutoriaController {
  constructor(options = {}) {
    if (!options.tutoriaRepository) throw new Error('TutoriaController requires tutoriaRepository');
    this.tutoriaRepository = options.tutoriaRepository;
    this.userRepository = options.userRepository || null;
    this.scheduleRepository = options.scheduleRepository || null;

    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  // POST /tutorias
  async create(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { titulo, descripcion, cupo, slots } = req.body || {};

      if (!titulo || String(titulo).trim() === '') {
        return res.status(400).json({ error: 'Título requerido' });
      }

      let horarioId = null;
      if (Array.isArray(slots) && slots.length > 0) {
        const s0 = slots[0];
        horarioId = s0.id || s0.horarioId || s0.scheduleId || null;

        if (!horarioId && this.scheduleRepository && (s0.day || s0.horaInicio || s0.start)) {
          try {
            const allSchedules = await (this.scheduleRepository.readAll ? this.scheduleRepository.readAll() : this.scheduleRepository.listAll());
            const match = (Array.isArray(allSchedules) ? allSchedules : []).find(sc => {
              const sd = String(sc.day || sc.dia || (sc.slots && sc.slots[0] && sc.slots[0].day) || '');
              const ss = String(sc.start || sc.horaInicio || (sc.slots && sc.slots[0] && sc.slots[0].horaInicio) || '');
              const se = String(sc.end || sc.horaFin || (sc.slots && sc.slots[0] && sc.slots[0].horaFin) || '');
              const qd = String(s0.day || s0.dia || '');
              const qs = String(s0.start || s0.horaInicio || '');
              const qe = String(s0.end || s0.horaFin || '');
              return sd === qd && ss === qs && se === qe;
            });
            if (match) horarioId = match.id || match._id || null;
          } catch (e) {
            console.warn('[tutoriaController] scheduleRepository search failed', e);
          }
        }
      }

      // Normalizar cupo: aceptar undefined -> model will default to 0, accept numeric-like strings
      const normalizedCupo = (typeof cupo !== 'undefined') ? (Number.isFinite(Number(cupo)) ? Math.max(0, Math.floor(Number(cupo))) : 0) : undefined;

      const newTutoria = new Tutoria({
        titulo: titulo,
        descripcion: descripcion || '',
        creadorId: req.user.id,
        creadorNombre: `${req.user.nombre || ''} ${req.user.apellido || ''}`.trim(),
        horarioId: horarioId || null,
        cupo: normalizedCupo
      });


      const repo = this.tutoriaRepository;
      let saved = null;

      // repo.save may be synchronous; support both sync and async interfaces
      if (repo.save && typeof repo.save === 'function') {
        saved = await Promise.resolve(repo.save(newTutoria.toJSON ? newTutoria.toJSON() : newTutoria));
      } else if (repo.create && typeof repo.create === 'function') {
        saved = await Promise.resolve(repo.create(newTutoria.toJSON ? newTutoria.toJSON() : newTutoria));
      } else if (repo.insert && typeof repo.insert === 'function') {
        saved = await Promise.resolve(repo.insert(newTutoria.toJSON ? newTutoria.toJSON() : newTutoria));
      } else if (repo.readAll && repo.writeAll) {
        const all = await Promise.resolve(repo.readAll());
        const arr = Array.isArray(all) ? all : [];
        const toSave = newTutoria.toJSON ? newTutoria.toJSON() : newTutoria;
        arr.push(toSave);
        await Promise.resolve(repo.writeAll(arr));
        saved = toSave;
      } else {
        throw new Error('TutoriaRepository does not implement save/create/insert');
      }

      return res.status(201).json({ message: 'Tutoría creada', tutoria: saved });
    } catch (err) {
      console.error('[tutoriaController.create] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  // GET /tutorias
  async list(req, res) {
    try {
      const repo = this.tutoriaRepository;
      if (!repo) return res.status(500).json({ error: 'Repositorio de tutorías no disponible' });

      // LOG: entrada y headers para depuración
      console.log('[tutoriaController.list] incoming query:', req.query, 'cookie present:', !!req.headers.cookie);

      const all = await Promise.resolve(repo.readAll ? repo.readAll() : (repo.listAll ? repo.listAll() : []));
      console.log('[tutoriaController.list] total tutorias from repo:', Array.isArray(all) ? all.length : all);

      // Si se solicita ?mine=1, filtrar server-side usando cookie 'usuario' (base64 JSON)
      if (String(req.query.mine) === '1') {
        const usuario = parseUsuarioCookie(req.headers.cookie || '');
        console.log('[tutoriaController.list] parsed usuario:', usuario);
        if (!usuario || !usuario.id) return res.status(401).json({ error: 'No autorizado' });
        const myId = String(usuario.id);

        // Filtrado tolerante: distintos nombres/tipos para campo creador
        const mine = (Array.isArray(all) ? all : []).filter(t => {
          if (!t) return false;

          // Si t es instancia de Tutoria con toJSON preferimos su forma plain
          const plain = (t && typeof t.toJSON === 'function') ? t.toJSON() : t;

          // Campos candidatos que pueden contener el id del creador
          const candidates = [
            plain.creadorId, plain.creador, plain.userId, plain.ownerId, plain.creatorId, plain.authorId
          ];

          for (const c of candidates) {
            if (c === undefined || c === null) continue;
            if (typeof c === 'object') {
              const v = String(c.id || c._id || c.creadorId || c.userId || '');
              if (v === myId) return true;
            } else {
              if (String(c) === myId) return true;
            }
          }

          // Also check nested creator object shape: plain.creador.id, plain.creador._id
          if (plain.creador && typeof plain.creador === 'object') {
            const v = String(plain.creador.id || plain.creador._id || '');
            if (v === myId) return true;
          }

          return false;
        });

        console.log('[tutoriaController.list] filtered mine count:', mine.length);
        return res.json(mine);
      }

      // Default: devolver todo
      return res.json(Array.isArray(all) ? all : []);
    } catch (err) {
      console.error('[tutoriaController.list] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  // GET /tutorias/:id
  async getById(req, res) {
    try {
      const id = req.params.id;
      const repo = this.tutoriaRepository;
      const item = (repo.findById && typeof repo.findById === 'function') ? await Promise.resolve(repo.findById(id)) : null;
      if (!item) return res.status(404).json({ error: 'No encontrado' });

      // Ensure response shape uses cupo (model Tutoria normalizes)
      const plain = (item && typeof item.toJSON === 'function') ? item.toJSON() : item;
      return res.json(plain);
    } catch (err) {
      console.error('[tutoriaController.getById] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  // PUT /tutorias/:id
  async update(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { id } = req.params;
      const { titulo, descripcion, cupo, slots } = req.body || {};

      if (!id) return res.status(400).json({ error: 'ID requerido' });

      // Verificar que la tutoría existe
      const existing = await this.tutoriaRepository.findById(id);
      if (!existing) return res.status(404).json({ error: 'Tutoría no encontrada' });

      // Verificar que el usuario es el creador y es tutor
      const plain = (existing && typeof existing.toJSON === 'function') ? existing.toJSON() : existing;
      if (String(plain.creadorId) !== String(req.user.id)) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta tutoría' });
      }
      if (req.user.rol !== 'tutor') {
        return res.status(403).json({ error: 'Solo los tutores pueden modificar tutorías' });
      }

      // Preparar actualización: solo permitir cambios en descripcion, cupo, horarioId (titulo no se puede cambiar)
      const updates = {};
      if (descripcion !== undefined) {
        updates.descripcion = descripcion;
      }
      if (cupo !== undefined) {
        const normalizedCupo = Number.isFinite(Number(cupo)) ? Math.max(0, Math.floor(Number(cupo))) : 0;
        // Validar que el nuevo cupo no sea menor que los estudiantes ya inscritos
        const inscritosCount = Array.isArray(plain.estudiantesInscritos) ? plain.estudiantesInscritos.length : 0;
        if (normalizedCupo < inscritosCount) {
          return res.status(400).json({ error: `No se puede reducir el cupo a ${normalizedCupo} porque ya hay ${inscritosCount} estudiantes inscritos` });
        }
        updates.cupo = normalizedCupo;
      }

      // Manejar cambio de horario si se proporcionan slots
      if (Array.isArray(slots) && slots.length > 0) {
        const s0 = slots[0];
        let horarioId = s0.id || s0.horarioId || s0.scheduleId || null;

        if (!horarioId && this.scheduleRepository && (s0.day || s0.horaInicio || s0.start)) {
          try {
            const allSchedules = await (this.scheduleRepository.readAll ? this.scheduleRepository.readAll() : this.scheduleRepository.listAll());
            const match = (Array.isArray(allSchedules) ? allSchedules : []).find(sc => {
              const sd = String(sc.day || sc.dia || (sc.slots && sc.slots[0] && sc.slots[0].day) || '');
              const ss = String(sc.start || sc.horaInicio || (sc.slots && sc.slots[0] && sc.slots[0].horaInicio) || '');
              const se = String(sc.end || sc.horaFin || (sc.slots && sc.slots[0] && sc.slots[0].horaFin) || '');
              const qd = String(s0.day || s0.dia || '');
              const qs = String(s0.start || s0.horaInicio || '');
              const qe = String(s0.end || s0.horaFin || '');
              return sd === qd && ss === qs && se === qe;
            });
            if (match) horarioId = match.id || match._id || null;
          } catch (e) {
            console.warn('[tutoriaController.update] scheduleRepository search failed', e);
          }
        }
        updates.horarioId = horarioId;
      }

      // Aplicar cambios
      const updatedData = { ...plain, ...updates, updatedAt: new Date().toISOString() };
      const updated = await this.tutoriaRepository.save(updatedData);

      return res.status(200).json({ message: 'Tutoría actualizada exitosamente', tutoria: updated });
    } catch (err) {
      console.error('[tutoriaController.update] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  // DELETE /tutorias/:id
  async delete(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { id } = req.params;

      if (!id) return res.status(400).json({ error: 'ID requerido' });

      // Verificar que la tutoría existe
      const existing = await this.tutoriaRepository.findById(id);
      if (!existing) return res.status(404).json({ error: 'Tutoría no encontrada' });

      // Verificar que el usuario es el creador y es tutor
      const plain = (existing && typeof existing.toJSON === 'function') ? existing.toJSON() : existing;
      const creatorId = plain.creadorId || plain.creador || plain.userId;
      if (String(creatorId) !== String(req.user.id)) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar esta tutoría' });
      }
      if (req.user.rol !== 'tutor') {
        return res.status(403).json({ error: 'Solo los tutores pueden eliminar tutorías' });
      }

      // Eliminar
      const deleted = await this.tutoriaRepository.delete(id);
      if (!deleted) return res.status(404).json({ error: 'Tutoría no encontrada' });

      return res.status(200).json({ message: 'Tutoría eliminada exitosamente' });
    } catch (err) {
      console.error('[tutoriaController.delete] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }
}

module.exports = TutoriaController;
