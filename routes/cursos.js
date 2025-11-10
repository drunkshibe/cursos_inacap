// routes/cursos.js
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const Curso = require('../models/Curso');
const { uploadVideo, uploadAudio, uploadImage, uploadMultiple } = require('../config/multer');

const formatVideoPath = (filename) => `/api/media/videos/${filename}`;
const formatAudioPath = (filename) => `/api/media/audios/${filename}`;
const formatMaterialPath = (filename) => `/uploads/materiales/${filename}`;

const normalizarRutaMedia = (url, tipo) => {
  if (!url || typeof url !== 'string') return url;
  if (tipo === 'video' && url.startsWith('/uploads/videos/')) {
    return url.replace('/uploads/videos/', '/api/media/videos/');
  }
  if (tipo === 'audio' && url.startsWith('/uploads/audios/')) {
    return url.replace('/uploads/audios/', '/api/media/audios/');
  }
  return url;
};

const parseJSONSafe = (value, fallback = null) => {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const parseDateValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseBooleanValue = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'sí', 'si', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return undefined;
};

const normalizarPreguntas = (preguntasEntrada) => {
  const preguntas = parseJSONSafe(preguntasEntrada, preguntasEntrada);

  if (!Array.isArray(preguntas) || preguntas.length === 0) {
    throw new Error('Debes proporcionar al menos una pregunta para el examen.');
  }

  return preguntas.map((preguntaBruta, index) => {
    const preguntaTexto = (preguntaBruta.pregunta || preguntaBruta.enunciado || '').trim();
    if (!preguntaTexto) {
      throw new Error(`La pregunta ${index + 1} debe incluir un enunciado.`);
    }

    const tipo = preguntaBruta.tipo || 'opcion_multiple';
    const puntos = Number(preguntaBruta.puntos ?? 1);

    if (Number.isNaN(puntos) || puntos <= 0) {
      throw new Error(`La pregunta ${index + 1} debe tener un puntaje mayor a cero.`);
    }

    let opciones = [];
    if (tipo === 'texto') {
      opciones = [];
    } else {
      const opcionesEntrada = parseJSONSafe(preguntaBruta.opciones, preguntaBruta.opciones);
      if (!Array.isArray(opcionesEntrada) || opcionesEntrada.length === 0) {
        throw new Error(`La pregunta ${index + 1} debe incluir opciones de respuesta.`);
      }

      opciones = opcionesEntrada.map((opcion, opcionIndex) => {
        const texto = (opcion.texto || opcion.descripcion || '').trim();
        if (!texto) {
          throw new Error(`La opción ${opcionIndex + 1} de la pregunta ${index + 1} debe tener contenido.`);
        }

        const esCorrecta = Boolean(
          opcion.esCorrecta ||
          opcion.correcta ||
          opcion.es_correcta ||
          opcion.valor === true
        );

        return {
          texto,
          esCorrecta
        };
      });

      const totalCorrectas = opciones.filter(opcion => opcion.esCorrecta).length;
      if (totalCorrectas === 0) {
        throw new Error(`La pregunta ${index + 1} debe tener al menos una respuesta correcta.`);
      }
    }

    return {
      pregunta: preguntaTexto,
      tipo,
      puntos,
      orden: Number.isFinite(Number(preguntaBruta.orden))
        ? Number(preguntaBruta.orden)
        : index + 1,
      opciones
    };
  });
};

const prepararExamenPayload = (body, curso) => {
  const payload = { ...body };

  payload.titulo = (payload.titulo || '').trim();
  if (!payload.titulo) {
    throw new Error('El examen debe tener un título.');
  }

  payload.descripcion = payload.descripcion || '';
  payload.tipo = payload.tipo === 'final' ? 'final' : 'seccion';
  payload.tiempoLimite = Number(payload.tiempoLimite ?? 0);
  if (Number.isNaN(payload.tiempoLimite) || payload.tiempoLimite < 0) {
    throw new Error('El tiempo límite debe ser un número positivo o cero.');
  }

  payload.intentosPermitidos = Number(payload.intentosPermitidos ?? 2);
  if (Number.isNaN(payload.intentosPermitidos) || payload.intentosPermitidos < 1) {
    throw new Error('Los intentos permitidos deben ser un número mayor o igual a 1.');
  }

  payload.porcentajeAprobacion = Number(payload.porcentajeAprobacion ?? 70);
  if (
    Number.isNaN(payload.porcentajeAprobacion) ||
    payload.porcentajeAprobacion < 0 ||
    payload.porcentajeAprobacion > 100
  ) {
    throw new Error('El porcentaje de aprobación debe estar entre 0 y 100.');
  }

  payload.preguntas = normalizarPreguntas(payload.preguntas);

  if (payload.tipo === 'seccion') {
    const seccionId = payload.seccion || payload.seccionId;
    if (!seccionId) {
      throw new Error('Los exámenes de sección deben estar asociados a una sección del curso.');
    }
    const seccion = curso.secciones.id(seccionId);
    if (!seccion) {
      throw new Error('La sección indicada para el examen no existe en el curso.');
    }
    payload.seccion = seccion._id;
  } else {
    payload.seccion = null;
  }

  return payload;
};

