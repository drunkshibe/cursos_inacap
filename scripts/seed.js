// scripts/seed.js
// Script para poblar la base de datos con datos iniciales
// Ejecutar desde Node.js: node scripts/seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const Curso = require('../models/Curso');
const Usuario = require('../models/Usuario');
const Inscripcion = require('../models/Inscripcion');
const Notificacion = require('../models/Notificacion');
const connectDB = require('../config/database');

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando poblamiento de base de datos...\n');
    
    // Conectar a la base de datos
    await connectDB();

    // Limpiar datos existentes
    console.log('🗑️  Limpiando datos existentes...');
    await Inscripcion.deleteMany({});
    await Notificacion.deleteMany({});
    await Curso.deleteMany({});
    await Usuario.deleteMany({}); // Limpiar usuarios para recrearlos
    console.log('✅ Datos limpiados\n');

    const cursosIniciales = [
      {
        titulo: 'Fundamentos de Ciberseguridad',
        descripcion: 'Aprende los fundamentos de la ciberseguridad: conceptos, amenazas, defensas y buenas prácticas. Este curso cubre teoría y ejercicios prácticos para entender cómo proteger sistemas y redes.',
        imagen: 'Pictures/Ciberseguridad.jpg',
        profesor: {
          nombre: 'Johnathan Fletcher',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Experto en ciberseguridad con 10+ años de experiencia en defensa y auditoría'
        },
        categoria: 'Ciberseguridad',
        nivel: 'Intermedio',
        idioma: 'Español',
        duracionTotal: 4.5,
        calificacion: 4.2,
        numValoraciones: 1200,
        precio: 0,
        activo: true,
        estudiantesInscritos: 3500,
        secciones: [
          {
            titulo: 'Introducción a la ciberseguridad',
            descripcion: 'Conceptos básicos y fundamentos de la seguridad informática',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { 
                titulo: 'Presentación del curso', 
                descripcion: 'Bienvenida al curso de Fundamentos de Ciberseguridad',
                tipo: 'texto', 
                orden: 1,
                contenido: '<h4>Bienvenida</h4><p>Este curso te introducirá a los conceptos fundamentales de la ciberseguridad. Aprenderás sobre amenazas, defensas y mejores prácticas para proteger sistemas y redes.</p><h5>Objetivos del curso:</h5><ul><li>Entender los conceptos básicos de ciberseguridad</li><li>Identificar amenazas comunes</li><li>Implementar controles de seguridad</li><li>Aplicar mejores prácticas</li></ul>'
              },
              { 
                titulo: 'Historia y contexto de la ciberseguridad', 
                descripcion: 'Evolución histórica de la seguridad informática',
                tipo: 'texto', 
                orden: 2,
                contenido: '<h4>Historia de la Ciberseguridad</h4><p>La ciberseguridad ha evolucionado significativamente desde los primeros días de la informática. Los primeros virus aparecieron en la década de 1970, y desde entonces, las amenazas han crecido en complejidad y sofisticación.</p><h5>Hitos importantes:</h5><ul><li><strong>1970s:</strong> Primeros virus informáticos (Creeper)</li><li><strong>1980s:</strong> Aparición de malware más sofisticado</li><li><strong>1990s:</strong> Internet masivo y nuevas amenazas</li><li><strong>2000s:</strong> Ataques coordinados y APTs</li><li><strong>2010s-presente:</strong> Ransomware, phishing avanzado, IoT</li></ul>'
              },
              { 
                titulo: 'Principios básicos de seguridad', 
                descripcion: 'Los principios fundamentales que rigen la seguridad',
                tipo: 'texto', 
                orden: 3,
                contenido: '<h4>Principios Básicos</h4><p>La seguridad informática se basa en varios principios fundamentales que deben ser aplicados de manera integral:</p><h5>1. Confidencialidad</h5><p>Garantizar que la información solo sea accesible para personas autorizadas.</p><h5>2. Integridad</h5><p>Asegurar que la información no sea modificada de manera no autorizada.</p><h5>3. Disponibilidad</h5><p>Garantizar que los sistemas y datos estén disponibles cuando se necesiten.</p><h5>4. Autenticación</h5><p>Verificar la identidad de usuarios y sistemas.</p><h5>5. Autorización</h5><p>Controlar el acceso a recursos según permisos establecidos.</p>'
              },
              { 
                titulo: 'Actores y amenazas en el ciberespacio', 
                descripcion: 'Quiénes son los atacantes y qué buscan',
                tipo: 'texto', 
                orden: 4,
                contenido: '<h4>Actores de Amenazas</h4><p>Existen diversos actores en el ciberespacio con diferentes motivaciones:</p><h5>Tipos de atacantes:</h5><ul><li><strong>Script Kiddies:</strong> Usuarios con conocimientos básicos que usan herramientas existentes</li><li><strong>Hackers:</strong> Personas con conocimientos técnicos avanzados</li><li><strong>Organizaciones criminales:</strong> Grupos organizados con fines económicos</li><li><strong>Nation-state actors:</strong> Actores patrocinados por gobiernos</li><li><strong>Insiders:</strong> Empleados o personas con acceso legítimo</li></ul><h5>Motivaciones comunes:</h5><ul><li>Ganancia económica (ransomware, robo de datos)</li><li>Espionaje industrial o gubernamental</li><li>Activismo (hacktivismo)</li><li>Sabotaje</li><li>Experimento o desafío personal</li></ul>'
              },
              { 
                titulo: 'Modelos de seguridad', 
                descripcion: 'Modelos y frameworks de seguridad',
                tipo: 'texto', 
                orden: 5,
                contenido: '<h4>Modelos de Seguridad</h4><p>Los modelos de seguridad proporcionan marcos conceptuales para implementar y gestionar la seguridad:</p><h5>1. Modelo de Defensa en Profundidad</h5><p>Implementar múltiples capas de seguridad para proteger los activos. Si una capa falla, otras continúan protegiendo.</p><h5>2. Modelo de Confianza Cero (Zero Trust)</h5><p>No confiar en nada por defecto, verificar todo. Asume que la red ya está comprometida.</p><h5>3. CIA Triad</h5><p>Confidencialidad, Integridad y Disponibilidad como los tres pilares fundamentales.</p><h5>4. Modelo de Seguridad por Capas</h5><p>Protección en múltiples niveles: física, de red, de aplicación, de datos, etc.</p>'
              }
            ]
          },
          {
            titulo: 'Arquitectura y modelos',
            descripcion: 'Estructura de sistemas seguros y modelos de confianza',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Capas de seguridad', tipo: 'texto', orden: 1, completado: true },
              { titulo: 'Modelos de confianza', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Arquitectura de sistemas seguros', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Amenazas y vectores',
            descripcion: 'Tipos de amenazas cibernéticas y cómo identificarlas',
            orden: 3,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Malware y tipos', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Ingeniería social', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Vulnerabilidades comunes', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Controles y mitigaciones',
            descripcion: 'Herramientas y técnicas para proteger sistemas',
            orden: 4,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Controles administrativos', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Controles técnicos', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Controles físicos', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Seguridad en redes',
            descripcion: 'Protección de infraestructura de red',
            orden: 5,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Fundamentos de redes', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Seguridad en protocolos', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Firewalls y segmentación', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Buenas prácticas y resumen',
            descripcion: 'Resumen del curso y mejores prácticas',
            orden: 6,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Checklist de seguridad', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Métricas y monitoreo', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Planes de respuesta a incidentes', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      },
      {
        titulo: 'Ethical Hacking',
        descripcion: 'Aprende las técnicas y herramientas utilizadas por hackers éticos para identificar y corregir vulnerabilidades en sistemas. Este curso te preparará para certificaciones como CEH.',
        imagen: 'Pictures/EthicalHacking.jpg',
        profesor: {
          nombre: 'René Guerrero',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Hacker ético certificado con más de 8 años de experiencia en penetration testing'
        },
        categoria: 'Ciberseguridad',
        nivel: 'Avanzado',
        idioma: 'Español',
        duracionTotal: 6,
        calificacion: 4.5,
        numValoraciones: 850,
        precio: 0,
        activo: true,
        estudiantesInscritos: 2100,
        secciones: [
          {
            titulo: 'Fundamentos de hacking ético',
            descripcion: 'Introducción al hacking ético y marco legal',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Introducción al hacking ético', tipo: 'texto', orden: 1, completado: true },
              { titulo: 'Marco legal y ético', tipo: 'texto', orden: 2, completado: true },
              { titulo: 'Metodologías de testing', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Recolección de información',
            descripcion: 'Técnicas de footprinting y reconnaissance',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Footprinting básico', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Google Hacking', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'WHOIS y DNS enumeration', tipo: 'texto', orden: 3, completado: false },
              { titulo: 'Social engineering', tipo: 'texto', orden: 4, completado: false }
            ]
          },
          {
            titulo: 'Escaneo y enumeración',
            descripcion: 'Identificación de sistemas y servicios',
            orden: 3,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Escaneo de puertos', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Escaneo de vulnerabilidades', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Enumeración de servicios', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      },
      {
        titulo: 'Pentesting',
        descripcion: 'Aprende a realizar pruebas de penetración profesionales para evaluar la seguridad de sistemas y aplicaciones. Incluye metodologías, herramientas y reportes.',
        imagen: 'Pictures/Pentesting.jpg',
        profesor: {
          nombre: 'René Guerrero',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Especialista en pruebas de penetración certificado OSCP'
        },
        categoria: 'Ciberseguridad',
        nivel: 'Avanzado',
        idioma: 'Español',
        duracionTotal: 5,
        calificacion: 4.0,
        numValoraciones: 450,
        precio: 0,
        activo: true,
        estudiantesInscritos: 1200,
        secciones: [
          {
            titulo: 'Introducción al pentesting',
            descripcion: 'Fundamentos de pruebas de penetración',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { titulo: '¿Qué es el pentesting?', tipo: 'texto', orden: 1, completado: true },
              { titulo: 'Tipos de pruebas', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Metodología PTES', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Laboratorio y herramientas',
            descripcion: 'Configuración de entorno de pruebas',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Kali Linux essentials', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Herramientas de escaneo', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Entornos virtuales', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      },
      {
        titulo: 'Python para Análisis de Datos',
        descripcion: 'Domina Python y las bibliotecas esenciales para análisis de datos: NumPy, Pandas, Matplotlib y más. Ideal para científicos de datos y analistas.',
        imagen: 'Pictures/python.png',
        profesor: {
          nombre: 'Jorge Nitales',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Data Scientist con experiencia en Python y análisis de datos. PhD en Ciencias de la Computación'
        },
        categoria: 'Programación',
        nivel: 'Intermedio',
        idioma: 'Español',
        duracionTotal: 8,
        calificacion: 4.7,
        numValoraciones: 2100,
        precio: 0,
        activo: true,
        estudiantesInscritos: 5800,
        secciones: [
          {
            titulo: 'Introducción a Python',
            descripcion: 'Fundamentos del lenguaje Python',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Instalación y configuración', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Sintaxis básica', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Estructuras de datos', tipo: 'texto', orden: 3, completado: false },
              { titulo: 'Funciones y módulos', tipo: 'texto', orden: 4, completado: false }
            ]
          },
          {
            titulo: 'NumPy y Pandas',
            descripcion: 'Bibliotecas fundamentales para datos',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Introducción a NumPy', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Arrays y operaciones', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'DataFrames con Pandas', tipo: 'texto', orden: 3, completado: false },
              { titulo: 'Manipulación de datos', tipo: 'texto', orden: 4, completado: false }
            ]
          },
          {
            titulo: 'Limpieza de datos',
            descripcion: 'Preparación de datos para análisis',
            orden: 3,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Identificación de datos faltantes', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Manejo de valores atípicos', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Normalización de datos', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      },
      {
        titulo: 'IA y Machine Learning',
        descripcion: 'Aprende los conceptos fundamentales de inteligencia artificial y machine learning con ejemplos prácticos. Desde regresión hasta redes neuronales.',
        imagen: 'Pictures/ai.png',
        profesor: {
          nombre: 'Rosamel Fierro',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Investigador en IA y ML con doctorado en Ciencias de la Computación. 15+ años de experiencia'
        },
        categoria: 'Inteligencia Artificial',
        nivel: 'Avanzado',
        idioma: 'Español',
        duracionTotal: 10,
        calificacion: 4.8,
        numValoraciones: 3200,
        precio: 0,
        activo: true,
        estudiantesInscritos: 8900,
        secciones: [
          {
            titulo: 'Introducción al ML',
            descripcion: 'Conceptos básicos de machine learning',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { titulo: '¿Qué es Machine Learning?', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Tipos de aprendizaje', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Aplicaciones prácticas', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Regresión',
            descripcion: 'Modelos predictivos de regresión',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Regresión lineal', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Regresión polinomial', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Métricas de evaluación', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Clasificación',
            descripcion: 'Algoritmos de clasificación',
            orden: 3,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Clasificación binaria', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Árboles de decisión', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Random Forest', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      },
      {
        titulo: 'Ciencia de Datos',
        descripcion: 'Comprende el proceso completo de ciencia de datos desde la recolección hasta la visualización de resultados. Incluye proyectos prácticos.',
        imagen: 'Pictures/data-science.jpg',
        profesor: {
          nombre: 'Soila Cerda',
          avatar: 'Pictures/profile-icon.png',
          descripcion: 'Data Scientist con experiencia en big data y visualización. Ex-Google, actualmente en Microsoft'
        },
        categoria: 'Ciencia de Datos',
        nivel: 'Intermedio',
        idioma: 'Español',
        duracionTotal: 12,
        calificacion: 4.6,
        numValoraciones: 1800,
        precio: 0,
        activo: true,
        estudiantesInscritos: 4200,
        secciones: [
          {
            titulo: 'Fundamentos de Ciencia de Datos',
            descripcion: 'Introducción al campo de la ciencia de datos',
            orden: 1,
            tieneExamen: true,
            lecciones: [
              { titulo: '¿Qué es la ciencia de datos?', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'El proceso de ciencia de datos', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Herramientas y tecnologías', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Estadística para datos',
            descripcion: 'Estadística aplicada a análisis de datos',
            orden: 2,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Estadística descriptiva', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Distribuciones', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Pruebas de hipótesis', tipo: 'texto', orden: 3, completado: false }
            ]
          },
          {
            titulo: 'Machine Learning',
            descripcion: 'Aplicación de ML en ciencia de datos',
            orden: 3,
            tieneExamen: true,
            lecciones: [
              { titulo: 'Modelos supervisados', tipo: 'texto', orden: 1, completado: false },
              { titulo: 'Modelos no supervisados', tipo: 'texto', orden: 2, completado: false },
              { titulo: 'Validación de modelos', tipo: 'texto', orden: 3, completado: false }
            ]
          }
        ]
      }
    ];

    // Función para agregar contenido lorem ipsum a lecciones
    const generarContenidoLeccion = (curso, seccion, leccion) => {
      const cursoTitulo = curso.titulo;
      const seccionTitulo = seccion.titulo;
      const leccionTitulo = leccion.titulo;
      const resumen = (leccion.descripcion || `Profundización en ${leccionTitulo.toLowerCase()} dentro de la sección ${seccionTitulo.toLowerCase()}`).replace(/\.$/, '');

      const accionVerbo = leccionTitulo.toLowerCase().startsWith('¿')
        ? `responder a la pregunta "${leccionTitulo}" con enfoque práctico`
        : `comprender y aplicar ${leccionTitulo.toLowerCase()}`;

      return `
        <h4>${leccionTitulo}</h4>
        <p>${resumen}. Esta sesión forma parte de la sección <strong>"${seccionTitulo}"</strong> del curso <strong>"${cursoTitulo}"</strong>, por lo que conecta directamente con los objetivos globales del programa.</p>
        <h5>Contexto profesional</h5>
        <p>Analizamos cómo ${leccionTitulo.toLowerCase()} impacta el trabajo diario en ${cursoTitulo.toLowerCase()}, utilizando ejemplos reales y métricas que permiten evaluar la efectividad de las decisiones técnicas.</p>
        <h5>En esta lección lograrás</h5>
        <ul>
          <li>${accionVerbo} en escenarios reales.</li>
          <li>Identificar riesgos y oportunidades relacionados con ${leccionTitulo.toLowerCase()}.</li>
          <li>Documentar hallazgos y traducirlos en acciones concretas para tu equipo.</li>
        </ul>
        <h5>Recomendaciones</h5>
        <p>Toma notas mientras avanzas y contrasta cada concepto con los casos de tu organización. Si la lección incluye recursos descargables o código fuente, practícalos al finalizar para consolidar el aprendizaje.</p>
      `;
    };

    const SAMPLE_VIDEOS = [
      'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
    ];

    const obtenerVideoDemostrativo = (indice) => SAMPLE_VIDEOS[indice % SAMPLE_VIDEOS.length];

    const agregarContenidoALecciones = (curso) => {
      const secciones = Array.isArray(curso.secciones) ? curso.secciones : [];

      secciones.forEach(seccion => {
        const lecciones = Array.isArray(seccion.lecciones) ? seccion.lecciones : [];

        lecciones.forEach(leccion => {
          if (!leccion.contenido || typeof leccion.contenido !== 'string' || leccion.contenido.trim().length === 0) {
            leccion.contenido = generarContenidoLeccion(curso, seccion, leccion);
          }

          if (!leccion.descripcion || leccion.descripcion.trim().length === 0) {
            leccion.descripcion = `Aplicación práctica de ${leccion.titulo.toLowerCase()} dentro de la sección ${seccion.titulo.toLowerCase()}.`;
          }
        });
      });
    };

    const asegurarVideosEnLecciones = (curso) => {
      let contador = 0;
      const secciones = Array.isArray(curso.secciones) ? curso.secciones : [];

      secciones.forEach(seccion => {
        const requiereVideoSeccion = seccion.requiereVideo !== false;
        const lecciones = Array.isArray(seccion.lecciones) ? seccion.lecciones : [];
        lecciones.forEach(leccion => {
          if (!leccion) return;

          leccion.tipo = 'video';
          if (!leccion.urlVideo || typeof leccion.urlVideo !== 'string' || leccion.urlVideo.trim().length === 0) {
            leccion.urlVideo = obtenerVideoDemostrativo(contador++);
          }
          if (leccion.requiereVideo === undefined) {
            leccion.requiereVideo = requiereVideoSeccion;
          }
        });
      });
    };

    const asignarRequiereVideoASecciones = (curso) => {
      const secciones = Array.isArray(curso.secciones) ? curso.secciones : [];
      secciones.forEach((seccion) => {
        if (seccion.requiereVideo === undefined) {
          seccion.requiereVideo = Math.random() < 0.8;
        }
      });
    };

    const DISTRACTORES_GENERICOS = [
      'Contenido administrativo sin relación técnica',
      'Conceptos de otra carrera',
      'Material introductorio externo al curso',
      'Procedimientos operativos generales',
      'Requisitos administrativos del campus',
      'Recursos externos no incluidos en la malla',
      'Actividades extraprogramáticas',
      'Temas de evaluación institucional'
    ];

    const obtenerDistractoresGenericos = (count, offset = 0) => {
      const resultado = [];
      let cursor = offset;
      while (resultado.length < count) {
        const base = DISTRACTORES_GENERICOS[cursor % DISTRACTORES_GENERICOS.length];
        const variante = cursor >= DISTRACTORES_GENERICOS.length ? ` (variante ${cursor - DISTRACTORES_GENERICOS.length + 1})` : '';
        const texto = `${base}${variante}`;
        if (!resultado.includes(texto)) {
          resultado.push(texto);
        }
        cursor++;
      }
      return resultado;
    };

    const crearPreguntaSeleccionMultiple = (enunciado, respuestaCorrecta, distractores, orden, puntos = 2) => {
      const distractoresNormalizados = Array.from(new Set(
        (distractores || [])
          .map(opcion => opcion && opcion.toString().trim())
          .filter(opcion => opcion && opcion !== respuestaCorrecta)
      ));

      while (distractoresNormalizados.length < 3) {
        const faltantes = obtenerDistractoresGenericos(1, orden + distractoresNormalizados.length);
        faltantes.forEach(texto => {
          if (distractoresNormalizados.length < 3 && !distractoresNormalizados.includes(texto) && texto !== respuestaCorrecta) {
            distractoresNormalizados.push(texto);
          }
        });
      }

      return {
        pregunta: enunciado,
        tipo: 'opcion_multiple',
        puntos,
        orden,
        opciones: [
          { texto: respuestaCorrecta, esCorrecta: true },
          ...distractoresNormalizados.slice(0, 3).map(texto => ({ texto, esCorrecta: false }))
        ]
      };
    };

    const generarPreguntasSeccion = (curso, seccion, indiceSeccion) => {
      const offset = indiceSeccion * 5;
      const lecciones = seccion.lecciones || [];
      const leccionDestacada = lecciones[0]?.titulo || seccion.titulo;
      const segundaLeccion = lecciones[1]?.titulo || `${seccion.titulo} aplicada`;

      return [
        crearPreguntaSeleccionMultiple(
          `¿Cuál es el objetivo principal de la sección "${seccion.titulo}"?`,
          `Comprender y aplicar conceptos de ${seccion.titulo.toLowerCase()}.`,
          obtenerDistractoresGenericos(3, offset),
          1,
          2
        ),
        crearPreguntaSeleccionMultiple(
          `¿Qué recurso destaca en la sección "${seccion.titulo}"?`,
          `La lección "${leccionDestacada}" como base de estudio.`,
          [
            `Material administrativo sin vínculo con ${seccion.titulo.toLowerCase()}.`,
            `Un repaso general de otra asignatura.`,
            `Documentación ajena al curso "${curso.titulo}".`
          ],
          2,
          2
        ),
        crearPreguntaSeleccionMultiple(
          `Para reforzar la sección "${seccion.titulo}", ¿qué acción es recomendable?`,
          `Practicar los contenidos trabajados en "${segundaLeccion}".`,
          obtenerDistractoresGenericos(3, offset + 2),
          3,
          2
        )
      ];
    };

    const generarPreguntasFinal = (curso) => {
      const temas = [];
      (curso.secciones || []).forEach(seccion => {
        (seccion.lecciones || []).forEach(leccion => {
          temas.push({
            seccionTitulo: seccion.titulo,
            leccionTitulo: leccion.titulo
          });
        });
      });

      if (temas.length === 0) {
        temas.push({
          seccionTitulo: curso.titulo,
          leccionTitulo: `Fundamentos de ${curso.titulo}`
        });
      }

      const titulosDisponibles = Array.from(new Set(temas.map(t => t.leccionTitulo).filter(Boolean)));

      const obtenerDistractoresDeTemas = (respuesta, indice) => {
        const candidatos = titulosDisponibles.filter(titulo => titulo && titulo !== respuesta);
        const resultado = [];
        let cursor = indice;

        while (resultado.length < 3 && candidatos.length > 0) {
          const candidato = candidatos[cursor % candidatos.length];
          if (candidato && !resultado.includes(candidato)) {
            resultado.push(candidato);
          }
          cursor++;
          if (cursor > indice + candidatos.length * 2) {
            break;
          }
        }

        if (resultado.length < 3) {
          resultado.push(...obtenerDistractoresGenericos(3 - resultado.length, indice));
        }

        return resultado;
      };

      const preguntas = [];
      for (let i = 0; i < 15; i++) {
        const tema = temas[i % temas.length];
        const respuesta = tema.leccionTitulo || `Fundamentos de ${tema.seccionTitulo}`;
        const enunciado = `En el curso "${curso.titulo}", ¿qué tema corresponde a la sección "${tema.seccionTitulo}"?`;
        const distractores = obtenerDistractoresDeTemas(respuesta, i);

        preguntas.push(crearPreguntaSeleccionMultiple(enunciado, respuesta, distractores, i + 1, 2));
      }

      return preguntas;
    };

    // Insertar cursos
    console.log('📚 Insertando cursos...\n');
    for (const cursoData of cursosIniciales) {
      // Agregar contenido a todas las lecciones
      agregarContenidoALecciones(cursoData);
      asegurarVideosEnLecciones(cursoData);
      asignarRequiereVideoASecciones(cursoData);
      
      const curso = await Curso.create(cursoData);
      console.log(`✅ Curso creado: ${curso.titulo}`);
      console.log(`   - Secciones: ${curso.secciones.length}`);
      const totalLecciones = curso.secciones.reduce((acc, sec) => acc + sec.lecciones.length, 0);
      console.log(`   - Lecciones: ${totalLecciones}\n`);
    }

    const totalCursos = await Curso.countDocuments();
    console.log(`\n✅ Cursos creados: ${totalCursos}\n`);

    // Crear exámenes para las secciones
    console.log('📝 Configurando exámenes embebidos...\n');
    const cursosCreados = await Curso.find();
    let totalExamenes = 0;

    for (const curso of cursosCreados) {
      const secciones = curso.secciones || [];
      const examenes = [];

      for (let indiceSeccion = 0; indiceSeccion < secciones.length; indiceSeccion++) {
        const seccion = secciones[indiceSeccion];
        if (seccion.tieneExamen) {
          examenes.push({
            seccion: seccion._id,
            titulo: `Examen: ${seccion.titulo}`,
            descripcion: `Examen de la sección "${seccion.titulo}" del curso "${curso.titulo}"`,
            tipo: 'seccion',
            tiempoLimite: 30,
            intentosPermitidos: 2,
            porcentajeAprobacion: 70,
            preguntas: generarPreguntasSeccion(curso, seccion, indiceSeccion),
            activo: true
          });
          totalExamenes++;
          console.log(`✅ Examen configurado: ${seccion.titulo} (${curso.titulo})`);
        }
      }

      if (secciones.length > 0) {
        examenes.push({
          seccion: null,
          titulo: `Examen Final: ${curso.titulo}`,
          descripcion: `Examen final del curso "${curso.titulo}"`,
          tipo: 'final',
          tiempoLimite: 60,
          intentosPermitidos: 2,
          porcentajeAprobacion: 75,
          preguntas: generarPreguntasFinal(curso),
          activo: true
        });
        totalExamenes++;
        console.log(`✅ Examen final configurado: ${curso.titulo}`);
      }

      curso.examenes = examenes;
      await curso.save();
    }

    console.log(`\n✅ Total de exámenes configurados: ${totalExamenes}\n`);

    // Crear usuarios de prueba
    console.log('👥 Creando usuarios de prueba...\n');
    
    const usuariosPrueba = [
      {
        email: 'estudiante@inacap.cl',
        password: '123456',
        nombre: 'Juan',
        apellido: 'Pérez',
        rol: 'estudiante'
      },
      {
        email: 'profesor@inacap.cl',
        password: '123456',
        nombre: 'María',
        apellido: 'González',
        rol: 'profesor'
      },
      {
        email: 'admin@inacap.cl',
        password: '123456',
        nombre: 'Admin',
        apellido: 'Sistema',
        rol: 'admin_dae'
      }
    ];

    const usuariosCreados = [];
    for (const usuarioData of usuariosPrueba) {
      const usuarioExistente = await Usuario.findOne({ email: usuarioData.email });
      if (!usuarioExistente) {
        const usuario = new Usuario(usuarioData);
        await usuario.save();
        usuariosCreados.push(usuario);
        console.log(`✅ Usuario creado: ${usuario.email} (${usuario.rol})`);
      } else {
        usuariosCreados.push(usuarioExistente);
        console.log(`⏭️  Usuario ya existe: ${usuarioData.email}`);
      }
    }

    // Inscribir estudiante a algunos cursos
    const estudiante = usuariosCreados.find(u => u.rol === 'estudiante');
    if (estudiante) {
      console.log('\n📚 Inscribiendo estudiante a cursos...\n');
      const cursosParaInscribir = await Curso.find().limit(3);
      
      for (const curso of cursosParaInscribir) {
        const inscripcionExistente = await Inscripcion.findOne({
          usuario: estudiante._id,
          curso: curso._id
        });

        if (!inscripcionExistente) {
          const inscripcion = new Inscripcion({
            usuario: estudiante._id,
            curso: curso._id,
            estado: 'activo'
          });

          // Recargar el curso para obtener los _ids reales de las lecciones
          const cursoCompleto = await Curso.findById(curso._id);
          
          // Inicializar progreso de lecciones
          if (cursoCompleto && cursoCompleto.secciones) {
            cursoCompleto.secciones.forEach(seccion => {
              if (seccion.lecciones && seccion.lecciones.length > 0) {
                seccion.lecciones.forEach(leccion => {
                  if (leccion._id) {
                    inscripcion.progresoLecciones.push({
                      leccionId: leccion._id,
                      completado: false,
                      progreso: 0
                    });
                  }
                });
              }
            });
          }

          // Marcar algunas lecciones como completadas para mostrar progreso
          if (inscripcion.progresoLecciones.length > 0) {
            const leccionesACompletar = Math.floor(inscripcion.progresoLecciones.length * 0.3);
            for (let i = 0; i < leccionesACompletar; i++) {
              if (inscripcion.progresoLecciones[i]) {
                inscripcion.progresoLecciones[i].completado = true;
                inscripcion.progresoLecciones[i].progreso = 100;
                inscripcion.progresoLecciones[i].fechaCompletado = new Date();
              }
            }
          }

          inscripcion.calcularProgreso();
          await inscripcion.save();

          const usuarioSeed = await Usuario.findById(estudiante._id);
          if (usuarioSeed) {
            if (!usuarioSeed.cursosInscritos.some(c => c.toString() === curso._id.toString())) {
              usuarioSeed.cursosInscritos.push(curso._id);
            }

            const progresoExistente = usuarioSeed.progresoCursos.find(p => p.curso && p.curso.toString() === curso._id.toString());
            if (progresoExistente) {
              progresoExistente.progreso = inscripcion.progresoGeneral;
              progresoExistente.actualizadoEn = new Date();
            } else {
              usuarioSeed.progresoCursos.push({
                curso: curso._id,
                progreso: inscripcion.progresoGeneral,
                actualizadoEn: new Date()
              });
            }

            await usuarioSeed.save();
          }

          await Curso.findByIdAndUpdate(
            curso._id,
            { $inc: { estudiantesInscritos: 1 } }
          );
          console.log(`✅ Inscrito a: ${curso.titulo} (${inscripcion.progresoGeneral}% completo)`);
        }
      }
    }

    // Crear algunas notificaciones de ejemplo
    if (estudiante) {
      console.log('\n🔔 Creando notificaciones de ejemplo...\n');
      const notificacionesEjemplo = [
        {
          usuario: estudiante._id,
          titulo: 'Bienvenido a la plataforma',
          mensaje: 'Te damos la bienvenida a la plataforma de cursos INACAP',
          tipo: 'sistema'
        },
        {
          usuario: estudiante._id,
          titulo: 'Nueva tarea disponible',
          mensaje: 'Se ha agregado una nueva tarea en el curso de Ciberseguridad',
          tipo: 'tarea',
          link: '/curso.html'
        }
      ];

      for (const notifData of notificacionesEjemplo) {
        const notifExistente = await Notificacion.findOne({
          usuario: notifData.usuario,
          titulo: notifData.titulo
        });

        if (!notifExistente) {
          const notificacion = await Notificacion.create(notifData);
          await Usuario.findByIdAndUpdate(
            notifData.usuario,
            {
              $push: {
                notificacionesNoLeidas: {
                  notificacion: notificacion._id,
                  titulo: notificacion.titulo,
                  mensaje: notificacion.mensaje,
                  tipo: notificacion.tipo,
                  link: notificacion.link,
                  fecha: notificacion.fechaCreacion
                }
              }
            }
          );
          console.log(`✅ Notificación creada: ${notifData.titulo}`);
        }
      }
    }

    console.log(`\n🎉 Base de datos poblada exitosamente!`);
    console.log(`📊 Total de cursos: ${totalCursos}`);
    console.log(`👥 Total de usuarios: ${usuariosCreados.length}`);
    console.log('\n📝 Usuarios de prueba:');
    usuariosPrueba.forEach(u => {
      console.log(`   Email: ${u.email} | Contraseña: ${u.password} | Rol: ${u.rol}`);
    });
    console.log('\n✅ Listo para usar la aplicación\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
    process.exit(1);
  }
}

seedDatabase();
