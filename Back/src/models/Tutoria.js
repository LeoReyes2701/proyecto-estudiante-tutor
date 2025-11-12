const fs = require('fs');
const path = require('path');

class Tutoria {
  constructor(obj = {}) {
    this.id = obj.id || (Date.now().toString() + '-' + Math.random().toString(36).slice(2, 9));
    this.titulo = String(obj.titulo || '').trim();
    this.descripcion = String(obj.descripcion || '').trim();

    const rawCupo = typeof obj.cupo !== 'undefined' ? obj.cupo : obj.fecha;
    const n = Number(rawCupo);
    this.cupo = Number.isFinite(n) && !Number.isNaN(n) ? Math.max(0, Math.floor(n)) : 0;

    this.creadorId = obj.creadorId || null;

    const rawNombre = obj.creadorNombre || '';
    const pareceCorreo = typeof rawNombre === 'string' && rawNombre.includes('@');
    this.creadorNombre = (!pareceCorreo && rawNombre.trim())
      ? rawNombre.trim()
      : this._resolveNombreDesdeUsuarios(this.creadorId);

    this.horarioId = obj.horarioId || obj.scheduleId || null;

    this.estudiantesInscritos = Array.isArray(obj.estudiantesInscritos)
      ? obj.estudiantesInscritos.map(e => {
          if (typeof e === 'string') return { id: e, fecha: '—' };
          const id = typeof e?.id === 'string' ? e.id : String(e?.id || '');
          const fecha = typeof e?.fecha === 'string' ? e.fecha : '—';
          return { id, fecha };
        })
      : [];

    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const año = String(hoy.getFullYear()).slice(-2);

    const isISO = typeof obj.createdAt === 'string' && obj.createdAt.includes('T');
    this.createdAt = (!isISO && obj.createdAt) ? obj.createdAt : `${dia}/${mes}/${año}`;
  }

  _resolveNombreDesdeUsuarios(id) {
    if (!id) return 'Desconocido';
    try {
      const ruta = path.resolve(__dirname, 'data', 'usuarios.json');
      const raw = fs.readFileSync(ruta, 'utf8');
      const arr = JSON.parse(raw);
      const user = arr.find(u => String(u.id) === String(id));
      if (!user) return 'Desconocido';
      const nombre = (user.nombre || '').trim();
      const apellido = (user.apellido || '').trim();
      const fullName = `${nombre} ${apellido}`.trim();
      return fullName.length > 1 ? fullName : 'Desconocido';
    } catch (e) {
      console.warn('[Tutoria] No se pudo leer usuarios.json para obtener nombre del tutor:', e);
      return 'Desconocido';
    }
  }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      cupo: this.cupo,
      creadorId: this.creadorId,
      creadorNombre: this.creadorNombre,
      horarioId: this.horarioId,
      estudiantesInscritos: this.estudiantesInscritos,
      createdAt: this.createdAt
    };
  }
}

module.exports = Tutoria;
