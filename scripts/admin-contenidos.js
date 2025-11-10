// scripts/admin-contenidos.js
(() => {
  const state = {
    cursos: [],
    cursoSeleccionado: null,
    examenSeleccionado: null,
    preguntas: [],
    builder: {
      editIndex: null,
      opciones: []
    },
    usuario: null
  };

  // Elementos del DOM
  let alertaGlobal;
  let selectCurso;
  let selectExamen;
  let btnNuevoExamen;
  let btnEliminarExamen;
  let formExamen;
  let alertaExamen;
  let listaPreguntas;
  let btnAgregarPregunta;
  let builderCard;
  let builderTitulo;
  let builderTexto;
  let builderPuntos;
  let builderTipo;
  let builderOpcionesWrapper;
  let builderOpcionesLista;
  let inputOpcionTexto;
  let btnGuardarOpcion;
  let btnGuardarOpcionSimple;
  let btnGuardarPregunta;
  let btnLimpiarPregunta;
  let btnCerrarBuilder;
  let btnRefrescar;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheDom();
    if (!formExamen) return;

    try {
      if (window.auth) {
        await window.auth.init();
        state.usuario = window.auth.obtenerUsuario();
      }
      if (!state.usuario || state.usuario.rol !== 'admin_dae') {
        mostrarAccesoRestringido();
        return;
      }
    } catch (error) {
      console.error('Error validando autenticación:', error);
      mostrarErrorGlobal('No fue posible validar tu sesión. Intenta nuevamente.');
      return;
    }

    enlazarEventos();
    await cargarCursos();
  }

  function cacheDom() {
    alertaGlobal = document.getElementById('admin-contenidos-alert');
    selectCurso = document.getElementById('selector-curso-examen');
    selectExamen = document.getElementById('selector-examen-existente');
    btnNuevoExamen = document.getElementById('btn-nuevo-examen');
    btnEliminarExamen = document.getElementById('btn-eliminar-examen');
    formExamen = document.getElementById('form-examen');
    alertaExamen = document.getElementById('examen-alerta');
    listaPreguntas = document.getElementById('lista-preguntas');
    btnAgregarPregunta = document.getElementById('btn-agregar-pregunta');
    builderCard = document.getElementById('builder-pregunta');
    builderTitulo = document.getElementById('builder-titulo');
    builderTexto = document.getElementById('builder-texto');
    builderPuntos = document.getElementById('builder-puntos');
    builderTipo = document.getElementById('builder-tipo');
    builderOpcionesWrapper = document.getElementById('builder-opciones-wrapper');
    builderOpcionesLista = document.getElementById('builder-opciones-lista');
    inputOpcionTexto = document.getElementById('builder-opcion-texto');
    btnGuardarOpcion = document.getElementById('btn-guardar-opcion');
    btnGuardarOpcionSimple = document.getElementById('btn-guardar-opcion-simple');
    btnGuardarPregunta = document.getElementById('btn-guardar-pregunta');
    btnLimpiarPregunta = document.getElementById('btn-limpiar-pregunta');
    btnCerrarBuilder = document.getElementById('btn-cerrar-builder');
    btnRefrescar = document.getElementById('btn-refrescar-contenidos');
  }

  function enlazarEventos() {
    if (btnRefrescar) {
      btnRefrescar.addEventListener('click', () => window.location.reload());
    }

    selectCurso.addEventListener('change', manejarCambioCurso);
    selectExamen.addEventListener('change', manejarCambioExamen);

    if (btnNuevoExamen) {
      btnNuevoExamen.addEventListener('click', () => {
        limpiarFormularioExamen();
        mostrarBuilder(false);
      });
    }

    if (btnEliminarExamen) {
      btnEliminarExamen.addEventListener('click', eliminarExamenActual);
    }

    formExamen.addEventListener('submit', manejarSubmitExamen);

    if (btnAgregarPregunta) {
      btnAgregarPregunta.addEventListener('click', () => abrirBuilder());
    }
    if (btnGuardarPregunta) {
      btnGuardarPregunta.addEventListener('click', guardarPregunta);
    }
    if (btnLimpiarPregunta) {
      btnLimpiarPregunta.addEventListener('click', limpiarBuilder);
    }
    if (btnCerrarBuilder) {
      btnCerrarBuilder.addEventListener('click', () => mostrarBuilder(false));
    }
    if (btnGuardarOpcion) {
      btnGuardarOpcion.addEventListener('click', () => agregarOpcion(true));
    }
    if (btnGuardarOpcionSimple) {
      btnGuardarOpcionSimple.addEventListener('click', () => agregarOpcion(false));
    }
    if (builderTipo) {
      builderTipo.addEventListener('change', () => {
        ajustarOpcionesPorTipo();
        renderBuilderOpciones();
      });
    }
    if (builderOpcionesLista) {
      builderOpcionesLista.addEventListener('click', manejarAccionOpcion);
    }
    const selectTipoExamen = document.getElementById('examen-tipo');
    if (selectTipoExamen) {
      selectTipoExamen.addEventListener('change', manejarCambioTipoExamen);
    }
  }

  async function cargarCursos() {
    try {
      const cursos = await window.cursosAPI.getAll({ includeTodos: true });
      state.cursos = Array.isArray(cursos) ? cursos : [];
      poblarSelectorCursos();
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      mostrarErrorGlobal('No se pudieron cargar los cursos disponibles.');
    }
  }

  function poblarSelectorCursos() {
    if (!selectCurso) return;
    selectCurso.innerHTML = '<option value="">Selecciona un curso</option>';

    state.cursos.forEach((curso) => {
      const option = document.createElement('option');
      option.value = curso._id;
      option.textContent = curso.titulo;
      selectCurso.appendChild(option);
    });
  }

  async function manejarCambioCurso() {
    limpiarFormularioExamen(true);
    const cursoId = selectCurso.value;
    if (!cursoId) {
      state.cursoSeleccionado = null;
      selectExamen.disabled = true;
      selectExamen.innerHTML = '<option value="">Selecciona un examen</option>';
      return;
    }

    try {
      const curso = await window.cursosAPI.getById(cursoId);
      state.cursoSeleccionado = curso;
      actualizarSelectSecciones();
      poblarSelectorExamenes();
      selectExamen.disabled = false;
    } catch (error) {
      console.error('Error al obtener curso:', error);
      mostrarErrorGlobal('No se pudo cargar la información del curso seleccionado.');
    }
  }

  function actualizarSelectSecciones() {
    const selectSeccion = document.getElementById('examen-seccion');
    if (!selectSeccion) return;
    selectSeccion.innerHTML = '<option value="">Selecciona una sección</option>';

    const secciones = state.cursoSeleccionado?.secciones || [];
    secciones
      .slice()
      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
      .forEach((seccion) => {
        const option = document.createElement('option');
        option.value = seccion._id;
        option.textContent = `${(seccion.orden || 1)}. ${seccion.titulo}`;
        selectSeccion.appendChild(option);
      });
  }

  function poblarSelectorExamenes() {
    selectExamen.innerHTML = '<option value="">Selecciona un examen</option>';
    const examenes = state.cursoSeleccionado?.examenes || [];
    if (!Array.isArray(examenes) || examenes.length === 0) return;

    examenes
      .slice()
      .sort((a, b) => {
        if (a.tipo === b.tipo) return (a.titulo || '').localeCompare(b.titulo || '');
        return a.tipo === 'final' ? 1 : -1;
      })
      .forEach((examen) => {
        const option = document.createElement('option');
        option.value = examen._id;
        const etiqueta = examen.tipo === 'final' ? '[Final]' : '[Sección]';
        const seccion = examen.tipo === 'seccion'
          ? obtenerSeccionPorId(examen.seccion)?.titulo || 'Sin sección'
          : '';
        option.textContent = `${etiqueta} ${examen.titulo}${seccion ? ' - ' + seccion : ''}`;
        selectExamen.appendChild(option);
      });
  }

  function obtenerSeccionPorId(seccionId) {
    if (!state.cursoSeleccionado || !seccionId) return null;
    return (state.cursoSeleccionado.secciones || []).find(sec => sec._id === seccionId || sec._id?.toString() === seccionId?.toString()) || null;
  }

  function manejarCambioExamen() {
    const examenId = selectExamen.value;
    if (!examenId) {
      limpiarFormularioExamen(false);
      return;
    }
    const examen = (state.cursoSeleccionado?.examenes || []).find(ex => ex._id === examenId);
    if (examen) {
      cargarExamenEnFormulario(examen);
    }
  }

  function cargarExamenEnFormulario(examen) {
    state.examenSeleccionado = examen;
    document.getElementById('examen-id').value = examen._id;
    document.getElementById('examen-titulo').value = examen.titulo || '';
    document.getElementById('examen-descripcion').value = examen.descripcion || '';
    document.getElementById('examen-tipo').value = examen.tipo || 'seccion';
    document.getElementById('examen-tiempo').value = Number.isFinite(examen.tiempoLimite) ? examen.tiempoLimite : '';
    document.getElementById('examen-intentos').value = Number.isFinite(examen.intentosPermitidos) ? examen.intentosPermitidos : 2;
    document.getElementById('examen-aprobacion').value = Number.isFinite(examen.porcentajeAprobacion) ? examen.porcentajeAprobacion : 70;

    const selectSeccion = document.getElementById('examen-seccion');
    if (examen.tipo === 'seccion') {
      selectSeccion.disabled = false;
      selectSeccion.value = examen.seccion || '';
    } else {
      selectSeccion.disabled = true;
      selectSeccion.value = '';
    }
    manejarCambioTipoExamen();

    state.preguntas = (examen.preguntas || []).map(normalizarPregunta);
    renderPreguntas();
    mostrarBuilder(false);
    toggleBtnEliminar(true);
  }

  function normalizarPregunta(pregunta) {
    const opciones = Array.isArray(pregunta.opciones)
      ? pregunta.opciones.map(op => ({ texto: op.texto, esCorrecta: !!op.esCorrecta }))
      : [];
    return {
      pregunta: pregunta.pregunta || '',
      tipo: pregunta.tipo || 'opcion_multiple',
      puntos: Number.isFinite(pregunta.puntos) ? pregunta.puntos : 1,
      opciones,
      orden: pregunta.orden
    };
  }

  function limpiarFormularioExamen(resetCurso = false) {
    state.examenSeleccionado = null;
    state.preguntas = [];
    renderPreguntas();
    formExamen.reset();
    document.getElementById('examen-id').value = '';
    document.getElementById('examen-intentos').value = 2;
    document.getElementById('examen-aprobacion').value = 70;
    document.getElementById('examen-tiempo').value = '';
    const selectSeccion = document.getElementById('examen-seccion');
    if (selectSeccion) {
      selectSeccion.disabled = document.getElementById('examen-tipo').value !== 'seccion';
    }
    mostrarBuilder(false);
    toggleBtnEliminar(false);
    if (resetCurso) {
      selectExamen.disabled = true;
      selectExamen.innerHTML = '<option value="">Selecciona un examen</option>';
    } else {
      selectExamen.value = '';
    }
    ocultarAlertaExamen();
    manejarCambioTipoExamen();
  }

  function toggleBtnEliminar(visible) {
    if (!btnEliminarExamen) return;
    if (visible) {
      btnEliminarExamen.classList.remove('d-none');
    } else {
      btnEliminarExamen.classList.add('d-none');
    }
  }

  function renderPreguntas() {
    if (!listaPreguntas) return;

    if (!Array.isArray(state.preguntas) || state.preguntas.length === 0) {
      listaPreguntas.innerHTML = '<p class="text-secondary small mb-0">Aún no se han agregado preguntas.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();

    state.preguntas.forEach((pregunta, index) => {
      const card = document.createElement('div');
      card.className = 'border rounded p-3 mb-2 bg-white';
      const tipoEtiqueta = pregunta.tipo === 'final' ? 'Final' : etiquetaTipoPregunta(pregunta.tipo);
      const opcionesHtml = renderOpcionesPregunta(pregunta);

      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-dark-subtle text-dark">${index + 1}</span>
              <span class="badge bg-primary-subtle text-primary">${tipoEtiqueta}</span>
              <span class="badge bg-secondary-subtle text-secondary">${pregunta.puntos} punto(s)</span>
            </div>
            <div class="fw-semibold mb-1">${pregunta.pregunta}</div>
            ${opcionesHtml}
          </div>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" data-accion="editar" data-index="${index}">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" data-accion="eliminar" data-index="${index}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });

    listaPreguntas.innerHTML = '';
    listaPreguntas.appendChild(fragment);

    listaPreguntas.querySelectorAll('button[data-accion]').forEach((btn) => {
      btn.addEventListener('click', manejarAccionPregunta);
    });
  }

  function renderOpcionesPregunta(pregunta) {
    if (pregunta.tipo === 'texto') {
      return '<div class="text-secondary small fst-italic">Respuesta abierta</div>';
    }
    if (pregunta.tipo === 'verdadero_falso') {
      const correcta = (pregunta.opciones || []).find(op => op.esCorrecta)?.texto || 'Verdadero';
      return `<div class="text-secondary small">Respuesta correcta: <strong>${correcta}</strong></div>`;
    }
    if (!Array.isArray(pregunta.opciones) || pregunta.opciones.length === 0) {
      return '<div class="text-secondary small fst-italic">Sin opciones registradas.</div>';
    }
    const items = pregunta.opciones.map((op) => `
      <li class="list-group-item border-0 p-0 mb-1 text-secondary small">
        ${op.esCorrecta ? '<i class="bi bi-check-circle-fill text-success me-1"></i>' : '<i class="bi bi-circle text-muted me-1"></i>'}
        ${op.texto}
      </li>
    `).join('');
    return `<ul class="list-group list-group-flush mt-2">${items}</ul>`;
  }

  function etiquetaTipoPregunta(tipo) {
    switch (tipo) {
      case 'verdadero_falso':
        return 'Verdadero / Falso';
      case 'texto':
        return 'Respuesta abierta';
      default:
        return 'Opción múltiple';
    }
  }

  function manejarAccionPregunta(event) {
    const accion = event.currentTarget.dataset.accion;
    const index = Number(event.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;

    if (accion === 'editar') {
      abrirBuilder(state.preguntas[index], index);
    } else if (accion === 'eliminar') {
      if (confirm('¿Deseas eliminar esta pregunta?')) {
        state.preguntas.splice(index, 1);
        renderPreguntas();
      }
    }
  }

  function abrirBuilder(pregunta = null, index = null) {
    state.builder.editIndex = index;
    state.builder.opciones = [];

    builderTexto.value = pregunta?.pregunta || '';
    builderPuntos.value = pregunta?.puntos || 1;
    builderTipo.value = pregunta?.tipo || 'opcion_multiple';
    builderTitulo.textContent = index !== null ? 'Editar pregunta' : 'Nueva pregunta';

    if (pregunta?.tipo === 'opcion_multiple') {
      state.builder.opciones = (pregunta.opciones || []).map(op => ({ texto: op.texto, esCorrecta: !!op.esCorrecta }));
    } else if (pregunta?.tipo === 'verdadero_falso') {
      const opciones = pregunta.opciones || [];
      state.builder.opciones = [
        { texto: 'Verdadero', esCorrecta: !!opciones.find(op => op.texto.toLowerCase().includes('verdadero') && op.esCorrecta) },
        { texto: 'Falso', esCorrecta: !!opciones.find(op => op.texto.toLowerCase().includes('falso') && op.esCorrecta) }
      ];
    }

    ajustarOpcionesPorTipo();
    renderBuilderOpciones();
    mostrarBuilder(true);
  }

  function mostrarBuilder(mostrar = true) {
    if (!builderCard) return;
    builderCard.classList.toggle('d-none', !mostrar);
    if (!mostrar) {
      limpiarBuilder();
    }
  }

  function limpiarBuilder() {
    state.builder.editIndex = null;
    state.builder.opciones = [];
    builderTexto.value = '';
    builderPuntos.value = 1;
    builderTipo.value = 'opcion_multiple';
    inputOpcionTexto.value = '';
    ajustarOpcionesPorTipo();
    renderBuilderOpciones();
  }

  function ajustarOpcionesPorTipo() {
    const tipo = builderTipo.value;
    if (tipo === 'opcion_multiple') {
      builderOpcionesWrapper.classList.remove('d-none');
      inputOpcionTexto.disabled = false;
      btnGuardarOpcion.disabled = false;
      btnGuardarOpcionSimple.disabled = false;
      if (state.builder.editIndex === null) {
        state.builder.opciones = [];
      }
    } else if (tipo === 'verdadero_falso') {
      builderOpcionesWrapper.classList.remove('d-none');
      state.builder.opciones = [
        { texto: 'Verdadero', esCorrecta: true },
        { texto: 'Falso', esCorrecta: false }
      ];
      inputOpcionTexto.value = '';
      inputOpcionTexto.disabled = true;
      btnGuardarOpcion.disabled = true;
      btnGuardarOpcionSimple.disabled = true;
    } else {
      builderOpcionesWrapper.classList.add('d-none');
      state.builder.opciones = [];
      inputOpcionTexto.disabled = false;
      btnGuardarOpcion.disabled = false;
      btnGuardarOpcionSimple.disabled = false;
    }
  }

  function agregarOpcion(corregir = false) {
    const texto = inputOpcionTexto.value.trim();
    if (!texto) {
      alert('Escribe el texto de la opción.');
      return;
    }
    if (corregir) {
      state.builder.opciones = state.builder.opciones.map(op => ({ ...op, esCorrecta: false }));
    }
    state.builder.opciones.push({ texto, esCorrecta: corregir });
    inputOpcionTexto.value = '';
    renderBuilderOpciones();
  }

  function renderBuilderOpciones() {
    if (!builderOpcionesLista) return;
    builderOpcionesLista.innerHTML = '';

    const tipo = builderTipo.value;
    if (tipo === 'texto') return;

    if (state.builder.opciones.length === 0) {
      builderOpcionesLista.innerHTML = '<span class="text-secondary small">Aún no hay opciones registradas.</span>';
      return;
    }

    state.builder.opciones.forEach((opcion, index) => {
      const badge = document.createElement('div');
      badge.className = `d-inline-flex align-items-center gap-2 px-3 py-1 border rounded-pill ${opcion.esCorrecta ? 'bg-success text-white' : 'bg-light text-secondary'}`;
      badge.innerHTML = `
        <span>${opcion.texto}</span>
        <div class="btn-group btn-group-sm">
          <button type="button" class="btn btn-outline-${opcion.esCorrecta ? 'light' : 'success'} btn-sm" data-accion="toggle-opcion" data-index="${index}">
            ${opcion.esCorrecta ? '<i class="bi bi-check-circle"></i>' : '<i class="bi bi-check-circle"></i>'}
          </button>
          ${tipo === 'opcion_multiple' ? `<button type="button" class="btn btn-outline-danger btn-sm" data-accion="eliminar-opcion" data-index="${index}"><i class="bi bi-x-lg"></i></button>` : ''}
        </div>
      `;
      builderOpcionesLista.appendChild(badge);
    });
  }

  function manejarAccionOpcion(event) {
    const accion = event.target.closest('[data-accion]')?.dataset.accion;
    if (!accion) return;
    const index = Number(event.target.closest('[data-accion]')?.dataset.index);
    if (Number.isNaN(index)) return;

    if (accion === 'toggle-opcion') {
      state.builder.opciones = state.builder.opciones.map((op, idx) => ({
        ...op,
        esCorrecta: idx === index
      }));
      renderBuilderOpciones();
    } else if (accion === 'eliminar-opcion') {
      state.builder.opciones.splice(index, 1);
      renderBuilderOpciones();
    }
  }

  function guardarPregunta() {
    const texto = builderTexto.value.trim();
    const puntos = Number(builderPuntos.value || 1);
    const tipo = builderTipo.value;

    if (!texto) {
      alert('Escribe el enunciado de la pregunta.');
      return;
    }
    if (puntos <= 0) {
      alert('La puntuación debe ser mayor a cero.');
      return;
    }

    let opciones = [];

    if (tipo === 'opcion_multiple') {
      if (!state.builder.opciones.length) {
        alert('Agrega opciones de respuesta.');
        return;
      }
      if (!state.builder.opciones.some(op => op.esCorrecta)) {
        alert('Marca al menos una opción como correcta.');
        return;
      }
      opciones = state.builder.opciones.map(op => ({ ...op }));
    } else if (tipo === 'verdadero_falso') {
      opciones = state.builder.opciones.map(op => ({ ...op }));
    }

    const pregunta = {
      pregunta: texto,
      tipo,
      puntos,
      opciones
    };

    if (state.builder.editIndex !== null) {
      state.preguntas[state.builder.editIndex] = pregunta;
    } else {
      state.preguntas.push(pregunta);
    }

    renderPreguntas();
    mostrarBuilder(false);
  }

  async function manejarSubmitExamen(event) {
    event.preventDefault();
    ocultarAlertaExamen();

    if (!state.cursoSeleccionado) {
      mostrarErrorExamen('Selecciona un curso para guardar el examen.');
      return;
    }

    if (state.preguntas.length === 0) {
      mostrarErrorExamen('Agrega al menos una pregunta al examen.');
      return;
    }

    const cursoId = state.cursoSeleccionado._id;
    const examenId = document.getElementById('examen-id').value || null;
    const datos = recolectarDatosExamen();

    if (!datos) return;

    try {
      deshabilitarFormulario(true);
      if (examenId) {
        await window.cursosAPI.updateExam(cursoId, examenId, datos);
        mostrarExitoExamen('Examen actualizado correctamente.');
      } else {
        const examenNuevo = await window.cursosAPI.addExam(cursoId, datos);
        document.getElementById('examen-id').value = examenNuevo._id;
        mostrarExitoExamen('Examen creado correctamente.');
      }

      // Recargar curso para actualizar exámenes
      const cursoActualizado = await window.cursosAPI.getById(cursoId);
      state.cursoSeleccionado = cursoActualizado;
      poblarSelectorExamenes();
      selectExamen.disabled = false;

      if (document.getElementById('examen-id').value) {
        selectExamen.value = document.getElementById('examen-id').value;
      }

      renderPreguntas();
      toggleBtnEliminar(true);
    } catch (error) {
      console.error('Error al guardar examen:', error);
      mostrarErrorExamen(error.message || 'No se pudo guardar el examen.');
    } finally {
      deshabilitarFormulario(false);
    }
  }

  function recolectarDatosExamen() {
    const titulo = document.getElementById('examen-titulo').value.trim();
    if (!titulo) {
      mostrarErrorExamen('El examen debe tener un título.');
      return null;
    }

    const tipo = document.getElementById('examen-tipo').value;
    const descripcion = document.getElementById('examen-descripcion').value.trim();
    const tiempoLimite = Number(document.getElementById('examen-tiempo').value || 0);
    const intentosPermitidos = Number(document.getElementById('examen-intentos').value || 1);
    const porcentajeAprobacion = Number(document.getElementById('examen-aprobacion').value || 70);
    const selectSeccion = document.getElementById('examen-seccion');
    const seccion = tipo === 'seccion' ? selectSeccion.value : null;

    if (tipo === 'seccion' && !seccion) {
      mostrarErrorExamen('Selecciona la sección a la que pertenece el examen.');
      return null;
    }

    const preguntas = state.preguntas.map((pregunta, index) => ({
      ...pregunta,
      orden: index + 1
    }));

    return {
      titulo,
      descripcion,
      tipo,
      tiempoLimite,
      intentosPermitidos,
      porcentajeAprobacion,
      seccion,
      preguntas
    };
  }

  function manejarCambioTipoExamen() {
    const tipo = document.getElementById('examen-tipo').value;
    const selectSeccion = document.getElementById('examen-seccion');
    if (!selectSeccion) return;
    if (tipo === 'seccion') {
      selectSeccion.disabled = false;
    } else {
      selectSeccion.disabled = true;
      selectSeccion.value = '';
    }
  }

  async function eliminarExamenActual() {
    const examenId = document.getElementById('examen-id').value;
    if (!examenId || !state.cursoSeleccionado) return;

    if (!confirm('¿Deseas eliminar este examen de manera permanente?')) {
      return;
    }

    try {
      deshabilitarFormulario(true);
      await window.cursosAPI.deleteExam(state.cursoSeleccionado._id, examenId);
      mostrarExitoExamen('El examen se eliminó correctamente.');
      limpiarFormularioExamen(false);

      const cursoActualizado = await window.cursosAPI.getById(state.cursoSeleccionado._id);
      state.cursoSeleccionado = cursoActualizado;
      poblarSelectorExamenes();
    } catch (error) {
      console.error('Error al eliminar examen:', error);
      mostrarErrorExamen('No se pudo eliminar el examen.');
    } finally {
      deshabilitarFormulario(false);
    }
  }

  function deshabilitarFormulario(deshabilitar) {
    formExamen.querySelectorAll('input, select, textarea, button').forEach((el) => {
      if (el === btnRefrescar) return;
      el.disabled = deshabilitar;
    });
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
              La administración de contenidos está disponible exclusivamente para el Administrador DAE.
            </p>
            <a href="index.html" class="btn btn-primary btn-sm">Volver al inicio</a>
          </div>
        </div>
      `;
    }
  }

  function mostrarErrorGlobal(mensaje) {
    if (!alertaGlobal) return;
    alertaGlobal.className = 'alert alert-danger';
    alertaGlobal.classList.remove('d-none');
    alertaGlobal.textContent = mensaje;
  }

  function mostrarErrorExamen(mensaje) {
    if (!alertaExamen) return;
    alertaExamen.className = 'alert alert-danger';
    alertaExamen.classList.remove('d-none');
    alertaExamen.textContent = mensaje;
  }

  function mostrarExitoExamen(mensaje) {
    if (!alertaExamen) return;
    alertaExamen.className = 'alert alert-success';
    alertaExamen.classList.remove('d-none');
    alertaExamen.textContent = mensaje;
    setTimeout(() => {
      if (alertaExamen) alertaExamen.classList.add('d-none');
    }, 5000);
  }

  function ocultarAlertaExamen() {
    if (!alertaExamen) return;
    alertaExamen.classList.add('d-none');
    alertaExamen.textContent = '';
  }
})();

