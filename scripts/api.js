// scripts/api.js
// Cliente API para comunicación con el backend

// Variable global compartida para la URL base de la API
if (typeof window.API_BASE_URL === 'undefined') {
  window.API_BASE_URL = 'http://localhost:3000/api';
}
// Usar directamente window.API_BASE_URL o crear alias local sin const
var API_BASE_URL = window.API_BASE_URL;

// Función auxiliar para hacer peticiones HTTP
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en la petición');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en API:', error);
    throw error;
  }
}

// API de Cursos
const cursosAPI = {
  // Obtener todos los cursos
  async getAll(opciones = {}) {
    try {
      const query = opciones.includeTodos ? '?todos=1' : '';
      const response = await fetch(`${API_BASE_URL}/cursos${query}`, {
        credentials: 'include'
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error al obtener cursos:', error);
      return [];
    }
  },

  // Obtener un curso por ID
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/cursos/${id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error al obtener curso:', error);
      return null;
    }
  },

  // Crear un nuevo curso
  async create(cursoData, imagenFile = null) {
    const formData = new FormData();
    
    // Agregar datos del curso
    if (cursoData.secciones && typeof cursoData.secciones === 'object') {
      cursoData.secciones = JSON.stringify(cursoData.secciones);
    }
    
    Object.keys(cursoData).forEach(key => {
      if (cursoData[key] !== null && cursoData[key] !== undefined) {
        formData.append(key, cursoData[key]);
      }
    });

    // Agregar imagen si existe
    if (imagenFile) {
      formData.append('imagen', imagenFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cursos`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el curso');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al crear curso:', error);
      throw error;
    }
  },

  // Actualizar un curso
  async update(id, cursoData, imagenFile = null) {
    const formData = new FormData();
    
    if (cursoData.secciones && typeof cursoData.secciones === 'object') {
      cursoData.secciones = JSON.stringify(cursoData.secciones);
    }
    
    Object.keys(cursoData).forEach(key => {
      if (cursoData[key] !== null && cursoData[key] !== undefined) {
        formData.append(key, cursoData[key]);
      }
    });

    if (imagenFile) {
      formData.append('imagen', imagenFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cursos/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar el curso');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al actualizar curso:', error);
      throw error;
    }
  },

  // Eliminar un curso
  async delete(id) {
    return await apiRequest(`/cursos/${id}`, { method: 'DELETE' });
  },

  // Agregar sección a un curso
  async addSeccion(cursoId, seccionData) {
    return await apiRequest(`/cursos/${cursoId}/secciones`, {
      method: 'POST',
      body: JSON.stringify(seccionData),
    });
  },

  // Actualizar sección
  async updateSeccion(cursoId, seccionId, seccionData) {
    return await apiRequest(`/cursos/${cursoId}/secciones/${seccionId}`, {
      method: 'PUT',
      body: JSON.stringify(seccionData),
    });
  },

  // Eliminar sección
  async deleteSeccion(cursoId, seccionId) {
    return await apiRequest(`/cursos/${cursoId}/secciones/${seccionId}`, {
      method: 'DELETE',
    });
  },

  // Agregar lección a una sección
  async addLeccion(cursoId, seccionId, leccionData, videoFile = null, audioFile = null, materialFile = null) {
    const formData = new FormData();
    
    Object.keys(leccionData).forEach(key => {
      if (leccionData[key] !== null && leccionData[key] !== undefined) {
        formData.append(key, leccionData[key]);
      }
    });

    if (videoFile) {
      formData.append('video', videoFile);
    }

    if (audioFile) {
      formData.append('audio', audioFile);
    }

    if (materialFile) {
      formData.append('material', materialFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cursos/${cursoId}/secciones/${seccionId}/lecciones`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al agregar la lección');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al agregar lección:', error);
      throw error;
    }
  },

  // Actualizar lección
  async updateLeccion(cursoId, seccionId, leccionId, leccionData, videoFile = null, audioFile = null, materialFile = null) {
    const formData = new FormData();
    
    Object.keys(leccionData).forEach(key => {
      if (leccionData[key] !== null && leccionData[key] !== undefined) {
        formData.append(key, leccionData[key]);
      }
    });

    if (videoFile) {
      formData.append('video', videoFile);
    }

    if (audioFile) {
      formData.append('audio', audioFile);
    }

    if (materialFile) {
      formData.append('material', materialFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cursos/${cursoId}/secciones/${seccionId}/lecciones/${leccionId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar la lección');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al actualizar lección:', error);
      throw error;
    }
  },

  // Eliminar lección
  async deleteLeccion(cursoId, seccionId, leccionId) {
    return await apiRequest(`/cursos/${cursoId}/secciones/${seccionId}/lecciones/${leccionId}`, {
      method: 'DELETE',
    });
  },

  // Gestionar exámenes
  async addExam(cursoId, examenData) {
    return await apiRequest(`/cursos/${cursoId}/examenes`, {
      method: 'POST',
      body: JSON.stringify(examenData),
    });
  },

  async updateExam(cursoId, examenId, examenData) {
    return await apiRequest(`/cursos/${cursoId}/examenes/${examenId}`, {
      method: 'PUT',
      body: JSON.stringify(examenData),
    });
  },

  async deleteExam(cursoId, examenId) {
    return await apiRequest(`/cursos/${cursoId}/examenes/${examenId}`, {
      method: 'DELETE',
    });
  },
};

// Exportar para uso global
window.cursosAPI = cursosAPI;

// API de Usuarios (Administración DAE)
const usuariosAPI = {
  async getAll() {
    const data = await apiRequest('/usuarios');
    return data.usuarios || [];
  },

  async create(usuarioData) {
    const data = await apiRequest('/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuarioData),
    });
    return data.usuario;
  },

  async update(id, usuarioData) {
    const data = await apiRequest(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(usuarioData),
    });
    return data.usuario;
  },

  async deactivate(id) {
    const data = await apiRequest(`/usuarios/${id}`, {
      method: 'DELETE',
    });
    return data.usuario;
  }
};

window.usuariosAPI = usuariosAPI;

