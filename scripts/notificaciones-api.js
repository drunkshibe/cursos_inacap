// scripts/notificaciones-api.js
// API para notificaciones desde base de datos

// Variable global compartida para la URL base de la API
if (typeof window.API_BASE_URL === 'undefined') {
  window.API_BASE_URL = 'http://localhost:3000/api';
}
// Usar directamente window.API_BASE_URL o crear alias local sin const
var API_BASE_URL = window.API_BASE_URL;

function obtenerBadgeNotificaciones() {
  return document.getElementById("notif-count");
}

function obtenerContadorActual() {
  const badge = obtenerBadgeNotificaciones();
  if (!badge) return 0;
  const valor = parseInt((badge.textContent || '').trim(), 10);
  return Number.isNaN(valor) ? 0 : valor;
}

function actualizarBadgeNotificaciones(total) {
  const badge = obtenerBadgeNotificaciones();
  if (!badge) return;

  if (typeof total !== 'number' || Number.isNaN(total)) {
    total = obtenerContadorActual();
  }

  if (total <= 0) {
    badge.textContent = '';
    badge.classList.add('d-none');
  } else {
    badge.textContent = String(total);
    badge.classList.remove('d-none');
  }
}

// Obtener notificaciones
async function obtenerNotificaciones(leidas = null) {
  try {
    let url = `${API_BASE_URL}/notificaciones`;
    if (leidas !== null) {
      url += `?leidas=${leidas}`;
    }

    const response = await fetch(url, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return {
        notificaciones: data.notificaciones || [],
        noLeidas: data.noLeidas || 0,
        pendientes: data.pendientes || []
      };
    }
    return { notificaciones: [], noLeidas: 0, pendientes: [] };
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return { notificaciones: [], noLeidas: 0, pendientes: [] };
  }
}

// Marcar como leída
async function marcarComoLeida(notificacionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionId}/leer`, {
      method: 'PUT',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo marcar la notificación como leída');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al marcar como leída:', error);
    return { success: false, error: error.message };
  }
}

// Marcar todas como leídas
async function marcarTodasComoLeidas() {
  try {
    const response = await fetch(`${API_BASE_URL}/notificaciones/leer-todas`, {
      method: 'PUT',
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    return false;
  }
}

// Eliminar notificación
async function eliminarNotificacion(notificacionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return false;
  }
}

// Cargar y mostrar notificaciones
async function cargarNotificaciones() {
  const data = await obtenerNotificaciones();
  const list = document.getElementById("notif-list");
  const countEl = document.getElementById("notif-count");
  
  if (!list || !countEl) return;

  list.innerHTML = "";

  const pendientes = Array.isArray(data.pendientes) ? data.pendientes : [];
  const origen = pendientes.map((n) => ({
    ...n,
    _id: n.notificacion || n._id,
    fechaCreacion: n.fecha || n.fechaCreacion,
    leida: false
  }));

  if (!origen || origen.length === 0) {
    list.innerHTML = '<li class="px-3 py-3 text-center text-secondary small">No hay notificaciones pendientes</li>';
    countEl.classList.add("d-none");
    return;
  }

  origen.forEach((n) => {
    const li = document.createElement("li");
    li.className = `notification-item px-3 py-2 border-bottom small ${n.leida ? '' : 'fw-bold'}`;
    const id = n.notificacion || n._id;
    const fecha = new Date(n.fecha || n.fechaCreacion || Date.now()).toLocaleString('es-ES');
    const titulo = n.titulo || n.asunto || 'Notificación';
    const mensaje = n.mensaje || n.descripcion || '';
    li.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-3">
      <div>
          <b>${titulo}</b><br>
          <span class="text-muted">${mensaje}</span><br>
        <small class="text-muted">${fecha}</small>
        </div>
        <button type="button" class="btn btn-sm btn-link text-decoration-none p-0" data-action="marcar" data-id="${id}">
          Marcar como vista
        </button>
      </div>
    `;
    
    if (n.link) {
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        window.location.href = n.link;
        marcarComoLeida(id);
      });
    }

    const boton = li.querySelector('[data-action="marcar"]');
    if (boton) {
      boton.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (boton.disabled) return;
        boton.disabled = true;

        const resultado = await marcarComoLeida(id);

        if (resultado?.success) {
          li.remove();

          const restantes = typeof resultado.pendientesRestantes === 'number'
            ? resultado.pendientesRestantes
            : Math.max(0, obtenerContadorActual() - 1);

          if (!list.querySelector('.notification-item')) {
            list.innerHTML = '<li class="px-3 py-3 text-center text-secondary small">No hay notificaciones pendientes</li>';
          }

          actualizarBadgeNotificaciones(restantes);
        } else {
          boton.disabled = false;
          const mensaje = resultado?.error || 'No se pudo marcar la notificación como leída.';
          console.warn(mensaje);
          toast?.warning?.(mensaje) ?? alert(mensaje);
        }
      });
    }
    
    list.appendChild(li);
  });

  const totalPendientes = pendientes.length > 0 ? pendientes.length : (data.noLeidas || 0);
  actualizarBadgeNotificaciones(totalPendientes);
}

// Marcar todas como leídas (botón)
window.marcarTodasNotificacionesLeidas = async function() {
  await marcarTodasComoLeidas();
  await cargarNotificaciones();
};

// Exportar funciones
window.notificacionesAPI = {
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  cargarNotificaciones
};

// Cargar notificaciones al iniciar
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar si el usuario está autenticado
  if (window.auth && await window.auth.init()) {
    await cargarNotificaciones();
    // Recargar notificaciones cada 30 segundos
    setInterval(cargarNotificaciones, 30000);
  }
});

