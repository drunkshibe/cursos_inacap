// scripts/admin-cursos-page.js
(() => {
  const state = {
    cursos: [],
    editandoId: null,
    cursoSecciones: null,
    seccionEditandoId: null,
    seccionSeleccionadaId: null,
    leccionEditandoId: null
  };

  let formCurso;
  let btnGuardar;
  let btnCancelarEdicion;
  let btnNuevoCurso;
  let btnRecargar;
  let tablaBody;
  let contadorCursos;
  let alerta;
  let usuarioActual = null;

  let panelSecciones;
  let btnCerrarPanelSecciones;
  let panelSeccionesTitulo;
  let panelSeccionesResumen;
  let panelSeccionesConteo;
  let panelSeccionesAlert;
  let formSeccion;
  let btnCancelarSeccion;
  let tablaSeccionesBody;
  let inputSeccionTitulo;
  let inputSeccionDescripcion;
  let inputSeccionOrden;
  let inputSeccionRequiereVideo;
  let panelLecciones;
  let panelLeccionesAlert;
  let panelLeccionesConteo;
  let selectorLeccionSeccion;
  let formLeccion;
  let btnGuardarLeccion;
  let btnCancelarLeccion;
  let tablaLeccionesBody;
  let inputLeccionTitulo;
  let inputLeccionDescripcion;
  let inputLeccionContenido;
  let inputLeccionOrden;
  let inputLeccionRequiereVideo;
  let inputLeccionVideo;
  let inputLeccionMaterial;
  let wrapperEliminarVideo;
  let wrapperEliminarMaterial;
  let checkboxEliminarVideo;
  let checkboxEliminarMaterial;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheDom();
    if (!formCurso || !tablaBody) return;

    try {
      if (window.auth) {
        await window.auth.init();
        usuarioActual = window.auth.obtenerUsuario();
      }

      if (!usuarioActual || usuarioActual.rol !== 'admin_dae') {
        mostrarAccesoRestringido();
        return;
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      mostrarError('No fue posible verificar tu sesión. Intenta nuevamente.');
      return;
    }

    prepararFormulario();
    await cargarCursos();
  }

  function cacheDom() {
    formCurso = document.getElementById('form-curso');
    btnGuardar = document.getElementById('btn-guardar-curso');
    btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
    btnNuevoCurso = document.getElementById('btn-nuevo-curso');
    btnRecargar = document.getElementById('btn-recargar-cursos');
    tablaBody = document.getElementById('tabla-cursos-body');
    contadorCursos = document.getElementById('contador-cursos');
    alerta = document.getElementById('admin-cursos-alert');

    panelSecciones = document.getElementById('panel-secciones');
    btnCerrarPanelSecciones = document.getElementById('btn-cerrar-panel-secciones');
    panelSeccionesTitulo = document.getElementById('panel-secciones-curso');
    panelSeccionesResumen = document.getElementById('panel-secciones-resumen');
    panelSeccionesConteo = document.getElementById('panel-secciones-conteo');
    panelSeccionesAlert = document.getElementById('panel-secciones-alert');
    formSeccion = document.getElementById('form-seccion');
    btnCancelarSeccion = document.getElementById('btn-cancelar-seccion');
    tablaSeccionesBody = document.getElementById('tabla-secciones-body');
    inputSeccionTitulo = document.getElementById('seccion-titulo');
    inputSeccionDescripcion = document.getElementById('seccion-descripcion');
    inputSeccionOrden = document.getElementById('seccion-orden');
    inputSeccionRequiereVideo = document.getElementById('seccion-requiere-video');
    panelLecciones = document.getElementById('panel-lecciones');
    panelLeccionesAlert = document.getElementById('panel-lecciones-alert');
    panelLeccionesConteo = document.getElementById('panel-lecciones-conteo');
    selectorLeccionSeccion = document.getElementById('selector-leccion-seccion');
    formLeccion = document.getElementById('form-leccion');
    btnGuardarLeccion = document.getElementById('btn-guardar-leccion');
    btnCancelarLeccion = document.getElementById('btn-cancelar-leccion');
    tablaLeccionesBody = document.getElementById('tabla-lecciones-body');
    inputLeccionTitulo = document.getElementById('leccion-titulo');
    inputLeccionDescripcion = document.getElementById('leccion-descripcion');
    inputLeccionContenido = document.getElementById('leccion-contenido');
    inputLeccionOrden = document.getElementById('leccion-orden');
    inputLeccionRequiereVideo = document.getElementById('leccion-requiere-video');
    inputLeccionVideo = document.getElementById('leccion-video');
    inputLeccionMaterial = document.getElementById('leccion-material');
    wrapperEliminarVideo = document.getElementById('wrapper-eliminar-video');
    wrapperEliminarMaterial = document.getElementById('wrapper-eliminar-material');
    checkboxEliminarVideo = document.getElementById('leccion-eliminar-video');
    checkboxEliminarMaterial = document.getElementById('leccion-eliminar-material');
  }

  function mostrarAccesoRestringido() {
    if (!alerta) return;
    alerta.className = 'alert alert-warning';
    alerta.textContent = 'Solo el Administrador DAE puede acceder a esta sección.';
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = `
        <div class="container py-5">
          <div class="bg-white p-5 rounded shadow-sm text-center">
            <h2 class="h5 fw-semibold mb-3">Acceso restringido</h2>
            <p class="text-secondary mb-4">
              La administración de cursos está disponible exclusivamente para el Administrador DAE.
            </p>
            <a href="index.html" class="btn btn-primary btn-sm">Volver al inicio</a>
          </div>
        </div>
      `;
    }
  }

  function prepararFormulario() {
    formCurso.addEventListener('submit', manejarSubmitCurso);
    if (btnCancelarEdicion) {
      btnCancelarEdicion.addEventListener('click', (event) => {
        event.preventDefault();
        limpiarFormulario();
      });
    }
    if (btnNuevoCurso) {
      btnNuevoCurso.addEventListener('click', (event) => {
        event.preventDefault();
        limpiarFormulario();
        formCurso.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (btnRecargar) {
      btnRecargar.addEventListener('click', async () => {
        await cargarCursos(true);
      });
    }

    const fechaPublicacion = document.getElementById('curso-fecha-publicacion');
    if (fechaPublicacion && !fechaPublicacion.value) {
      fechaPublicacion.valueAsDate = new Date();
    }

    if (btnCerrarPanelSecciones) {
      btnCerrarPanelSecciones.addEventListener('click', cerrarPanelSecciones);
    }
    if (formSeccion) {
      formSeccion.addEventListener('submit', manejarSubmitSeccion);
    }
    if (btnCancelarSeccion) {
      btnCancelarSeccion.addEventListener('click', (event) => {
        event.preventDefault();
        limpiarFormularioSeccion();
      });
    }
    if (selectorLeccionSeccion) {
      selectorLeccionSeccion.addEventListener('change', manejarCambioSelectorLecciones);
    }
    if (formLeccion) {
      formLeccion.addEventListener('submit', manejarSubmitLeccion);
    }
    if (btnCancelarLeccion) {
      btnCancelarLeccion.addEventListener('click', (event) => {
        event.preventDefault();
        limpiarFormularioLeccion();
      });
    }
  }

  async function cargarCursos(forzar = false) {
    try {
      if (!forzar && state.cursos.length > 0) {
        renderizarCursos();
        return;
      }
      mostrarCargaCursos();
      const cursos = await window.cursosAPI.getAll({ includeTodos: true });
      state.cursos = Array.isArray(cursos) ? cursos : [];
      renderizarCursos();
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      mostrarError('No se pudieron cargar los cursos. Intenta nuevamente.');
      tablaBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-danger py-4">
            Error al cargar los cursos.
          </td>
        </tr>
      `;
    }
  }

  function mostrarCargaCursos() {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-secondary py-4">
          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
          Cargando cursos...
        </td>
      </tr>
    `;
  }

  function renderizarCursos() {
    if (!Array.isArray(state.cursos) || state.cursos.length === 0) {
      tablaBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-secondary py-4">
            No hay cursos registrados todavía.
          </td>
        </tr>
      `;
      if (contadorCursos) contadorCursos.textContent = '0 cursos';
      return;
    }

    const fragment = document.createDocumentFragment();
    state.cursos.forEach((curso) => {
      const tr = document.createElement('tr');
      const activo = curso.activo !== false;
      const fechaPub = curso.fechaPublicacion ? formatearFecha(curso.fechaPublicacion) : '—';
      const fechaCierre = curso.fechaCierre ? formatearFecha(curso.fechaCierre) : '—';

      tr.innerHTML = `
        <td>
          <div class="fw-semibold">${curso.titulo}</div>
          <div class="text-secondary small text-truncate" style="max-width: 320px;">${curso.descripcion || 'Sin descripción'}</div>
        </td>
        <td class="text-nowrap">
          <span class="badge estado-badge ${activo ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}">
            ${activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td class="small">
          <div class="text-secondary">Inicio: ${fechaPub}</div>
          <div class="text-secondary">Cierre: ${fechaCierre}</div>
        </td>
        <td class="text-center">
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary" data-accion="editar" data-id="${curso._id}">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-success" data-accion="secciones" data-id="${curso._id}">
              <i class="bi bi-list-ul"></i>
            </button>
            <button class="btn btn-outline-${activo ? 'warning' : 'success'}" data-accion="toggle" data-id="${curso._id}">
              <i class="bi ${activo ? 'bi-slash-circle' : 'bi-check-circle'}"></i>
            </button>
            <button class="btn btn-outline-danger" data-accion="eliminar" data-id="${curso._id}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;

      fragment.appendChild(tr);
    });

    tablaBody.innerHTML = '';
    tablaBody.appendChild(fragment);
    tablaBody.querySelectorAll('button[data-accion]').forEach((btn) => {
      btn.addEventListener('click', manejarAccionCurso);
    });

    if (contadorCursos) {
      contadorCursos.textContent = `${state.cursos.length} curso${state.cursos.length === 1 ? '' : 's'}`;
    }
  }

  async function manejarAccionCurso(event) {
    const accion = event.currentTarget.dataset.accion;
    const cursoId = event.currentTarget.dataset.id;
    const curso = state.cursos.find(c => c._id === cursoId);
    if (!accion || !curso) return;

    switch (accion) {
      case 'editar':
        cargarDatosCursoEnFormulario(curso);
        break;
      case 'secciones':
        await abrirPanelSecciones(curso._id);
        break;
      case 'toggle':
        await alternarEstadoCurso(curso);
        break;
      case 'eliminar':
        await eliminarCurso(curso);
        break;
      default:
        break;
    }
  }

  function cargarDatosCursoEnFormulario(curso) {
    state.editandoId = curso._id;
    document.getElementById('form-curso-titulo').textContent = 'Editar curso';
    if (btnGuardar) btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i> Actualizar curso';
    if (btnCancelarEdicion) btnCancelarEdicion.classList.remove('d-none');

    formCurso.querySelector('#curso-id').value = curso._id;
    formCurso.querySelector('#curso-titulo').value = curso.titulo || '';
    formCurso.querySelector('#curso-descripcion').value = curso.descripcion || '';
    formCurso.querySelector('#curso-categoria').value = curso.categoria || '';
    formCurso.querySelector('#curso-nivel').value = curso.nivel || 'Intermedio';
    formCurso.querySelector('#curso-idioma').value = curso.idioma || 'Español';
    formCurso.querySelector('#curso-duracion').value = curso.duracionTotal || '';
    formCurso.querySelector('#curso-precio').value = curso.precio || 0;
    formCurso.querySelector('#curso-profesor-nombre').value = curso.profesor?.nombre || '';
    formCurso.querySelector('#curso-profesor-descripcion').value = curso.profesor?.descripcion || '';
    formCurso.querySelector('#curso-activo').checked = curso.activo !== false;

    const fechaPublicacion = formCurso.querySelector('#curso-fecha-publicacion');
    const fechaCierre = formCurso.querySelector('#curso-fecha-cierre');

    if (fechaPublicacion) {
      fechaPublicacion.value = curso.fechaPublicacion ? formatearFechaInput(curso.fechaPublicacion) : '';
    }
    if (fechaCierre) {
      fechaCierre.value = curso.fechaCierre ? formatearFechaInput(curso.fechaCierre) : '';
    }

    formCurso.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function limpiarFormulario() {
    state.editandoId = null;
    formCurso.reset();
    document.getElementById('curso-id').value = '';
    document.getElementById('form-curso-titulo').textContent = 'Crear curso';
    if (btnGuardar) btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i> Guardar curso';
    if (btnCancelarEdicion) btnCancelarEdicion.classList.add('d-none');

    const fechaPublicacion = document.getElementById('curso-fecha-publicacion');
    if (fechaPublicacion) {
      fechaPublicacion.valueAsDate = new Date();
    }
    const fechaCierre = document.getElementById('curso-fecha-cierre');
    if (fechaCierre) {
      fechaCierre.value = '';
    }
    const activo = document.getElementById('curso-activo');
    if (activo) activo.checked = true;
  }

  async function manejarSubmitCurso(event) {
    event.preventDefault();
    ocultarAlerta();

    if (!formCurso.checkValidity()) {
      formCurso.classList.add('was-validated');
      return;
    }

    const formData = new FormData(formCurso);
    const cursoId = formData.get('cursoId');

    const payload = {
      titulo: formData.get('titulo'),
      descripcion: formData.get('descripcion'),
      categoria: formData.get('categoria') || undefined,
      nivel: formData.get('nivel') || undefined,
      idioma: formData.get('idioma') || undefined,
      duracionTotal: formData.get('duracionTotal') || undefined,
      precio: formData.get('precio') || undefined,
      fechaPublicacion: formData.get('fechaPublicacion') || undefined,
      fechaCierre: formData.get('fechaCierre') || undefined,
      activo: formData.get('activo') ? 'true' : 'false',
      'profesor.nombre': formData.get('profesorNombre') || undefined,
      'profesor.descripcion': formData.get('profesorDescripcion') || undefined
    };

    const imagenFile = formCurso.querySelector('#curso-imagen').files[0] || null;

    try {
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

      let cursoResult;
      if (cursoId) {
        cursoResult = await window.cursosAPI.update(cursoId, payload, imagenFile);
        mostrarExito('Curso actualizado correctamente.');
      } else {
        cursoResult = await window.cursosAPI.create(payload, imagenFile);
        mostrarExito('Curso creado correctamente.');
      }

      await cargarCursos(true);
      limpiarFormulario();
    } catch (error) {
      console.error('Error al guardar curso:', error);
      mostrarError(error.message || 'No se pudo guardar el curso.');
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = state.editandoId ? '<i class="bi bi-save me-1"></i> Actualizar curso' : '<i class="bi bi-save me-1"></i> Guardar curso';
      const inputFile = formCurso.querySelector('#curso-imagen');
      if (inputFile) inputFile.value = '';
    }
  }

  async function alternarEstadoCurso(curso) {
    const activoActual = curso.activo !== false;
    const nuevoEstado = !activoActual;
    try {
      const respuesta = await window.cursosAPI.update(curso._id, {
        activo: nuevoEstado.toString()
      });
      const textoEstado = nuevoEstado ? 'activo' : 'inactivo';
      mostrarExito(`El curso "${curso.titulo}" se marcó como ${textoEstado}.`);
      actualizarCursoEnState(respuesta);
      await cargarCursos(true);
      if (state.cursoSecciones && state.cursoSecciones._id === curso._id) {
        await abrirPanelSecciones(curso._id, true);
      }
    } catch (error) {
      console.error('Error al actualizar estado del curso:', error);
      mostrarError('No se pudo cambiar el estado del curso.');
    }
  }

  async function eliminarCurso(curso) {
    if (!confirm(`¿Seguro que deseas desactivar el curso "${curso.titulo}"?`)) {
      return;
    }
    try {
      await window.cursosAPI.delete(curso._id);
      mostrarExito(`El curso "${curso.titulo}" fue desactivado.`);
      await cargarCursos(true);
      if (state.cursoSecciones && state.cursoSecciones._id === curso._id) {
        cerrarPanelSecciones();
      }
    } catch (error) {
      console.error('Error al eliminar curso:', error);
      mostrarError('No se pudo desactivar el curso.');
    }
  }

  function mostrarError(mensaje) {
    if (!alerta) return;
    alerta.className = 'alert alert-danger';
    alerta.classList.remove('d-none');
    alerta.textContent = mensaje;
  }

  function mostrarExito(mensaje) {
    if (!alerta) return;
    alerta.className = 'alert alert-success';
    alerta.classList.remove('d-none');
    alerta.textContent = mensaje;
    setTimeout(() => {
      if (alerta) alerta.classList.add('d-none');
    }, 5000);
  }

  function ocultarAlerta() {
    if (!alerta) return;
    alerta.classList.add('d-none');
    alerta.textContent = '';
  }

  function formatearFecha(fecha) {
    if (!fecha) return '—';
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatearFechaInput(fecha) {
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function abrirPanelSecciones(cursoId, mantenerVisible = false) {
    if (!panelSecciones) return;
    ocultarAlertaSecciones();
    try {
      const curso = await window.cursosAPI.getById(cursoId);
      if (!curso) {
        mostrarError('No se pudo obtener la información del curso.');
        return;
      }

      state.cursoSecciones = curso;
      state.seccionEditandoId = null;
      panelSeccionesTitulo.textContent = `Secciones de "${curso.titulo}"`;
      panelSeccionesResumen.textContent = curso.descripcion || 'Sin descripción';
      panelSecciones.classList.remove('d-none');
      limpiarFormularioSeccion();
      renderSecciones();
      actualizarPanelLecciones();

      if (!mantenerVisible) {
        panelSecciones.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error('Error al cargar secciones:', error);
      mostrarAlertaSecciones('No se pudo cargar la estructura del curso.', 'danger');
    }
  }

  function cerrarPanelSecciones() {
    if (!panelSecciones) return;
    panelSecciones.classList.add('d-none');
    state.cursoSecciones = null;
    state.seccionEditandoId = null;
    state.seccionSeleccionadaId = null;
    state.leccionEditandoId = null;
    if (panelLecciones) {
      panelLecciones.classList.add('d-none');
    }
  }

  function renderSecciones() {
    if (!tablaSeccionesBody) return;
    if (!state.cursoSecciones || !Array.isArray(state.cursoSecciones.secciones) || state.cursoSecciones.secciones.length === 0) {
      tablaSeccionesBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-secondary py-4">Todavía no hay secciones registradas.</td>
        </tr>
      `;
      if (panelSeccionesConteo) panelSeccionesConteo.textContent = '0 secciones';
      return;
    }

    const seccionesOrdenadas = state.cursoSecciones.secciones
      .slice()
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    const fragment = document.createDocumentFragment();
    seccionesOrdenadas.forEach((seccion) => {
      const tr = document.createElement('tr');
      const requiereVideo = seccion.requiereVideo !== false;
      const totalLecciones = Array.isArray(seccion.lecciones) ? seccion.lecciones.length : 0;

      tr.innerHTML = `
        <td>
          <div class="fw-semibold">${seccion.titulo || 'Sin título'}</div>
          <div class="text-secondary small text-truncate" style="max-width: 280px;">${seccion.descripcion || 'Sin descripción'}</div>
        </td>
        <td class="text-nowrap">${seccion.orden ?? '—'}</td>
        <td class="text-nowrap">
          <span class="badge ${requiereVideo ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}">
            ${requiereVideo ? 'Requiere video' : 'Video opcional'}
          </span>
        </td>
        <td class="text-center text-secondary">${totalLecciones}</td>
        <td class="text-center">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" data-accion="editar-seccion" data-id="${seccion._id}">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" data-accion="eliminar-seccion" data-id="${seccion._id}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;

      fragment.appendChild(tr);
    });

    tablaSeccionesBody.innerHTML = '';
    tablaSeccionesBody.appendChild(fragment);

    tablaSeccionesBody.querySelectorAll('button[data-accion]').forEach((btn) => {
      btn.addEventListener('click', manejarAccionSeccion);
    });

    if (panelSeccionesConteo) {
      panelSeccionesConteo.textContent = `${state.cursoSecciones.secciones.length} sección${state.cursoSecciones.secciones.length === 1 ? '' : 'es'}`;
    }
    actualizarPanelLecciones();
  }

  function manejarAccionSeccion(event) {
    const accion = event.currentTarget.dataset.accion;
    const seccionId = event.currentTarget.dataset.id;
    if (!accion || !seccionId) return;

    if (accion === 'editar-seccion') {
      const seccion = (state.cursoSecciones?.secciones || []).find(sec => sec._id === seccionId);
      if (seccion) {
        cargarSeccionEnFormulario(seccion);
      }
    } else if (accion === 'eliminar-seccion') {
      eliminarSeccion(seccionId);
    }
  }

  function cargarSeccionEnFormulario(seccion) {
    state.seccionEditandoId = seccion._id;
    formSeccion.querySelector('#seccion-id').value = seccion._id;
    inputSeccionTitulo.value = seccion.titulo || '';
    inputSeccionDescripcion.value = seccion.descripcion || '';
    inputSeccionOrden.value = seccion.orden || '';
    inputSeccionRequiereVideo.checked = seccion.requiereVideo !== false;

    document.getElementById('form-seccion-titulo').textContent = 'Editar sección';
    document.getElementById('btn-guardar-seccion').textContent = 'Actualizar sección';
    btnCancelarSeccion.classList.remove('d-none');
  }

  function limpiarFormularioSeccion() {
    state.seccionEditandoId = null;
    if (!formSeccion) return;
    formSeccion.reset();
    formSeccion.querySelector('#seccion-id').value = '';
    inputSeccionRequiereVideo.checked = true;
    document.getElementById('form-seccion-titulo').textContent = 'Nueva sección';
    document.getElementById('btn-guardar-seccion').textContent = 'Guardar sección';
    btnCancelarSeccion.classList.add('d-none');
  }

  async function manejarSubmitSeccion(event) {
    event.preventDefault();
    ocultarAlertaSecciones();

    if (!state.cursoSecciones) {
      mostrarAlertaSecciones('Selecciona un curso antes de guardar secciones.', 'warning');
      return;
    }

    const titulo = inputSeccionTitulo.value.trim();
    if (!titulo) {
      mostrarAlertaSecciones('La sección debe tener un título.', 'danger');
      return;
    }

    const payload = {
      titulo,
      descripcion: inputSeccionDescripcion.value.trim(),
      orden: inputSeccionOrden.value ? Number(inputSeccionOrden.value) : undefined,
      requiereVideo: inputSeccionRequiereVideo.checked ? 'true' : 'false'
    };

    try {
      deshabilitarFormularioSeccion(true);
      let cursoActualizado;
      let seccionDestinoId = state.seccionEditandoId;
      if (state.seccionEditandoId) {
        cursoActualizado = await window.cursosAPI.updateSeccion(
          state.cursoSecciones._id,
          state.seccionEditandoId,
          payload
        );
        mostrarAlertaSecciones('Sección actualizada correctamente.', 'success');
      } else {
        cursoActualizado = await window.cursosAPI.addSeccion(
          state.cursoSecciones._id,
          payload
        );
        mostrarAlertaSecciones('Sección creada correctamente.', 'success');
        const ultimaSeccion = Array.isArray(cursoActualizado.secciones) && cursoActualizado.secciones.length > 0
          ? cursoActualizado.secciones[cursoActualizado.secciones.length - 1]
          : null;
        seccionDestinoId = ultimaSeccion?._id || seccionDestinoId;
      }

      actualizarCursoEnState(cursoActualizado);
      if (seccionDestinoId) {
        state.seccionSeleccionadaId = seccionDestinoId;
      }
      limpiarFormularioSeccion();
      actualizarPanelLecciones();
    } catch (error) {
      console.error('Error al guardar sección:', error);
      mostrarAlertaSecciones(error.message || 'No se pudo guardar la sección.', 'danger');
    } finally {
      deshabilitarFormularioSeccion(false);
    }
  }

  function deshabilitarFormularioSeccion(deshabilitar) {
    if (!formSeccion) return;
    formSeccion.querySelectorAll('input, textarea, button').forEach((el) => {
      el.disabled = deshabilitar;
    });
  }

  async function eliminarSeccion(seccionId) {
    if (!state.cursoSecciones) return;
    if (!confirm('¿Deseas eliminar esta sección? Las lecciones asociadas también se eliminarán.')) {
      return;
    }

    try {
      deshabilitarTablaSecciones(true);
      const cursoActualizado = await window.cursosAPI.deleteSeccion(
        state.cursoSecciones._id,
        seccionId
      );
      mostrarAlertaSecciones('Sección eliminada correctamente.', 'success');
      const seccionesRestantes = Array.isArray(cursoActualizado.secciones) ? cursoActualizado.secciones : [];
      if (!seccionesRestantes.some(sec => sec._id === state.seccionSeleccionadaId)) {
        state.seccionSeleccionadaId = seccionesRestantes.length ? seccionesRestantes[0]._id : null;
      }
      actualizarCursoEnState(cursoActualizado);
      limpiarFormularioSeccion();
      actualizarPanelLecciones();
    } catch (error) {
      console.error('Error al eliminar sección:', error);
      mostrarAlertaSecciones('No se pudo eliminar la sección.', 'danger');
    } finally {
      deshabilitarTablaSecciones(false);
    }
  }

  function deshabilitarTablaSecciones(deshabilitar) {
    if (!tablaSeccionesBody) return;
    tablaSeccionesBody.querySelectorAll('button').forEach((btn) => {
      btn.disabled = deshabilitar;
    });
  }

  function mostrarAlertaSecciones(mensaje, tipo = 'info') {
    if (!panelSeccionesAlert) return;
    panelSeccionesAlert.className = `alert alert-${tipo}`;
    panelSeccionesAlert.classList.remove('d-none');
    panelSeccionesAlert.textContent = mensaje;
  }

  function ocultarAlertaSecciones() {
    if (!panelSeccionesAlert) return;
    panelSeccionesAlert.classList.add('d-none');
    panelSeccionesAlert.textContent = '';
  }

  function actualizarCursoEnState(cursoActualizado) {
    const index = state.cursos.findIndex(c => c._id === cursoActualizado._id);
    if (index >= 0) {
      state.cursos[index] = cursoActualizado;
      renderizarCursos();
    }
    if (state.cursoSecciones && state.cursoSecciones._id === cursoActualizado._id) {
      state.cursoSecciones = cursoActualizado;
      renderSecciones();
      actualizarPanelLecciones();
    }
  }

  function actualizarPanelLecciones() {
    if (!panelLecciones || !selectorLeccionSeccion) return;

    const secciones = Array.isArray(state.cursoSecciones?.secciones)
      ? state.cursoSecciones.secciones.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0))
      : [];

    if (secciones.length === 0) {
      panelLecciones.classList.add('d-none');
      selectorLeccionSeccion.innerHTML = '<option value="">No hay secciones disponibles</option>';
      if (tablaLeccionesBody) {
        tablaLeccionesBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-secondary py-4">
              Agrega una sección para comenzar a registrar lecciones.
            </td>
          </tr>
        `;
      }
      state.seccionSeleccionadaId = null;
      limpiarFormularioLeccion(true);
      return;
    }

    panelLecciones.classList.remove('d-none');
    const seleccionPrevia = state.seccionSeleccionadaId;
    const seccionActiva = secciones.find(sec => sec._id === seleccionPrevia) ? seleccionPrevia : secciones[0]._id;
    poblarSelectorLecciones(secciones, seccionActiva);
    state.seccionSeleccionadaId = seccionActiva;
    renderLecciones();
  }

  function poblarSelectorLecciones(secciones, seleccionId) {
    if (!selectorLeccionSeccion) return;
    selectorLeccionSeccion.innerHTML = secciones.map((seccion) => {
      const selected = seccion._id === seleccionId ? 'selected' : '';
      const etiqueta = `${seccion.orden ?? 1}. ${seccion.titulo || 'Sin título'}`;
      return `<option value="${seccion._id}" ${selected}>${etiqueta}</option>`;
    }).join('');

    if (selectorLeccionSeccion.value !== seleccionId) {
      selectorLeccionSeccion.value = seleccionId || '';
    }

    actualizarDescripcionSeccionSeleccionada();
  }

  function actualizarDescripcionSeccionSeleccionada() {
    const descripcionElement = document.getElementById('descripcion-seccion-seleccionada');
    if (!descripcionElement) return;
    const seccion = obtenerSeccionSeleccionada();
    if (!seccion) {
      descripcionElement.textContent = 'Selecciona una sección para gestionar sus lecciones.';
      return;
    }
    descripcionElement.textContent = seccion.descripcion
      ? seccion.descripcion
      : 'Administra los contenidos, materiales y video de esta sección.';
  }

  function obtenerSeccionSeleccionada() {
    if (!state.cursoSecciones || !state.seccionSeleccionadaId) return null;
    return (state.cursoSecciones.secciones || []).find(
      seccion => seccion._id === state.seccionSeleccionadaId
    ) || null;
  }

  function renderLecciones() {
    if (!tablaLeccionesBody) return;
    const seccion = obtenerSeccionSeleccionada();

    if (!seccion) {
      tablaLeccionesBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-secondary py-4">
            Selecciona una sección para ver sus lecciones.
          </td>
        </tr>
      `;
      if (panelLeccionesConteo) panelLeccionesConteo.textContent = '0 lecciones';
      limpiarFormularioLeccion(true);
      return;
    }

    const lecciones = Array.isArray(seccion.lecciones)
      ? seccion.lecciones.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0))
      : [];

    if (lecciones.length === 0) {
      tablaLeccionesBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-secondary py-4">
            Aún no se han registrado lecciones para esta sección.
          </td>
        </tr>
      `;
      if (panelLeccionesConteo) panelLeccionesConteo.textContent = '0 lecciones';
      limpiarFormularioLeccion(true);
      return;
    }

    const fragment = document.createDocumentFragment();
    lecciones.forEach((leccion) => {
      const tr = document.createElement('tr');
      const tieneVideo = Boolean(leccion.urlVideo);
      const requiereVideo = leccion.requiereVideo !== false && tieneVideo;

      tr.innerHTML = `
        <td>
          <div class="fw-semibold">${leccion.titulo || 'Sin título'}</div>
          <div class="text-secondary small text-truncate" style="max-width: 320px;">
            ${leccion.descripcion || leccion.contenido?.slice(0, 120) || 'Sin descripción'}
          </div>
        </td>
        <td class="text-nowrap">${leccion.orden ?? '—'}</td>
        <td class="text-nowrap">
          <span class="badge ${tieneVideo ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}">
            ${tieneVideo ? 'Video cargado' : 'Sin video'}
          </span>
        </td>
        <td class="text-nowrap">
          <span class="badge ${requiereVideo ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'}">
            ${requiereVideo ? 'Obligatorio' : 'Opcional'}
          </span>
        </td>
        <td class="text-center">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" data-accion="editar-leccion" data-id="${leccion._id}">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" data-accion="eliminar-leccion" data-id="${leccion._id}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;

      fragment.appendChild(tr);
    });

    tablaLeccionesBody.innerHTML = '';
    tablaLeccionesBody.appendChild(fragment);

    tablaLeccionesBody.querySelectorAll('button[data-accion]').forEach((btn) => {
      btn.addEventListener('click', manejarAccionLeccion);
    });

    if (panelLeccionesConteo) {
      panelLeccionesConteo.textContent = `${lecciones.length} lección${lecciones.length === 1 ? '' : 'es'}`;
    }
  }

  function manejarCambioSelectorLecciones() {
    state.seccionSeleccionadaId = selectorLeccionSeccion.value || null;
    limpiarFormularioLeccion();
    renderLecciones();
  }

  function manejarAccionLeccion(event) {
    const accion = event.currentTarget.dataset.accion;
    const leccionId = event.currentTarget.dataset.id;
    if (!accion || !leccionId) return;

    const seccion = obtenerSeccionSeleccionada();
    if (!seccion) return;

    const leccion = (seccion.lecciones || []).find(lec => lec._id === leccionId);
    if (!leccion) return;

    if (accion === 'editar-leccion') {
      cargarLeccionEnFormulario(leccion);
    } else if (accion === 'eliminar-leccion') {
      eliminarLeccion(leccion);
    }
  }

  function cargarLeccionEnFormulario(leccion) {
    if (!formLeccion) return;
    state.leccionEditandoId = leccion._id;
    formLeccion.querySelector('#leccion-id').value = leccion._id;
    inputLeccionTitulo.value = leccion.titulo || '';
    inputLeccionDescripcion.value = leccion.descripcion || '';
    inputLeccionContenido.value = leccion.contenido || '';
    inputLeccionOrden.value = leccion.orden || '';
    inputLeccionRequiereVideo.checked = leccion.requiereVideo !== false;

    document.getElementById('form-leccion-titulo').textContent = 'Editar lección';
    if (btnGuardarLeccion) btnGuardarLeccion.textContent = 'Actualizar lección';
    if (btnCancelarLeccion) btnCancelarLeccion.classList.remove('d-none');

    if (wrapperEliminarVideo) {
      wrapperEliminarVideo.classList.toggle('d-none', !leccion.urlVideo);
      if (checkboxEliminarVideo) checkboxEliminarVideo.checked = false;
    }
    if (wrapperEliminarMaterial) {
      wrapperEliminarMaterial.classList.toggle('d-none', !leccion.urlArchivo);
      if (checkboxEliminarMaterial) checkboxEliminarMaterial.checked = false;
    }
  }

  function limpiarFormularioLeccion(forzar = false) {
    if (!formLeccion) return;
    if (!forzar && state.leccionEditandoId === null) {
      formLeccion.reset();
    } else {
      formLeccion.reset();
    }

    state.leccionEditandoId = null;
    const titulo = document.getElementById('form-leccion-titulo');
    if (titulo) titulo.textContent = 'Nueva lección';
    if (btnGuardarLeccion) btnGuardarLeccion.textContent = 'Guardar lección';
    if (btnCancelarLeccion) btnCancelarLeccion.classList.add('d-none');

    const seccion = obtenerSeccionSeleccionada();
    const requiereVideoPorDefecto = seccion ? seccion.requiereVideo !== false : false;
    if (inputLeccionRequiereVideo) inputLeccionRequiereVideo.checked = requiereVideoPorDefecto;
    if (inputLeccionVideo) inputLeccionVideo.value = '';
    if (inputLeccionMaterial) inputLeccionMaterial.value = '';
    if (checkboxEliminarVideo) checkboxEliminarVideo.checked = false;
    if (checkboxEliminarMaterial) checkboxEliminarMaterial.checked = false;
    if (wrapperEliminarVideo) wrapperEliminarVideo.classList.add('d-none');
    if (wrapperEliminarMaterial) wrapperEliminarMaterial.classList.add('d-none');
    if (!forzar) {
      ocultarAlertaLecciones();
    }
  }

  async function manejarSubmitLeccion(event) {
    event.preventDefault();
    ocultarAlertaLecciones();

    if (!state.cursoSecciones) {
      mostrarAlertaLecciones('Selecciona un curso antes de gestionar las lecciones.', 'warning');
      return;
    }

    const seccionId = state.seccionSeleccionadaId;
    if (!seccionId) {
      mostrarAlertaLecciones('Selecciona una sección para agregar o editar lecciones.', 'warning');
      return;
    }

    if (!formLeccion.checkValidity()) {
      formLeccion.classList.add('was-validated');
      mostrarAlertaLecciones('Completa los campos obligatorios de la lección.', 'danger');
      return;
    }

    const payload = {
      titulo: inputLeccionTitulo.value.trim(),
      descripcion: inputLeccionDescripcion.value.trim(),
      contenido: inputLeccionContenido.value.trim(),
      orden: inputLeccionOrden.value ? Number(inputLeccionOrden.value) : undefined,
      requiereVideo: inputLeccionRequiereVideo.checked ? 'true' : 'false'
    };

    if (Number.isNaN(payload.orden)) payload.orden = undefined;

    if (state.leccionEditandoId) {
      if (checkboxEliminarVideo && !checkboxEliminarVideo.classList.contains('d-none')) {
        payload.eliminarVideo = checkboxEliminarVideo.checked ? 'true' : 'false';
      }
      if (checkboxEliminarMaterial && !checkboxEliminarMaterial.classList.contains('d-none')) {
        payload.eliminarMaterial = checkboxEliminarMaterial.checked ? 'true' : 'false';
      }
    }

    const videoFile = inputLeccionVideo?.files?.[0] || null;
    const materialFile = inputLeccionMaterial?.files?.[0] || null;

    try {
      deshabilitarFormularioLeccion(true);
      let cursoActualizado;

      if (state.leccionEditandoId) {
        cursoActualizado = await window.cursosAPI.updateLeccion(
          state.cursoSecciones._id,
          seccionId,
          state.leccionEditandoId,
          payload,
          videoFile,
          null,
          materialFile
        );
        mostrarAlertaLecciones('Lección actualizada correctamente.', 'success');
      } else {
        cursoActualizado = await window.cursosAPI.addLeccion(
          state.cursoSecciones._id,
          seccionId,
          payload,
          videoFile,
          null,
          materialFile
        );
        mostrarAlertaLecciones('Lección creada correctamente.', 'success');
      }

      actualizarCursoEnState(cursoActualizado);
      state.seccionSeleccionadaId = seccionId;
      limpiarFormularioLeccion();
      actualizarPanelLecciones();
    } catch (error) {
      console.error('Error al guardar lección:', error);
      mostrarAlertaLecciones(error.message || 'No se pudo guardar la lección.', 'danger');
    } finally {
      deshabilitarFormularioLeccion(false);
      if (inputLeccionVideo) inputLeccionVideo.value = '';
      if (inputLeccionMaterial) inputLeccionMaterial.value = '';
      if (checkboxEliminarVideo) checkboxEliminarVideo.checked = false;
      if (checkboxEliminarMaterial) checkboxEliminarMaterial.checked = false;
    }
  }

  async function eliminarLeccion(leccion) {
    if (!state.cursoSecciones || !state.seccionSeleccionadaId) return;
    if (!confirm(`¿Deseas eliminar la lección "${leccion.titulo || 'sin título'}"?`)) {
      return;
    }

    try {
      deshabilitarTablaLecciones(true);
      const cursoActualizado = await window.cursosAPI.deleteLeccion(
        state.cursoSecciones._id,
        state.seccionSeleccionadaId,
        leccion._id
      );
      mostrarAlertaLecciones('Lección eliminada correctamente.', 'success');
      actualizarCursoEnState(cursoActualizado);
      limpiarFormularioLeccion();
      actualizarPanelLecciones();
    } catch (error) {
      console.error('Error al eliminar lección:', error);
      mostrarAlertaLecciones('No se pudo eliminar la lección.', 'danger');
    } finally {
      deshabilitarTablaLecciones(false);
    }
  }

  function deshabilitarFormularioLeccion(deshabilitar) {
    if (!formLeccion) return;
    formLeccion.querySelectorAll('input, textarea, button').forEach((elemento) => {
      elemento.disabled = deshabilitar;
    });
  }

  function deshabilitarTablaLecciones(deshabilitar) {
    if (!tablaLeccionesBody) return;
    tablaLeccionesBody.querySelectorAll('button').forEach((btn) => {
      btn.disabled = deshabilitar;
    });
  }

  function mostrarAlertaLecciones(mensaje, tipo = 'info') {
    if (!panelLeccionesAlert) return;
    panelLeccionesAlert.className = `alert alert-${tipo} small`;
    panelLeccionesAlert.classList.remove('d-none');
    panelLeccionesAlert.textContent = mensaje;
  }

  function ocultarAlertaLecciones() {
    if (!panelLeccionesAlert) return;
    panelLeccionesAlert.classList.add('d-none');
    panelLeccionesAlert.textContent = '';
  }
})();

