// routes/inscripciones.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Inscripcion = require('../models/Inscripcion');
const Curso = require('../models/Curso');
const Notificacion = require('../models/Notificacion');
const Usuario = require('../models/Usuario');
const RespuestaExamen = require('../models/RespuestaExamen');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
};

// GET /api/inscripciones/usuario - Obtener inscripciones del usuario actual
router.get('/usuario', requireAuth, async (req, res) => {
  try {
    const inscripciones = await Inscripcion.find({ usuario: req.session.usuario.id })
      .populate('curso', 'titulo imagen profesor calificacion numValoraciones nivel idioma duracionTotal secciones')
      .sort({ fechaUltimoAcceso: -1 });

    res.json({ success: true, inscripciones });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inscripciones/:cursoId/estado - Obtener estado de inscripción
router.get('/:cursoId/estado', requireAuth, async (req, res) => {
  try {
    const inscripcion = await Inscripcion.findOne({
      usuario: req.session.usuario.id,
      curso: req.params.cursoId
    }).select('estado progresoGeneral fechaInscripcion fechaUltimoAcceso');

    if (!inscripcion) {
      return res.json({ inscrito: false });
    }

    res.json({
      inscrito: true,
      estado: inscripcion.estado,
      progresoGeneral: inscripcion.progresoGeneral,
      fechaInscripcion: inscripcion.fechaInscripcion,
      fechaUltimoAcceso: inscripcion.fechaUltimoAcceso,
      inscripcionId: inscripcion._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inscripciones/:cursoId - Verificar si está inscrito
router.get('/:cursoId', requireAuth, async (req, res) => {
  try {
    const inscripcion = await Inscripcion.findOne({
      usuario: req.session.usuario.id,
      curso: req.params.cursoId
    }).populate('curso');

    if (!inscripcion) {
      return res.json({ inscrito: false });
    }

    res.json({ inscrito: true, inscripcion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inscripciones/:cursoId/reiniciar - Reiniciar progreso del curso
router.put('/:cursoId/reiniciar', requireAuth, async (req, res) => {
  try {
    const { cursoId } = req.params;
    const usuarioId = req.session.usuario.id;

    const [curso, inscripcion] = await Promise.all([
      Curso.findById(cursoId),
      Inscripcion.findOne({ curso: cursoId, usuario: usuarioId })
    ]);

    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    if (!inscripcion) {
      return res.status(404).json({ error: 'No estás inscrito en este curso' });
    }

    const progresoPorLeccion = [];
    if (Array.isArray(curso.secciones)) {
      curso.secciones.forEach((seccion) => {
        const requiereVideoSeccion = seccion.requiereVideo !== false;
        if (Array.isArray(seccion.lecciones)) {
          seccion.lecciones.forEach((leccion) => {
            const leccionId = leccion?._id || new mongoose.Types.ObjectId();
            const tieneVideo = Boolean(leccion?.urlVideo);
            const requiereVideoLeccion = leccion?.requiereVideo === undefined
              ? requiereVideoSeccion
              : leccion.requiereVideo !== false;
            const requiereVideo = requiereVideoLeccion && tieneVideo && leccion?.tipo === 'video';
            progresoPorLeccion.push({
              leccionId,
              videoCompletado: !requiereVideo,
              completado: false,
              progreso: 0,
              fechaCompletado: null
            });
          });
        }
      });
    }

    if (progresoPorLeccion.length > 0) {
      inscripcion.progresoLecciones = progresoPorLeccion;
    } else {
      inscripcion.progresoLecciones = [];
    }

    inscripcion.progresoGeneral = 0;
    inscripcion.estado = 'activo';
    inscripcion.ultimaLeccionAccedida = null;
    inscripcion.fechaUltimoAcceso = new Date();
    inscripcion.calcularProgreso();
    await inscripcion.save();

    // Reiniciar contadores del usuario
    const usuario = await Usuario.findById(usuarioId);
    if (usuario) {
      usuario.progresoCursos = (usuario.progresoCursos || []).filter((p) => {
        if (!p.curso) return false;
        if (p.curso.toString() === cursoId.toString()) {
          p.progreso = 0;
          p.actualizadoEn = new Date();
        }
        return true;
      });

      const progresoExistente = usuario.progresoCursos.find(
        (p) => p.curso && p.curso.toString() === cursoId.toString()
      );

      if (!progresoExistente) {
        usuario.progresoCursos.push({
          curso: cursoId,
          progreso: 0,
          actualizadoEn: new Date()
        });
      }

      await usuario.save();
    }

    if (req.session.usuario) {
      if (!Array.isArray(req.session.usuario.progresoCursos)) {
        req.session.usuario.progresoCursos = [];
      }

      const progresoSesion = req.session.usuario.progresoCursos.find(
        (p) => p.curso === cursoId.toString()
      );

      if (progresoSesion) {
        progresoSesion.progreso = 0;
        progresoSesion.actualizadoEn = new Date();
      } else {
        req.session.usuario.progresoCursos.push({
          curso: cursoId.toString(),
          progreso: 0,
          actualizadoEn: new Date()
        });
      }
    }

    await RespuestaExamen.deleteMany({ usuario: usuarioId, curso: cursoId });

    const inscripcionActualizada = await Inscripcion.findById(inscripcion._id).populate('curso');

    res.json({
      success: true,
      message: 'El progreso del curso se reinició correctamente.',
      inscripcion: inscripcionActualizada
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inscripciones/:cursoId - Inscribirse a un curso
router.post('/:cursoId', requireAuth, async (req, res) => {
  try {
    const cursoId = req.params.cursoId;
    const usuarioId = req.session.usuario.id;

    // Verificar que el curso existe
    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Verificar si ya está inscrito
    const inscripcionExistente = await Inscripcion.findOne({
      usuario: usuarioId,
      curso: cursoId
    });

    if (inscripcionExistente) {
      return res.json({
        success: true,
        message: 'Ya estás inscrito en este curso',
        inscripcion: inscripcionExistente
      });
    }

    // Crear inscripción
    const inscripcion = new Inscripcion({
      usuario: usuarioId,
      curso: cursoId,
      estado: 'activo'
    });

    // Inicializar progreso de lecciones
    if (curso.secciones && curso.secciones.length > 0) {
      curso.secciones.forEach(seccion => {
        const requiereVideoSeccion = seccion.requiereVideo !== false;
        if (seccion.lecciones && seccion.lecciones.length > 0) {
          seccion.lecciones.forEach(leccion => {
            // Usar el _id de la lección si existe, sino usar un identificador temporal
            const leccionId = leccion._id || leccion.id || new mongoose.Types.ObjectId();
            const tieneVideo = Boolean(leccion?.urlVideo);
            const requiereVideoLeccion = leccion?.requiereVideo === undefined
              ? requiereVideoSeccion
              : leccion.requiereVideo !== false;
            const requiereVideo = requiereVideoLeccion && tieneVideo && leccion?.tipo === 'video';
            inscripcion.progresoLecciones.push({
              leccionId: leccionId,
              videoCompletado: !requiereVideo,
              completado: false,
              progreso: 0
            });
          });
        }
      });
    }

    inscripcion.calcularProgreso();
    await inscripcion.save();

    const usuario = await Usuario.findById(usuarioId);

    if (usuario) {
      if (!usuario.cursosInscritos.some(c => c.toString() === cursoId.toString())) {
        usuario.cursosInscritos.push(cursoId);
      }

      const progresoExistente = usuario.progresoCursos.find(p => p.curso && p.curso.toString() === cursoId.toString());
      if (progresoExistente) {
        progresoExistente.progreso = inscripcion.progresoGeneral;
        progresoExistente.actualizadoEn = new Date();
      } else {
        usuario.progresoCursos.push({
          curso: cursoId,
          progreso: inscripcion.progresoGeneral,
          actualizadoEn: new Date()
        });
      }
    }

    curso.estudiantesInscritos = (curso.estudiantesInscritos || 0) + 1;
    await curso.save();

    // Crear notificación de bienvenida al curso
    const notificacion = await Notificacion.create({
      usuario: usuarioId,
      titulo: 'Bienvenido al curso',
      mensaje: `Te has inscrito exitosamente al curso: ${curso.titulo}`,
      tipo: 'curso',
      link: `/curso.html?id=${cursoId}`
    });

    if (usuario) {
      usuario.notificacionesNoLeidas.push({
        notificacion: notificacion._id,
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        tipo: notificacion.tipo,
        link: notificacion.link,
        fecha: notificacion.fechaCreacion
      });
      await usuario.save();
    }

    if (req.session.usuario && req.session.usuario.id === usuarioId.toString()) {
      if (!req.session.usuario.cursosInscritos) {
        req.session.usuario.cursosInscritos = [];
      }
      if (!req.session.usuario.cursosInscritos.includes(cursoId.toString())) {
        req.session.usuario.cursosInscritos.push(cursoId.toString());
      }

      if (!Array.isArray(req.session.usuario.progresoCursos)) {
        req.session.usuario.progresoCursos = [];
      }
      const progresoSesion = req.session.usuario.progresoCursos.find(p => p.curso === cursoId.toString());
      if (progresoSesion) {
        progresoSesion.progreso = inscripcion.progresoGeneral;
        progresoSesion.actualizadoEn = new Date();
      } else {
        req.session.usuario.progresoCursos.push({
          curso: cursoId.toString(),
          progreso: inscripcion.progresoGeneral,
          actualizadoEn: new Date()
        });
      }

      if (!Array.isArray(req.session.usuario.notificacionesNoLeidas)) {
        req.session.usuario.notificacionesNoLeidas = [];
      }
      req.session.usuario.notificacionesNoLeidas.push({
        notificacion: notificacion._id.toString(),
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        tipo: notificacion.tipo,
        link: notificacion.link,
        fecha: notificacion.fechaCreacion
      });
    }

    res.status(201).json({
      success: true,
      message: 'Inscripción exitosa',
      inscripcion: await Inscripcion.findById(inscripcion._id).populate('curso')
    });
  } catch (error) {
    console.error('Error al inscribirse:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/inscripciones/:cursoId - Cancelar inscripción en un curso
router.delete('/:cursoId', requireAuth, async (req, res) => {
  try {
    const { cursoId } = req.params;
    const usuarioId = req.session.usuario.id;

    const inscripcion = await Inscripcion.findOneAndDelete({
      usuario: usuarioId,
      curso: cursoId
    });

    if (!inscripcion) {
      return res.status(404).json({ error: 'No estás inscrito en este curso' });
    }

    await RespuestaExamen.deleteMany({ usuario: usuarioId, curso: cursoId });

    const curso = await Curso.findById(cursoId);
    if (curso && typeof curso.estudiantesInscritos === 'number' && curso.estudiantesInscritos > 0) {
      curso.estudiantesInscritos -= 1;
      await curso.save();
    }

    const usuario = await Usuario.findById(usuarioId);
    if (usuario) {
      usuario.cursosInscritos = (usuario.cursosInscritos || []).filter(
        (c) => c.toString() !== cursoId.toString()
      );
      usuario.progresoCursos = (usuario.progresoCursos || []).filter(
        (p) => !(p.curso && p.curso.toString() === cursoId.toString())
      );
      await usuario.save();
    }

    if (req.session.usuario) {
      req.session.usuario.cursosInscritos = (req.session.usuario.cursosInscritos || []).filter(
        (c) => c !== cursoId.toString()
      );
      req.session.usuario.progresoCursos = (req.session.usuario.progresoCursos || []).filter(
        (p) => p.curso !== cursoId.toString()
      );
    }

    res.json({
      success: true,
      message: 'Se ha cancelado tu inscripción en el curso.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inscripciones/:cursoId/progreso/:leccionId - Actualizar progreso de lección
router.put('/:cursoId/progreso/:leccionId', requireAuth, async (req, res) => {
  try {
    const { leccionId } = req.params;
    const { completado, progreso, videoCompletado } = req.body || {};

    const inscripcion = await Inscripcion.findOne({
      usuario: req.session.usuario.id,
      curso: req.params.cursoId
    });

    if (!inscripcion) {
      return res.status(404).json({ error: 'No estás inscrito en este curso' });
    }

    const curso = await Curso.findById(req.params.cursoId).lean();
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const seccionesOrdenadas = Array.isArray(curso.secciones)
      ? [...curso.secciones].sort((a, b) => (a.orden || 0) - (b.orden || 0))
      : [];

    let indiceSeccionActual = -1;
    let seccionActual = null;

    for (let i = 0; i < seccionesOrdenadas.length; i += 1) {
      const seccion = seccionesOrdenadas[i];
      if (!seccion?.lecciones) continue;
      const encontrada = seccion.lecciones.find(lec => lec?._id && lec._id.toString() === leccionId);
      if (encontrada) {
        indiceSeccionActual = i;
        seccionActual = seccion;
        break;
      }
    }

    if (indiceSeccionActual === -1 || !seccionActual) {
      return res.status(404).json({ error: 'La lección no pertenece a este curso' });
    }

    const leccionCurso = seccionActual.lecciones.find(lec => lec?._id && lec._id.toString() === leccionId) || null;
    const requiereVideoLeccion = Boolean(
      leccionCurso &&
      leccionCurso.tipo === 'video' &&
      leccionCurso.urlVideo &&
      (leccionCurso.requiereVideo === undefined
        ? seccionActual.requiereVideo !== false
        : leccionCurso.requiereVideo !== false)
    );

    if (indiceSeccionActual > 0) {
      const seccionAnterior = seccionesOrdenadas[indiceSeccionActual - 1];
      if (seccionAnterior?.tieneExamen) {
        const examenesCurso = Array.isArray(curso.examenes) ? curso.examenes : [];
        const examenSeccionAnterior = examenesCurso.find(examen => {
          if (!examen?.activo || examen.tipo !== 'seccion' || !examen.seccion) return false;
          return examen.seccion.toString() === seccionAnterior._id.toString();
        });

        if (examenSeccionAnterior) {
          const examenAprobado = await RespuestaExamen.exists({
            usuario: req.session.usuario.id,
            examen: examenSeccionAnterior._id,
            aprobado: true
          });

          if (!examenAprobado) {
            return res.status(403).json({
              error: 'Debes aprobar el control de la sección anterior antes de continuar con este módulo.'
            });
          }
        }
      }
    }

    const leccionProgreso = inscripcion.progresoLecciones.find(
      p => p.leccionId.toString() === leccionId
    );

    if (leccionProgreso) {
      if (videoCompletado !== undefined) {
        leccionProgreso.videoCompletado = Boolean(videoCompletado);
      }

      if (completado !== undefined && completado) {
        if (requiereVideoLeccion && !leccionProgreso.videoCompletado) {
          return res.status(400).json({ error: 'Debes visualizar el video completo antes de marcar la lección como completada.' });
        }
      }

      if (completado !== undefined) leccionProgreso.completado = completado;
      if (progreso !== undefined) leccionProgreso.progreso = progreso;
      if (completado) leccionProgreso.fechaCompletado = new Date();
    } else {
      if (completado && requiereVideoLeccion && !videoCompletado) {
        return res.status(400).json({ error: 'Debes visualizar el video completo antes de marcar la lección como completada.' });
      }

      inscripcion.progresoLecciones.push({
        leccionId,
        videoCompletado: requiereVideoLeccion ? Boolean(videoCompletado) : true,
        completado: completado || false,
        progreso: progreso || 0,
        fechaCompletado: completado ? new Date() : null
      });
    }

    inscripcion.ultimaLeccionAccedida = {
      cursoId: req.params.cursoId,
      leccionId
    };
    inscripcion.fechaUltimoAcceso = new Date();

    inscripcion.calcularProgreso();
    await inscripcion.save();

    const usuario = await Usuario.findById(req.session.usuario.id);
    if (usuario) {
      const progresoExistente = usuario.progresoCursos.find(p => p.curso && p.curso.toString() === req.params.cursoId.toString());
      if (progresoExistente) {
        progresoExistente.progreso = inscripcion.progresoGeneral;
        progresoExistente.actualizadoEn = new Date();
      } else {
        usuario.progresoCursos.push({
          curso: req.params.cursoId,
          progreso: inscripcion.progresoGeneral,
          actualizadoEn: new Date()
        });
      }
      await usuario.save();
    }

    if (req.session.usuario) {
      if (!Array.isArray(req.session.usuario.progresoCursos)) {
        req.session.usuario.progresoCursos = [];
      }
      const progresoSesion = req.session.usuario.progresoCursos.find(p => p.curso === req.params.cursoId.toString());
      if (progresoSesion) {
        progresoSesion.progreso = inscripcion.progresoGeneral;
        progresoSesion.actualizadoEn = new Date();
      } else {
        req.session.usuario.progresoCursos.push({
          curso: req.params.cursoId.toString(),
          progreso: inscripcion.progresoGeneral,
          actualizadoEn: new Date()
        });
      }
    }

    const inscripcionActualizada = await Inscripcion.findById(inscripcion._id).populate('curso');

    res.json({
      success: true,
      inscripcion: inscripcionActualizada
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

