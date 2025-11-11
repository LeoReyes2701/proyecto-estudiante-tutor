// Back/src/repositories/InscripcionRepository.js
const TutoriaRepository = require('./TutoriaRepository');

class InscripcionRepository {
  constructor() {
    this.tutoriaRepo = new TutoriaRepository();
  }

  async inscribirEstudiante(tutoriaId, estudianteId) {
    if (!tutoriaId || !estudianteId) throw new Error('Faltan parámetros');

    // Obtener la tutoria
    const tutoria = await this.tutoriaRepo.findById(tutoriaId);
    if (!tutoria) return { status: 'not_found', message: 'Tutoria no encontrada' };

    // Asegurar formato de la lista
    if (!Array.isArray(tutoria.estudiantesInscritos)) tutoria.estudiantesInscritos = [];

    // Evitar duplicado
    if (tutoria.estudiantesInscritos.includes(String(estudianteId))) {
      return { status: 'already', message: 'Estudiante ya inscrito', tutoria };
    }

    // Validar cupo
    const inscritosCount = tutoria.estudiantesInscritos.length;
    const cupo = Number.isFinite(Number(tutoria.cupo)) ? Math.max(0, Math.floor(Number(tutoria.cupo))) : 0;
    if (inscritosCount >= cupo) {
      return { status: 'full', message: 'No hay cupo disponible', tutoria };
    }

    // Agregar e intentar persistir
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const año = String(hoy.getFullYear()).slice(-2);
    const fecha = `${dia}/${mes}/${año}`;

    tutoria.estudiantesInscritos.push({ id: String(estudianteId), fecha });

    // Intentar actualizar el repositorio. Soportamos varios métodos posibles: update(id, obj), save(obj), replace(id,obj)
    if (typeof this.tutoriaRepo.update === 'function') {
      await this.tutoriaRepo.update(tutoriaId, tutoria);
    } else if (typeof this.tutoriaRepo.save === 'function') {
      await this.tutoriaRepo.save(tutoria);
    } else if (typeof this.tutoriaRepo.replace === 'function') {
      await this.tutoriaRepo.replace(tutoriaId, tutoria);
    } else {
      // Si no hay método de persistencia, lanzamos para que el controller devuelva 500
      throw new Error('TutoriaRepository no implementa método de guardado (update/save/replace)');
    }

    return { status: 'ok', message: 'Inscripción realizada', tutoria };
  }
}

module.exports = InscripcionRepository;

