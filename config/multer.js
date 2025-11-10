// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Asegurar que las carpetas existan
const uploadsDir = path.join(__dirname, '../uploads');
const videosDir = path.join(uploadsDir, 'videos');
const audiosDir = path.join(uploadsDir, 'audios');
const imagesDir = path.join(uploadsDir, 'images');
const diplomasDir = path.join(uploadsDir, 'diplomas');
const materialsDir = path.join(uploadsDir, 'materiales');

[uploadsDir, videosDir, audiosDir, imagesDir, diplomasDir, materialsDir].forEach(dir => {
  fs.ensureDirSync(dir);
});

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
  if (file.fieldname === 'video') {
      cb(null, videosDir);
  } else if (file.fieldname === 'audio') {
      cb(null, audiosDir);
  } else if (file.fieldname === 'imagen' || file.fieldname === 'fotoPerfil') {
      cb(null, imagesDir);
    } else if (file.fieldname === 'material') {
      cb(null, materialsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    // Generar nombre único: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocumentTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.template',
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
    'application/vnd.ms-powerpoint.template.macroEnabled.12'
  ];

  if (file.fieldname === 'video') {
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de video no permitido. Solo: MP4, WebM, OGG, MOV'), false);
    }
  } else if (file.fieldname === 'audio') {
    if (allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de audio no permitido. Solo: MP3, WAV, OGG, WebM'), false);
    }
  } else if (file.fieldname === 'imagen' || file.fieldname === 'fotoPerfil') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de imagen no permitido. Solo: JPG, PNG, GIF, WebP'), false);
    }
  } else if (file.fieldname === 'material') {
    if (allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF y presentaciones (PPT, PPTX)'), false);
    }
  } else {
    cb(null, true);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB máximo
  },
  fileFilter: fileFilter
});

// Middlewares específicos
const uploadVideo = upload.single('video');
const uploadAudio = upload.single('audio');
const uploadImage = upload.single('imagen');
const uploadMultiple = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'imagen', maxCount: 1 },
  { name: 'material', maxCount: 1 }
]);

module.exports = {
  upload,
  uploadVideo,
  uploadAudio,
  uploadImage,
  uploadMultiple,
  videosDir,
  audiosDir,
  imagesDir,
  uploadsDir,
  diplomasDir,
  materialsDir
};

