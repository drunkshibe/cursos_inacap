(function () {
  const MANAGER_ID = 'admin-video-manager';
  const FEEDBACK_ID = 'admin-video-feedback';
  const ACCEPTED_FORMATS = 'video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v';

  let cursos = [];
  let managerEl;
  let feedbackEl;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    managerEl = document.getElementById(MANAGER_ID);
    feedbackEl = document.getElementById(FEEDBACK_ID);

    if (!managerEl) return;

    if (!window.auth) {
      setFeedback('El módulo de autenticación no está disponible.', 'danger');
      return;
    }

    try {
      await window.auth.init();
      const usuario = window.auth.obtenerUsuario ? window.auth.obtenerUsuario() : null;

      if (!usuario) {
        renderAccessMessage('Inicia sesión para administrar los videos de los cursos.', 'warning');
        return;
      }

      if (usuario.rol !== 'admin_dae') {
        renderAccessMessage('Solo el Administrador DAE puede gestionar los videos de los cursos.', 'warning');
        return;
      }

      await cargarCursos();
    } catch (error) {
      console.error('Error al inicializar el gestor de videos:', error);
      setFeedback('No se pudieron cargar los cursos. Intenta nuevamente.', 'danger');
      renderAccessMessage('Error al cargar el gestor de videos.', 'danger');
    }
  }

  async function cargarCursos() {
    limpiarFeedback();
    if (managerEl) {
      managerEl.innerHTML = `
        <div class="text-center py-5 text-muted small">
          <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
          Cargando cursos...
        </div>
      `;
    }

    try {
      cursos = await window.cursosAPI.getAll({ includeTodos: true });
      renderCursos();
    } catch (error) {
      console.error('Error al obtener cursos:', error);
      setFeedback('No se pudieron cargar los cursos. Verifica tu conexión e intenta nuevamente.', 'danger');
      if (managerEl) {
        managerEl.innerHTML = '';
      }
    }
  }

  function renderCursos() {
    if (!managerEl) return;

    limpiarFeedback();

    if (!Array.isArray(cursos) || cursos.length === 0) {
      managerEl.innerHTML = `<div class="alert alert-info small">No hay cursos publicados todavía.</div>`;
      return;
    }

    managerEl.innerHTML = '';

    cursos.forEach((curso, index) => {
      const item = crearItemCurso(curso, index);
      managerEl.appendChild(item);
    });
  }

  function crearItemCurso(curso, index) {
    const item = document.createElement('div');
    item.className = 'accordion-item mb-3 border-0 shadow-sm rounded overflow-hidden';

    const headerId = `video-manager-heading-${curso._id}`;
    const collapseId = `video-manager-collapse-${curso._id}`;

    item.innerHTML = `
      <h2 class="accordion-header" id="${headerId}">
        <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button"
                data-bs-toggle="collapse" data-bs-target="#${collapseId}"
                aria-expanded="${index === 0}" aria-controls="${collapseId}">
          ${curso.titulo}
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
           aria-labelledby="${headerId}" data-bs-parent="#${MANAGER_ID}">
        <div class="accordion-body">
          <div class="small text-secondary mb-3">${curso.descripcion || 'Sin descripción'}</div>
        </div>
      </div>
    `;

    const body = item.querySelector('.accordion-body');
    body.appendChild(crearListadoSecciones(curso));

    return item;
  }

  function crearListadoSecciones(curso) {
    const wrapper = document.createElement('div');
    const secciones = Array.isArray(curso.secciones) ? curso.secciones.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0)) : [];

    if (secciones.length === 0) {
      wrapper.innerHTML = `<div class="alert alert-light small mb-0">Este curso aún no tiene secciones configuradas.</div>`;
      return wrapper;
    }

    secciones.forEach((seccion, index) => {
      wrapper.appendChild(crearCardSeccion(curso, seccion, index));
    });

    return wrapper;
  }

  function crearCardSeccion(curso, seccion, index) {
    const card = document.createElement('div');
    card.className = 'mb-4 border rounded';

    card.innerHTML = `
      <div class="bg-light px-3 py-2 border-bottom">
        <div class="d-flex flex-column flex-lg-row justify-content-between">
          <div>
            <strong>${index + 1}. ${seccion.titulo}</strong>
            <div class="text-secondary small">${seccion.descripcion || 'Sin descripción'}</div>
          </div>
          <div class="text-secondary small mt-2 mt-lg-0">
            ${seccion.lecciones?.length || 0} módulo(s)
          </div>
        </div>
      </div>
    `;

    const listGroup = document.createElement('div');
    listGroup.className = 'list-group list-group-flush';

    const lecciones = Array.isArray(seccion.lecciones)
      ? seccion.lecciones.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0))
      : [];

    if (lecciones.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-group-item small text-secondary';
      empty.textContent = 'Esta sección aún no tiene lecciones.';
      listGroup.appendChild(empty);
    } else {
      lecciones.forEach((leccion, idx) => {
        listGroup.appendChild(crearItemLeccion(curso, seccion, leccion, idx));
      });
    }

    card.appendChild(listGroup);
    return card;
  }

  function crearItemLeccion(curso, seccion, leccion, index) {
    const item = document.createElement('div');
    item.className = 'list-group-item';

    const videoUrl = normalizarRutaMedia(leccion.urlVideo, 'video');
    const tieneVideo = Boolean(videoUrl);

    item.innerHTML = `
      <div class="d-flex flex-column flex-xl-row align-items-xl-center gap-3">
        <div class="flex-grow-1">
          <div class="d-flex align-items-start gap-2">
            <span class="badge bg-dark-subtle text-dark">${index + 1}</span>
            <div>
              <div class="fw-semibold">${leccion.titulo}</div>
              <div class="small text-secondary">${leccion.descripcion || 'Sin descripción'}</div>
            </div>
          </div>
          ${tieneVideo
            ? `<div class="small mt-2">
                  <span class="badge bg-success-subtle text-success me-2">Video disponible</span>
                  <a href="${videoUrl}" target="_blank" rel="noopener" class="text-decoration-none">Ver video</a>
               </div>`
            : `<div class="small mt-2 text-warning">
                 <span class="badge bg-warning text-dark me-2">Pendiente</span>
                 Esta lección aún no tiene video.
               </div>`}
        </div>
        <form class="d-flex flex-column flex-md-row align-items-md-center gap-2 video-upload-form"
              data-curso="${curso._id}" data-seccion="${seccion._id}" data-leccion="${leccion._id}">
          <input type="file" accept="${ACCEPTED_FORMATS}" class="form-control form-control-sm" name="video" required>
          <button type="submit" class="btn btn-primary btn-sm">Subir video</button>
          <div class="small text-muted estado-subida"></div>
        </form>
      </div>
    `;

    const form = item.querySelector('form');
    const estado = item.querySelector('.estado-subida');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const archivo = form.querySelector('input[type="file"]').files[0];
      if (!archivo) {
        estado.textContent = 'Selecciona un archivo de video.';
        estado.className = 'small text-danger estado-subida';
        return;
      }

      estado.textContent = 'Subiendo video...';
      estado.className = 'small text-primary estado-subida';

      const payload = {
        titulo: leccion.titulo,
        descripcion: leccion.descripcion || '',
        contenido: leccion.contenido || '',
        orden: leccion.orden,
        tipo: 'video'
      };

      try {
        await window.cursosAPI.updateLeccion(
          curso._id,
          seccion._id,
          leccion._id,
          payload,
          archivo,
          null,
          null
        );

        estado.textContent = 'Video actualizado correctamente.';
        estado.className = 'small text-success estado-subida';

        await cargarCursos();
      } catch (error) {
        console.error('Error al subir video:', error);
        estado.textContent = 'Error al subir el video.';
        estado.className = 'small text-danger estado-subida';
      }
    });

    return item;
  }

  function renderAccessMessage(message, type = 'warning') {
    if (!managerEl) return;
    managerEl.innerHTML = `<div class="alert alert-${type} small mb-0">${message}</div>`;
  }

  function setFeedback(message, type = 'warning') {
    if (!feedbackEl) return;
    feedbackEl.classList.remove('d-none', 'alert-warning', 'alert-danger', 'alert-success', 'alert-info');
    feedbackEl.classList.add(`alert-${type}`);
    feedbackEl.textContent = message;
  }

  function limpiarFeedback() {
    if (!feedbackEl) return;
    feedbackEl.classList.add('d-none');
    feedbackEl.classList.remove('alert-warning', 'alert-danger', 'alert-success', 'alert-info');
    feedbackEl.textContent = '';
  }

  function normalizarRutaMedia(url, tipo) {
    if (!url || typeof url !== 'string') return url;
    if (tipo === 'video' && url.startsWith('/uploads/videos/')) {
      return url.replace('/uploads/videos/', '/api/media/videos/');
    }
    if (tipo === 'audio' && url.startsWith('/uploads/audios/')) {
      return url.replace('/uploads/audios/', '/api/media/audios/');
    }
    return url;
  }
})();