const actualizarExamenConDatos = (examen, body, curso) => {
  if (body.titulo !== undefined) {
    const titulo = (body.titulo || '').trim();
    if (!titulo) {
      throw new Error('El examen debe tener un título.');
    }
    examen.titulo = titulo;
  }

  if (body.descripcion !== undefined) {
    examen.descripcion = body.descripcion || '';
  }

  if (body.tipo !== undefined) {
    const tipo = body.tipo === 'final' ? 'final' : 'seccion';
    examen.tipo = tipo;
    if (tipo === 'seccion') {
      const seccionId = body.seccion || body.seccionId;
      if (!seccionId) {
        throw new Error('Los exámenes de sección deben estar asociados a una sección del curso.');
      }
      const seccion = curso.secciones.id(seccionId);
      if (!seccion) {
        throw new Error('La sección indicada para el examen no existe en el curso.');
      }
      examen.seccion = seccion._id;
    } else {
      examen.seccion = null;
    }
  } else if (body.seccion !== undefined || body.seccionId !== undefined) {
    const seccionId = body.seccion || body.seccionId;
    if (examen.tipo === 'final') {
      examen.seccion = null;
    } else {
      const seccion = curso.secciones.id(seccionId);
      if (!seccion) {
        throw new Error('La sección indicada para el examen no existe en el curso.');
      }
      examen.seccion = seccion._id;
    }
  }

  if (body.tiempoLimite !== undefined) {
    const tiempo = Number(body.tiempoLimite);
    if (Number.isNaN(tiempo) || tiempo < 0) {
      throw new Error('El tiempo límite debe ser un número positivo o cero.');
    }
    examen.tiempoLimite = tiempo;
  }

  if (body.intentosPermitidos !== undefined) {
    const intentos = Number(body.intentosPermitidos);
    if (Number.isNaN(intentos) || intentos < 1) {
      throw new Error('Los intentos permitidos deben ser un número mayor o igual a 1.');
    }
    examen.intentosPermitidos = intentos;
  }

  if (body.porcentajeAprobacion !== undefined) {
    const porcentaje = Number(body.porcentajeAprobacion);
    if (Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      throw new Error('El porcentaje de aprobación debe estar entre 0 y 100.');
    }
    examen.porcentajeAprobacion = porcentaje;
  }

  if (body.preguntas !== undefined) {
    examen.preguntas = normalizarPreguntas(body.preguntas);
  }
};

const normalizarProfesorEnPayload = (payload) => {
  if (!payload) return;
  const nombre = payload['profesor.nombre'];
  const descripcion = payload['profesor.descripcion'];

  if (nombre !== undefined || descripcion !== undefined) {
    payload.profesor = payload.profesor || {};
    if (nombre !== undefined) payload.profesor.nombre = nombre;
    if (descripcion !== undefined) payload.profesor.descripcion = descripcion;
    delete payload['profesor.nombre'];
    delete payload['profesor.descripcion'];
  }
};

const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
};

const requireAdminDAE = (req, res, next) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  if (req.session.usuario.rol !== 'admin_dae') {
    return res.status(403).json({ error: 'Acceso restringido al Administrador DAE' });
  }
  next();
};

