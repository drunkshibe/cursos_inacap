// scripts/admin-cursos.js
// Scripts para administración de cursos (crear, editar, eliminar)

// Función para crear un nuevo curso
async function crearCurso(formData) {
  try {
    const cursoData = {
      titulo: formData.get('titulo'),
      descripcion: formData.get('descripcion'),
      categoria: formData.get('categoria') || 'General',
      nivel: formData.get('nivel') || 'Intermedio',
      idioma: formData.get('idioma') || 'Español',
      duracionTotal: parseFloat(formData.get('duracionTotal')) || 0,
      precio: parseFloat(formData.get('precio')) || 0,
      'profesor.nombre': formData.get('profesorNombre'),
      'profesor.descripcion': formData.get('profesorDescripcion'),
      activo: true
    };

    const imagenFile = formData.get('imagen');
    const curso = await window.cursosAPI.create(cursoData, imagenFile);
    
    alert('Curso creado exitosamente');
    return curso;
  } catch (error) {
    console.error('Error al crear curso:', error);
    alert('Error al crear el curso: ' + error.message);
    throw error;
  }
}

// Función para actualizar un curso
async function actualizarCurso(cursoId, formData) {
  try {
    const cursoData = {
      titulo: formData.get('titulo'),
      descripcion: formData.get('descripcion'),
      categoria: formData.get('categoria'),
      nivel: formData.get('nivel'),
      idioma: formData.get('idioma'),
      duracionTotal: parseFloat(formData.get('duracionTotal')) || 0,
      precio: parseFloat(formData.get('precio')) || 0,
      'profesor.nombre': formData.get('profesorNombre'),
      'profesor.descripcion': formData.get('profesorDescripcion')
    };

    const imagenFile = formData.get('imagen');
    const curso = await window.cursosAPI.update(cursoId, cursoData, imagenFile);
    
    alert('Curso actualizado exitosamente');
    return curso;
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    alert('Error al actualizar el curso: ' + error.message);
    throw error;
  }
}

// Función para eliminar un curso
async function eliminarCurso(cursoId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este curso?')) {
    return;
  }

  try {
    await window.cursosAPI.delete(cursoId);
    alert('Curso eliminado exitosamente');
    return true;
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    alert('Error al eliminar el curso: ' + error.message);
    throw error;
  }
}

// Función para agregar una sección a un curso
async function agregarSeccion(cursoId, seccionData) {
  try {
    const curso = await window.cursosAPI.addSeccion(cursoId, seccionData);
    return curso;
  } catch (error) {
    console.error('Error al agregar sección:', error);
    throw error;
  }
}

// Función para agregar una lección a una sección
async function agregarLeccion(cursoId, seccionId, leccionData, videoFile, audioFile, materialFile) {
  try {
    const curso = await window.cursosAPI.addLeccion(cursoId, seccionId, leccionData, videoFile, audioFile, materialFile);
    return curso;
  } catch (error) {
    console.error('Error al agregar lección:', error);
    throw error;
  }
}

// Exportar funciones globales
window.crearCurso = crearCurso;
window.actualizarCurso = actualizarCurso;
window.eliminarCurso = eliminarCurso;
window.agregarSeccion = agregarSeccion;
window.agregarLeccion = agregarLeccion;

