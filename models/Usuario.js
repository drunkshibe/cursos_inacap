// models/Usuario.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const DiplomaSchema = require('./Diploma');

const UsuarioSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  fotoPerfil: {
    type: String,
    default: 'Pictures/profile.png'
  },
  fechaNacimiento: Date,
  direccion: String,
  rol: {
    type: String,
    enum: ['estudiante', 'profesor', 'admin_dae'],
    default: 'estudiante'
  },
  cursosInscritos: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curso'
    }],
    default: []
  },
  progresoCursos: {
    type: [{
      curso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Curso'
      },
      progreso: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      actualizadoEn: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  notificacionesNoLeidas: {
    type: [{
      notificacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notificacion'
      },
      titulo: String,
      mensaje: String,
      tipo: String,
      link: String,
      fecha: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  diplomas: {
    type: [DiplomaSchema],
    default: []
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// Hash de contraseña antes de guardar
UsuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
UsuarioSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener nombre completo
UsuarioSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

module.exports = mongoose.model('Usuario', UsuarioSchema);

