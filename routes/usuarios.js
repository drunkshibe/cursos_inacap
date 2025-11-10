const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const Usuario = require('../models/Usuario');
const { upload } = require('../config/multer');

const router = express.Router();

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

const uploadFotoPerfil = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.single('fotoPerfil')(req, res, next);
  }
  return next();
};

const limpiarUsuario = (usuario) => {
  if (!usuario) return null;
  const plano = usuario.toObject ? usuario.toObject() : { ...usuario };
  delete plano.password;
  return plano;
};

const rolesPermitidos = ['estudiante', 'profesor', 'admin_dae'];

const normalizarRol = (rol) => {
  if (rol === undefined || rol === null || rol === '') return undefined;
  const rolNormalizado = rol.toString().trim();
  if (!rolesPermitidos.includes(rolNormalizado)) {
    throw new Error('El rol indicado no es válido.');
  }
  return rolNormalizado;
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

const eliminarArchivoSiExiste = async (ruta) => {
  if (!ruta || !ruta.startsWith('/uploads/')) return;
  try {
    const absoluta = path.join(__dirname, '..', ruta);
    if (await fs.pathExists(absoluta)) {
      await fs.remove(absoluta);
    }
  } catch (error) {
    console.warn('No se pudo eliminar el archivo:', error.message);
  }
};

const actualizarSesionSiCorresponde = (req, usuario) => {
  if (!req.session.usuario) return;
  if (req.session.usuario.id?.toString() !== usuario._id.toString()) return;

  req.session.usuario.nombre = usuario.nombre;
  req.session.usuario.apellido = usuario.apellido;
  req.session.usuario.nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
  req.session.usuario.fotoPerfil = usuario.fotoPerfil;
  req.session.usuario.rol = usuario.rol;
  req.session.usuario.activo = usuario.activo;
};

router.get('/', requireAdminDAE, async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password').sort({ fechaCreacion: -1 });
    res.json({ success: true, usuarios });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAdminDAE, async (req, res) => {
  try {
    const { email, password, nombre, apellido, rol, activo } = req.body || {};

    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({ error: 'Email, contraseña, nombre y apellido son obligatorios.' });
    }

    const emailNormalizado = email.toLowerCase();
    const existente = await Usuario.findOne({ email: emailNormalizado });
    if (existente) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    const rolAsignado = normalizarRol(rol) || 'estudiante';
    const estado = activo === undefined ? true : parseBooleanValue(activo);
    if (estado === undefined) {
      return res.status(400).json({ error: 'El estado activo es inválido.' });
    }

    const nuevoUsuario = new Usuario({
      email: emailNormalizado,
      password,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rol: rolAsignado,
      activo: estado
    });

    await nuevoUsuario.save();

    res.status(201).json({
      success: true,
      usuario: limpiarUsuario(nuevoUsuario)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireAdminDAE, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const {
      email,
      nombre,
      apellido,
      rol,
      activo,
      password
    } = req.body || {};

    if (email !== undefined) {
      const emailNormalizado = email.toLowerCase();
      if (emailNormalizado !== usuario.email) {
        const existe = await Usuario.findOne({ email: emailNormalizado });
        if (existe) {
          return res.status(400).json({ error: 'El email ya está registrado.' });
        }
        usuario.email = emailNormalizado;
      }
    }

    if (nombre !== undefined) {
      usuario.nombre = nombre.trim() || usuario.nombre;
    }

    if (apellido !== undefined) {
      usuario.apellido = apellido.trim() || usuario.apellido;
    }

    if (rol !== undefined) {
      usuario.rol = normalizarRol(rol);
    }

    if (activo !== undefined) {
      const estado = parseBooleanValue(activo);
      if (estado === undefined) {
        return res.status(400).json({ error: 'El estado activo es inválido.' });
      }
      usuario.activo = estado;
    }

    if (password !== undefined && password !== '') {
      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      }
      usuario.password = password;
    }

    await usuario.save();
    actualizarSesionSiCorresponde(req, usuario);

    res.json({ success: true, usuario: limpiarUsuario(usuario) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireAdminDAE, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    usuario.activo = false;
    await usuario.save();
    actualizarSesionSiCorresponde(req, usuario);

    res.json({ success: true, usuario: limpiarUsuario(usuario) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.session.usuario.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ success: true, usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/me', requireAuth, uploadFotoPerfil, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.session.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const {
      nombre,
      apellido,
      direccion,
      fechaNacimiento,
      passwordActual,
      passwordNueva,
      eliminarFoto
    } = req.body || {};

    if (nombre !== undefined) {
      usuario.nombre = nombre.trim() || usuario.nombre;
    }

    if (apellido !== undefined) {
      usuario.apellido = apellido.trim() || usuario.apellido;
    }

    if (direccion !== undefined) {
      usuario.direccion = direccion.trim();
    }

    if (fechaNacimiento !== undefined) {
      if (fechaNacimiento === '' || fechaNacimiento === null) {
        usuario.fechaNacimiento = null;
      } else {
        const fecha = new Date(fechaNacimiento);
        if (Number.isNaN(fecha.getTime())) {
          return res.status(400).json({ error: 'La fecha de nacimiento no es válida.' });
        }
        usuario.fechaNacimiento = fecha;
      }
    }

    if (passwordActual || passwordNueva) {
      if (!passwordActual || !passwordNueva) {
        return res.status(400).json({ error: 'Debes proporcionar la contraseña actual y la nueva contraseña.' });
      }

      const coincide = await usuario.comparePassword(passwordActual);
      if (!coincide) {
        return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
      }

      usuario.password = passwordNueva;
    }

    const solicitarEliminarFoto = parseBooleanValue(eliminarFoto);

    if (solicitarEliminarFoto === true && !req.file) {
      await eliminarArchivoSiExiste(usuario.fotoPerfil);
      usuario.fotoPerfil = 'Pictures/profile.png';
    }

    if (req.file) {
      const rutaPublica = `/uploads/images/${req.file.filename}`;
      if (usuario.fotoPerfil && usuario.fotoPerfil.startsWith('/uploads/images/') && usuario.fotoPerfil !== rutaPublica) {
        await eliminarArchivoSiExiste(usuario.fotoPerfil);
      }
      usuario.fotoPerfil = rutaPublica;
    }

    await usuario.save();
    actualizarSesionSiCorresponde(req, usuario);

    const usuarioLimpio = limpiarUsuario(usuario);
    res.json({ success: true, usuario: usuarioLimpio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

