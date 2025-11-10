// models/Curso.js
const mongoose = require('mongoose');
const { ExamenSchema } = require('./Examen');

const LeccionSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true
  },
  descripcion: String,
  contenido: String, // HTML o texto del contenido de la lección
  tipo: {
    type: String,
    enum: ['video', 'audio', 'texto', 'archivo'],
    default: 'texto'
  },
  urlVideo: String,
  urlAudio: String,
  urlArchivo: String,
  duracion: Number, // en minutos
  requiereVideo: {
    type: Boolean,
    default: true
  },
  orden: {
    type: Number,
    required: true
  },
  completado: {
    type: Boolean,
    default: false
  }
}, { _id: true }); // Asegurar que las lecciones tengan _id

const SeccionSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true
  },
  descripcion: String,
  orden: {
    type: Number,
    required: true
  },
  requiereVideo: {
    type: Boolean,
    default: true
  },
  lecciones: [LeccionSchema],
  tieneExamen: {
    type: Boolean,
    default: false
  }
}, { _id: true }); // Asegurar que las secciones tengan _id

const CursoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  imagen: {
    type: String,
    default: 'Pictures/default-course.jpg'
  },
  profesor: {
    nombre: {
      type: String,
      required: true
    },
    avatar: String,
    descripcion: String
  },
  categoria: {
    type: String,
    default: 'General'
  },
  nivel: {
    type: String,
    enum: ['Principiante', 'Intermedio', 'Avanzado'],
    default: 'Intermedio'
  },
  idioma: {
    type: String,
    default: 'Español'
  },
  duracionTotal: {
    type: Number, // en horas
    default: 0
  },
  calificacion: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numValoraciones: {
    type: Number,
    default: 0
  },
  precio: {
    type: Number,
    default: 0
  },
  activo: {
    type: Boolean,
    default: true
  },
  secciones: [SeccionSchema],
  estudiantesInscritos: {
    type: Number,
    default: 0
  },
  fechaPublicacion: {
    type: Date,
    default: Date.now
  },
  fechaCierre: {
    type: Date,
    default: null
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },
  examenes: {
    type: [ExamenSchema],
    default: []
  }
});

// Middleware para actualizar fecha de actualización
CursoSchema.pre('save', function(next) {
  this.fechaActualizacion = Date.now();
  next();
});

module.exports = mongoose.model('Curso', CursoSchema);