// GET /api/cursos - Obtener todos los cursos
router.get('/', async (req, res) => {
  try {
    const includeTodos = req.query.todos === '1' && req.session?.usuario?.rol === 'admin_dae';
    const filtro = includeTodos ? {} : { activo: true };
    const cursos = await Curso.find(filtro).sort({ fechaCreacion: -1 });
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cursos/:id - Obtener un curso por ID
router.get('/:id', async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.json(curso);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cursos - Crear un nuevo curso
router.post('/', requireAdminDAE, uploadImage, async (req, res) => {
  try {
    const cursoData = {
      ...req.body,
      imagen: req.file ? `/uploads/images/${req.file.filename}` : req.body.imagen
    };

    // Parsear secciones si vienen como string
    if (typeof cursoData.secciones === 'string') {
      cursoData.secciones = JSON.parse(cursoData.secciones);
    }

    normalizarProfesorEnPayload(cursoData);

    if (cursoData.duracionTotal !== undefined) {
      const duracion = Number(cursoData.duracionTotal);
      if (Number.isNaN(duracion) || duracion < 0) {
        return res.status(400).json({ error: 'La duración del curso debe ser un número positivo.' });
      }
      cursoData.duracionTotal = duracion;
    }

    if (cursoData.activo !== undefined) {
      cursoData.activo = parseBooleanValue(cursoData.activo);
    }

    if (cursoData.fechaPublicacion !== undefined) {
      const fecha = parseDateValue(cursoData.fechaPublicacion);
      if (!fecha) {
        return res.status(400).json({ error: 'La fecha de publicación no es válida.' });
      }
      cursoData.fechaPublicacion = fecha;
    } else {
      cursoData.fechaPublicacion = new Date();
    }

    if (cursoData.fechaCierre !== undefined) {
      if (cursoData.fechaCierre === null || cursoData.fechaCierre === '') {
        cursoData.fechaCierre = null;
      } else {
        const fecha = parseDateValue(cursoData.fechaCierre);
        if (!fecha) {
          return res.status(400).json({ error: 'La fecha de cierre no es válida.' });
        }
        cursoData.fechaCierre = fecha;
      }
    }

    const curso = new Curso(cursoData);
    await curso.save();
    res.status(201).json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/cursos/:id - Actualizar un curso
router.put('/:id', requireAdminDAE, uploadImage, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Si hay una nueva imagen, actualizar la ruta
    if (req.file) {
      updateData.imagen = `/uploads/images/${req.file.filename}`;
    }

    // Parsear secciones si vienen como string
    if (typeof updateData.secciones === 'string') {
      updateData.secciones = JSON.parse(updateData.secciones);
    }

    normalizarProfesorEnPayload(updateData);

    if (updateData.duracionTotal !== undefined) {
      const duracion = Number(updateData.duracionTotal);
      if (Number.isNaN(duracion) || duracion < 0) {
        return res.status(400).json({ error: 'La duración del curso debe ser un número positivo.' });
      }
      updateData.duracionTotal = duracion;
    }

    if (updateData.activo !== undefined) {
      const activo = parseBooleanValue(updateData.activo);
      if (activo === undefined) {
        return res.status(400).json({ error: 'El estado activo debe ser verdadero o falso.' });
      }
      updateData.activo = activo;
      if (!activo && updateData.fechaCierre === undefined) {
        updateData.fechaCierre = new Date();
      }
      if (activo && updateData.fechaCierre === undefined) {
        updateData.fechaCierre = null;
      }
    }

    if (updateData.fechaPublicacion !== undefined) {
      if (updateData.fechaPublicacion === null || updateData.fechaPublicacion === '') {
        updateData.fechaPublicacion = null;
      } else {
        const fecha = parseDateValue(updateData.fechaPublicacion);
        if (!fecha) {
          return res.status(400).json({ error: 'La fecha de publicación no es válida.' });
        }
        updateData.fechaPublicacion = fecha;
      }
    }

    if (updateData.fechaCierre !== undefined) {
      if (updateData.fechaCierre === null || updateData.fechaCierre === '') {
        updateData.fechaCierre = null;
      } else {
        const fecha = parseDateValue(updateData.fechaCierre);
        if (!fecha) {
          return res.status(400).json({ error: 'La fecha de cierre no es válida.' });
        }
        updateData.fechaCierre = fecha;
      }
    }

    const curso = await Curso.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cursos/:id - Eliminar un curso (soft delete)
router.delete('/:id', requireAdminDAE, async (req, res) => {
  try {
    const curso = await Curso.findByIdAndUpdate(
      req.params.id,
      { activo: false, fechaCierre: new Date() },
      { new: true }
    );

    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    res.json({ message: 'Curso eliminado exitosamente', curso });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cursos/:id/secciones - Agregar una sección a un curso
router.post('/:id/secciones', requireAdminDAE, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const seccionData = { ...req.body };
    if (seccionData.requiereVideo !== undefined) {
      const requiereVideo = parseBooleanValue(seccionData.requiereVideo);
      if (requiereVideo === undefined) {
        return res.status(400).json({ error: 'El indicador de video de la sección es inválido.' });
      }
      seccionData.requiereVideo = requiereVideo;
    }
    if (seccionData.orden !== undefined) {
      const orden = Number(seccionData.orden);
      if (Number.isNaN(orden)) {
        return res.status(400).json({ error: 'El orden de la sección debe ser numérico.' });
      }
      seccionData.orden = orden;
    }

    curso.secciones.push(seccionData);
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/cursos/:cursoId/secciones/:seccionId - Actualizar una sección
router.put('/:cursoId/secciones/:seccionId', requireAdminDAE, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const seccion = curso.secciones.id(req.params.seccionId);
    if (!seccion) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    const updateData = { ...req.body };

    if (updateData.requiereVideo !== undefined) {
      const requiereVideo = parseBooleanValue(updateData.requiereVideo);
      if (requiereVideo === undefined) {
        return res.status(400).json({ error: 'El indicador de video de la sección es inválido.' });
      }
      updateData.requiereVideo = requiereVideo;
    }

    if (updateData.orden !== undefined) {
      const orden = Number(updateData.orden);
      if (Number.isNaN(orden)) {
        return res.status(400).json({ error: 'El orden de la sección debe ser numérico.' });
      }
      updateData.orden = orden;
    }

    Object.assign(seccion, updateData);
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cursos/:cursoId/secciones/:seccionId - Eliminar una sección
router.delete('/:cursoId/secciones/:seccionId', requireAdminDAE, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    curso.secciones.id(req.params.seccionId).remove();
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/cursos/:cursoId/secciones/:seccionId/lecciones - Agregar una lección
router.post('/:cursoId/secciones/:seccionId/lecciones', requireAdminDAE, uploadMultiple, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const seccion = curso.secciones.id(req.params.seccionId);
    if (!seccion) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    const leccionData = { ...req.body };
    const videoFile = req.files?.video?.[0];
    const audioFile = req.files?.audio?.[0];
    const materialFile = req.files?.material?.[0];

    if (!leccionData.titulo || !leccionData.titulo.toString().trim()) {
      return res.status(400).json({ error: 'La lección debe tener un título.' });
    }
    leccionData.titulo = leccionData.titulo.toString().trim();

    if (typeof leccionData.descripcion === 'string') {
      leccionData.descripcion = leccionData.descripcion.trim();
    }

    if (leccionData.orden !== undefined) {
      const orden = Number(leccionData.orden);
      if (Number.isNaN(orden)) {
        return res.status(400).json({ error: 'El orden de la lección debe ser numérico.' });
      }
      leccionData.orden = orden;
    }

    let requiereVideoLeccion = parseBooleanValue(leccionData.requiereVideo);
    if (requiereVideoLeccion === undefined) {
      requiereVideoLeccion = seccion.requiereVideo !== false;
    }
    leccionData.requiereVideo = requiereVideoLeccion;

    if (videoFile) {
      leccionData.urlVideo = formatVideoPath(videoFile.filename);
    } else if (leccionData.urlVideo) {
      leccionData.urlVideo = normalizarRutaMedia(leccionData.urlVideo, 'video');
    }

    if (requiereVideoLeccion && !leccionData.urlVideo) {
      return res.status(400).json({
        error: 'Esta lección requiere un video. Adjunta un archivo MP4, WebM, OGG o MOV.'
      });
    }

    if (audioFile) {
      leccionData.urlAudio = formatAudioPath(audioFile.filename);
    } else if (leccionData.urlAudio) {
      leccionData.urlAudio = normalizarRutaMedia(leccionData.urlAudio, 'audio');
    }

    if (materialFile) {
      leccionData.urlArchivo = formatMaterialPath(materialFile.filename);
    }

    if (leccionData.urlVideo) {
      leccionData.tipo = 'video';
    } else if (leccionData.urlAudio) {
      leccionData.tipo = 'audio';
    } else {
      leccionData.tipo = 'texto';
    }

    seccion.lecciones.push(leccionData);
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/cursos/:cursoId/secciones/:seccionId/lecciones/:leccionId - Actualizar una lección
router.put('/:cursoId/secciones/:seccionId/lecciones/:leccionId', requireAdminDAE, uploadMultiple, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const seccion = curso.secciones.id(req.params.seccionId);
    if (!seccion) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    const leccion = seccion.lecciones.id(req.params.leccionId);
    if (!leccion) {
      return res.status(404).json({ error: 'Lección no encontrada' });
    }

    const updateData = { ...req.body };
    const videoFile = req.files?.video?.[0];
    const audioFile = req.files?.audio?.[0];
    const materialFile = req.files?.material?.[0];

    if (updateData.orden !== undefined) {
      const orden = Number(updateData.orden);
      if (Number.isNaN(orden)) {
        return res.status(400).json({ error: 'El orden de la lección debe ser numérico.' });
      }
      updateData.orden = orden;
    }

    if (typeof updateData.descripcion === 'string') {
      updateData.descripcion = updateData.descripcion.trim();
    }

    if (typeof updateData.titulo === 'string') {
      const titulo = updateData.titulo.trim();
      if (!titulo) {
        return res.status(400).json({ error: 'La lección debe mantener un título.' });
      }
      updateData.titulo = titulo;
    }

    let requiereVideoLeccion = parseBooleanValue(updateData.requiereVideo);
    const requiereVideoActual = leccion.requiereVideo === undefined
      ? seccion.requiereVideo !== false
      : leccion.requiereVideo !== false;
    if (requiereVideoLeccion === undefined) {
      requiereVideoLeccion = requiereVideoActual;
    }
    updateData.requiereVideo = requiereVideoLeccion;

    if (videoFile) {
      updateData.urlVideo = formatVideoPath(videoFile.filename);
    } else if (updateData.urlVideo) {
      updateData.urlVideo = normalizarRutaMedia(updateData.urlVideo, 'video');
    }

    if (typeof updateData.eliminarVideo !== 'undefined') {
      const eliminarVideo = parseBooleanValue(updateData.eliminarVideo);
      if (eliminarVideo === true) {
        updateData.urlVideo = null;
      }
      delete updateData.eliminarVideo;
    }

    const urlVideoFinal = updateData.urlVideo !== undefined ? updateData.urlVideo : leccion.urlVideo;
    if (requiereVideoLeccion && !urlVideoFinal) {
      return res.status(400).json({
        error: 'Esta lección requiere conservar un video asociado.'
      });
    }

    if (audioFile) {
      updateData.urlAudio = formatAudioPath(audioFile.filename);
    } else if (updateData.urlAudio) {
      updateData.urlAudio = normalizarRutaMedia(updateData.urlAudio, 'audio');
    }

    if (materialFile) {
      updateData.urlArchivo = formatMaterialPath(materialFile.filename);
    } else if (typeof updateData.eliminarMaterial !== 'undefined') {
      const eliminar = parseBooleanValue(updateData.eliminarMaterial);
      if (eliminar === true) {
        updateData.urlArchivo = null;
      }
      delete updateData.eliminarMaterial;
    }

    const urlAudioFinal = updateData.urlAudio !== undefined ? updateData.urlAudio : leccion.urlAudio;
    if (updateData.tipo === undefined) {
      if (urlVideoFinal) {
        updateData.tipo = 'video';
      } else if (urlAudioFinal) {
        updateData.tipo = 'audio';
      } else {
        updateData.tipo = 'texto';
      }
    }

    Object.assign(leccion, updateData);
    if (!leccion.urlVideo && leccion.tipo === 'video') {
      if (requiereVideoLeccion) {
        leccion.tipo = 'video';
      } else if (leccion.urlAudio) {
        leccion.tipo = 'audio';
      } else {
        leccion.tipo = 'texto';
      }
    }
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cursos/:cursoId/secciones/:seccionId/lecciones/:leccionId - Eliminar una lección
router.delete('/:cursoId/secciones/:seccionId/lecciones/:leccionId', requireAdminDAE, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const seccion = curso.secciones.id(req.params.seccionId);
    if (!seccion) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    seccion.lecciones.id(req.params.leccionId).remove();
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/cursos/:cursoId/examenes - Crear un examen
router.post('/:cursoId/examenes', requireAdminDAE, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const examenPayload = prepararExamenPayload(req.body, curso);
    curso.examenes.push(examenPayload);
    await curso.save();

    const nuevoExamen = curso.examenes[curso.examenes.length - 1];
    res.status(201).json(nuevoExamen);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/cursos/:cursoId/examenes/:examenId - Actualizar un examen
router.put('/:cursoId/examenes/:examenId', requireAdminDAE, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const examen = curso.examenes.id(req.params.examenId);
    if (!examen) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    actualizarExamenConDatos(examen, req.body, curso);
    await curso.save();

    res.json(examen);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cursos/:cursoId/examenes/:examenId - Eliminar un examen
router.delete('/:cursoId/examenes/:examenId', requireAdminDAE, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const examen = curso.examenes.id(req.params.examenId);
    if (!examen) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    examen.remove();
    await curso.save();

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

