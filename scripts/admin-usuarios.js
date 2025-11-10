// scripts/admin-usuarios.js
(() => {
  const state = {
    usuarios: [],
    usuarioSesion: null
  };

  let alertaGlobal;
  let formUsuario;
  let tablaUsuarios;
  let contadorUsuarios;
  let btnRecargar;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheDom();
    if (!formUsuario || !tablaUsuarios) return;

    try {
      if (window.auth) {
        await window.auth.init();
        state.usuarioSesion = window.auth.obtenerUsuario();
      }

      if (!state.usuarioSesion || state.usuarioSesion.rol !== 'admin_dae') {
        mostrarAccesoRestringido();
        return;
      }
    } catch (error) {
      console.error('Error validando autenticación:', error);
      mostrarError('No fue posible validar tu sesión. Intenta nuevamente.');
      return;
    }

    enlazarEventos();
    await cargarUsuarios();
  }

  function cacheDom() {
    alertaGlobal = document.getElementById('admin-usuarios-alert');
    formUsuario = document.getElementById('form-usuario');
    tablaUsuarios = document.getElementById('tabla-usuarios-body');
    contadorUsuarios = document.getElementById('contador-usuarios');
    btnRecargar = document.getElementById('btn-recargar-usuarios');
  }

  function enlazarEventos() {
    formUsuario.addEventListener('submit', manejarRegistroUsuario);
    if (btnRecargar) {
      btnRecargar.addEventListener('click', cargarUsuarios);
    }
  }

  function mostrarAccesoRestringido() {
    if (!alertaGlobal) return;
    alertaGlobal.className = 'alert alert-warning';
    alertaGlobal.textContent = 'Solo el Administrador DAE puede acceder a esta sección.';
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = `
        <div class="container py-5">
          <div class="bg-white p-5 rounded shadow-sm text-center">
            <h2 class="h5 fw-semibold mb-3">Acceso restringido</h2>
            <p class="text-secondary mb-4">
              La administración de usuarios está disponible exclusivamente para el Administrador DAE.
            </p>
            <a href="index.html" class="btn btn-primary btn-sm">Volver al inicio</a>
          </div>
        </div>
      `;
    }
  }

  async function cargarUsuarios() {
    try {
      mostrarCargaTabla();
      const usuarios = await window.usuariosAPI.getAll();
      state.usuarios = Array.isArray(usuarios) ? usuarios : [];
      renderizarUsuarios();
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      mostrarError('No se pudieron cargar los usuarios. Intenta nuevamente.');
      tablaUsuarios.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger py-4">Error al cargar usuarios.</td>
        </tr>
      `;
    }
  }

  function mostrarCargaTabla() {
    tablaUsuarios.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-secondary py-4">
          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
          Cargando usuarios...
        </td>
      </tr>
    `;
  }

  function renderizarUsuarios() {
    if (!Array.isArray(state.usuarios) || state.usuarios.length === 0) {
      tablaUsuarios.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-secondary py-4">
            No hay usuarios registrados todavía.
          </td>
        </tr>
      `;
      if (contadorUsuarios) contadorUsuarios.textContent = '0 usuarios';
      return;
    }

    const fragment = document.createDocumentFragment();

    state.usuarios.forEach((usuario) => {
      const tr = document.createElement('tr');
      tr.dataset.id = usuario._id;
      tr.innerHTML = `
        <td style="min-width: 160px;">
          <input type="text" class="form-control form-control-sm mb-1" data-campo="nombre" value="${usuario.nombre || ''}">
          <input type="text" class="form-control form-control-sm" data-campo="apellido" value="${usuario.apellido || ''}">
        </td>
        <td style="min-width: 220px;">
          <input type="email" class="form-control form-control-sm" data-campo="email" value="${usuario.email || ''}">
        </td>
        <td style="min-width: 180px;">
          <select class="form-select form-select-sm" data-campo="rol">
            <option value="estudiante" ${usuario.rol === 'estudiante' ? 'selected' : ''}>Estudiante</option>
            <option value="profesor" ${usuario.rol === 'profesor' ? 'selected' : ''}>Profesor</option>
            <option value="admin_dae" ${usuario.rol === 'admin_dae' ? 'selected' : ''}>Administrador DAE</option>
          </select>
        </td>
        <td style="min-width: 140px;">
          <select class="form-select form-select-sm" data-campo="activo">
            <option value="true" ${usuario.activo !== false ? 'selected' : ''}>Activo</option>
            <option value="false" ${usuario.activo === false ? 'selected' : ''}>Inactivo</option>
          </select>
        </td>
        <td style="min-width: 200px;">
          <input type="password" class="form-control form-control-sm" data-campo="password" placeholder="Nueva contraseña (opcional)">
        </td>
        <td class="text-center" style="min-width: 170px;">
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary" data-accion="guardar">
              <i class="bi bi-save"></i>
            </button>
            <button class="btn btn-outline-danger" data-accion="desactivar">
              <i class="bi bi-person-dash"></i>
            </button>
          </div>
        </td>
      `;
      fragment.appendChild(tr);
    });

    tablaUsuarios.innerHTML = '';
    tablaUsuarios.appendChild(fragment);

    tablaUsuarios.querySelectorAll('button[data-accion]').forEach((btn) => {
      btn.addEventListener('click', manejarAccionUsuario);
    });

    if (contadorUsuarios) {
      contadorUsuarios.textContent = `${state.usuarios.length} usuario${state.usuarios.length === 1 ? '' : 's'}`;
    }
  }

  async function manejarRegistroUsuario(event) {
    event.preventDefault();
    const formData = new FormData(formUsuario);

    const payload = {
      nombre: formData.get('nombre')?.trim(),
      apellido: formData.get('apellido')?.trim(),
      email: formData.get('email')?.trim(),
      password: formData.get('password'),
      rol: formData.get('rol'),
      activo: formData.get('activo') ? 'true' : 'false'
    };

    if (!payload.nombre || !payload.apellido || !payload.email || !payload.password) {
      mostrarError('Completa todos los campos obligatorios para registrar el usuario.');
      return;
    }

    try {
      toggleFormularioRegistro(true);
      await window.usuariosAPI.create(payload);
      mostrarExito('Usuario registrado correctamente.');
      formUsuario.reset();
      if (formUsuario.querySelector('#usuario-activo')) {
        formUsuario.querySelector('#usuario-activo').checked = true;
      }
      await cargarUsuarios();
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      mostrarError(error.message || 'No se pudo registrar el usuario.');
    } finally {
      toggleFormularioRegistro(false);
    }
  }

  function toggleFormularioRegistro(deshabilitar) {
    formUsuario.querySelectorAll('input, select, button').forEach((el) => {
      el.disabled = deshabilitar;
    });
  }

  async function manejarAccionUsuario(event) {
    const accion = event.currentTarget.dataset.accion;
    const fila = event.currentTarget.closest('tr');
    if (!fila) return;
    const usuarioId = fila.dataset.id;
    if (!usuarioId) return;

    if (accion === 'guardar') {
      await actualizarUsuario(fila, usuarioId);
    } else if (accion === 'desactivar') {
      await desactivarUsuario(usuarioId);
    }
  }

  async function actualizarUsuario(fila, usuarioId) {
    if (state.usuarioSesion && String(state.usuarioSesion.id) === String(usuarioId)) {
      const activoValor = fila.querySelector('[data-campo="activo"]')?.value;
      if (activoValor === 'false') {
        mostrarError('No puedes desactivar tu propia cuenta mientras estás conectado.');
        return;
      }
    }

    const payload = obtenerDatosFila(fila);
    if (!payload) return;

    try {
      deshabilitarFila(fila, true);
      await window.usuariosAPI.update(usuarioId, payload);

      if (payload.password) {
        fila.querySelector('[data-campo="password"]').value = '';
      }

      mostrarExito('Usuario actualizado correctamente.');
      await cargarUsuarios();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      mostrarError(error.message || 'No se pudo actualizar el usuario.');
    } finally {
      deshabilitarFila(fila, false);
    }
  }

  async function desactivarUsuario(usuarioId) {
    if (state.usuarioSesion && String(state.usuarioSesion.id) === String(usuarioId)) {
      mostrarError('No puedes darte de baja a ti mismo mientras estás conectado.');
      return;
    }

    if (!confirm('¿Deseas dar de baja este usuario?')) {
      return;
    }
    try {
      await window.usuariosAPI.deactivate(usuarioId);
      mostrarExito('Usuario dado de baja correctamente.');
      await cargarUsuarios();
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      mostrarError('No se pudo dar de baja al usuario.');
    }
  }

  function obtenerDatosFila(fila) {
    const obtener = (selector) => fila.querySelector(selector)?.value?.trim() || '';
    const nombre = obtener('[data-campo="nombre"]');
    const apellido = obtener('[data-campo="apellido"]');
    const email = obtener('[data-campo="email"]');
    const rol = obtener('[data-campo="rol"]');
    const activoValor = obtener('[data-campo="activo"]');
    const password = obtener('[data-campo="password"]');

    if (!nombre || !apellido || !email) {
      mostrarError('Nombre, apellido y email son obligatorios.');
      return null;
    }

    const payload = {
      nombre,
      apellido,
      email,
      rol,
      activo: activoValor
    };

    if (password) {
      if (password.length < 6) {
        mostrarError('La nueva contraseña debe tener al menos 6 caracteres.');
        return null;
      }
      payload.password = password;
    }

    return payload;
  }

  function deshabilitarFila(fila, deshabilitar) {
    fila.querySelectorAll('input, select, button').forEach((el) => {
      el.disabled = deshabilitar;
    });
  }

  function mostrarError(mensaje) {
    if (!alertaGlobal) return;
    alertaGlobal.className = 'alert alert-danger';
    alertaGlobal.classList.remove('d-none');
    alertaGlobal.textContent = mensaje;
  }

  function mostrarExito(mensaje) {
    if (!alertaGlobal) return;
    alertaGlobal.className = 'alert alert-success';
    alertaGlobal.classList.remove('d-none');
    alertaGlobal.textContent = mensaje;
    setTimeout(() => {
      if (alertaGlobal) alertaGlobal.classList.add('d-none');
    }, 5000);
  }
})();

