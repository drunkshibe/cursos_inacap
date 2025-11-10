// scripts/auth.js
// Manejo de autenticación

// Variable global compartida para la URL base de la API
if (typeof window.API_BASE_URL === 'undefined') {
  window.API_BASE_URL = 'http://localhost:3000/api';
}
// Usar directamente window.API_BASE_URL o crear alias local sin const
var API_BASE_URL = window.API_BASE_URL;

// Estado del usuario
let usuarioActual = null;

// Inicializar autenticación
async function initAuth() {
  try {
    const url = `${API_BASE_URL}/auth/me`;
    console.log('🔍 Intentando verificar autenticación en:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('🔍 Auth check response status:', response.status);
    console.log('🔍 Auth check response URL:', response.url);
    
    if (response.status === 404) {
      console.error('❌ 404 - La ruta de la API no existe. Verifica que el servidor esté corriendo y las rutas estén configuradas.');
      usuarioActual = null;
      return false;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('🔍 Auth check data:', data);
      if (data.usuario) {
        usuarioActual = data.usuario;
        actualizarUIUsuario();
        console.log('✅ Usuario autenticado:', usuarioActual.email);
        return true;
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ No autenticado:', response.status, errorData);
    }
    usuarioActual = null;
    return false;
  } catch (error) {
    console.error('❌ Error al verificar autenticación:', error);
    console.error('   URL intentada:', `${API_BASE_URL}/auth/me`);
    console.error('   Asegúrate de que el servidor esté corriendo en http://localhost:3000');
    usuarioActual = null;
    return false;
  }
}

// Iniciar sesión
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    // Verificar que las cookies se recibieron
    console.log('Login response:', response.status, data);
    console.log('Response headers:', response.headers);

    if (response.ok && data.success) {
      usuarioActual = data.usuario;
      actualizarUIUsuario();
      
      // Verificar inmediatamente que la sesión se estableció
      const verificarSesion = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (verificarSesion.ok) {
        const sesionData = await verificarSesion.json();
        console.log('Sesión verificada después de login:', sesionData);
      } else {
        console.error('⚠️ No se pudo verificar la sesión después del login');
      }
      
      return { success: true, usuario: data.usuario };
    } else {
      return { success: false, error: data.error || 'Error al iniciar sesión' };
    }
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// Registrar nuevo usuario
async function register(email, password, nombre, apellido) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, nombre, apellido })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      usuarioActual = data.usuario;
      actualizarUIUsuario();
      return { success: true, usuario: data.usuario };
    } else {
      return { success: false, error: data.error || 'Error al registrar usuario' };
    }
  } catch (error) {
    console.error('Error en registro:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// Cerrar sesión
async function logout() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    usuarioActual = null;
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    window.location.href = 'login.html';
  }
}

// Actualizar UI con información del usuario
function actualizarUIUsuario() {
  if (!usuarioActual) {
    // Si no hay usuario, limpiar UI
    const nombreUsuario = document.getElementById('nombre-usuario');
    if (nombreUsuario) {
      nombreUsuario.textContent = '';
    }
    const fotoPerfil = document.getElementById('foto-perfil');
    if (fotoPerfil) {
      fotoPerfil.src = 'Pictures/profile.png';
    }

    const adminMenu = document.getElementById('admin-dae-menu');
    if (adminMenu) {
      adminMenu.classList.add('d-none');
    }
    return;
  }

  // Actualizar nombre en sidebar si existe
  const nombreUsuario = document.getElementById('nombre-usuario');
  if (nombreUsuario) {
    nombreUsuario.textContent = usuarioActual.nombreCompleto || usuarioActual.nombre || '';
  }

  // Actualizar foto de perfil si existe
  const fotoPerfil = document.getElementById('foto-perfil');
  if (fotoPerfil) {
    fotoPerfil.src = usuarioActual.fotoPerfil || 'Pictures/profile.png';
  }

  const adminMenu = document.getElementById('admin-dae-menu');
  if (adminMenu) {
    if (usuarioActual.rol === 'admin_dae') {
      adminMenu.classList.remove('d-none');
    } else {
      adminMenu.classList.add('d-none');
    }
  }
}

// Verificar si el usuario está autenticado
function estaAutenticado() {
  return usuarioActual !== null;
}

// Obtener usuario actual
function obtenerUsuario() {
  return usuarioActual;
}

// Exportar funciones
window.auth = {
  init: initAuth,
  login,
  register,
  logout,
  estaAutenticado,
  obtenerUsuario,
  actualizarUI: actualizarUIUsuario
};

// Inicializar al cargar (solo en páginas que no sean login)
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('login.html')) {
    initAuth();
  }
});

