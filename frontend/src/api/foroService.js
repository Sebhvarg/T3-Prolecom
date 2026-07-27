import { authService } from './authService';

export const foroService = {
  // ─────────────────────────────────────────────────────────────────
  // FOROS (Itemable — espacio de discusión por tema)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Crear un nuevo foro dentro de un tema (Admin, Profesor, Ayudante)
   */
  createForo: async (idTema, foroData) => {
    return await authService.apiFetch(`/temas/${idTema}/foros`, {
      method: 'POST',
      body: JSON.stringify(foroData),
    });
  },

  /**
   * Obtener detalle de un foro
   */
  getForo: async (idForo) => {
    return await authService.apiFetch(`/foros/${idForo}`);
  },

  /**
   * Editar un foro
   */
  updateForo: async (idForo, foroData) => {
    return await authService.apiFetch(`/foros/${idForo}`, {
      method: 'PUT',
      body: JSON.stringify(foroData),
    });
  },

  /**
   * Eliminar un foro
   */
  deleteForo: async (idForo) => {
    return await authService.apiFetch(`/foros/${idForo}`, {
      method: 'DELETE',
    });
  },

  /**
   * Cambiar estado del foro: abierto ↔ cerrado
   */
  toggleEstadoForo: async (idForo) => {
    return await authService.apiFetch(`/foros/${idForo}/estado`, {
      method: 'PATCH',
    });
  },

  // ─────────────────────────────────────────────────────────────────
  // PREGUNTAS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Obtener todas las preguntas de un foro
   */
  getPreguntasForo: async (idForo) => {
    return await authService.apiFetch(`/foros/${idForo}/preguntas`);
  },

  /**
   * Crear una nueva pregunta en un foro
   */
  createPregunta: async (idForo, preguntaData) => {
    return await authService.apiFetch(`/foros/${idForo}/preguntas`, {
      method: 'POST',
      body: JSON.stringify(preguntaData),
    });
  },

  /**
   * Obtener detalle de una pregunta con sus respuestas y votos
   */
  getPreguntaDetalle: async (idPregunta) => {
    return await authService.apiFetch(`/preguntas/${idPregunta}`);
  },

  /**
   * Editar una pregunta
   */
  updatePregunta: async (idPregunta, preguntaData) => {
    return await authService.apiFetch(`/preguntas/${idPregunta}`, {
      method: 'PUT',
      body: JSON.stringify(preguntaData),
    });
  },

  /**
   * Eliminar una pregunta
   */
  deletePregunta: async (idPregunta) => {
    return await authService.apiFetch(`/preguntas/${idPregunta}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fijar / Desfijar una pregunta al tope del foro (PIN)
   */
  toggleFijarPregunta: async (idPregunta) => {
    return await authService.apiFetch(`/preguntas/${idPregunta}/fijar`, {
      method: 'PATCH',
    });
  },

  /**
   * Ocultar / Mostrar una pregunta
   */
  toggleEstadoPregunta: async (idPregunta) => {
    return await authService.apiFetch(`/preguntas/${idPregunta}/estado`, {
      method: 'PATCH',
    });
  },

  /**
   * Reportar una pregunta por contenido inapropiado
   */
  reportarPregunta: async (idPregunta, reporteData) => {
    return await authService.apiFetch(`/preguntas/${idPregunta}/reportar`, {
      method: 'POST',
      body: JSON.stringify(reporteData),
    });
  },

  // ─────────────────────────────────────────────────────────────────
  // RESPUESTAS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Publicar una respuesta a una pregunta
   */
  createRespuesta: async (idPregunta, respuestaData) => {
    return await authService.apiFetch(`/preguntas/${idPregunta}/respuestas`, {
      method: 'POST',
      body: JSON.stringify(respuestaData),
    });
  },

  /**
   * Editar una respuesta
   */
  updateRespuesta: async (idRespuesta, respuestaData) => {
    return await authService.apiFetch(`/respuestas/${idRespuesta}`, {
      method: 'PUT',
      body: JSON.stringify(respuestaData),
    });
  },

  /**
   * Eliminar una respuesta
   */
  deleteRespuesta: async (idRespuesta) => {
    return await authService.apiFetch(`/respuestas/${idRespuesta}`, {
      method: 'DELETE',
    });
  },

  /**
   * Validar / Desvalidar una respuesta como Oficial (PB16 RBAC)
   */
  toggleValidarRespuesta: async (idRespuesta, validadaState = null) => {
    const bodyPayload = validadaState !== null ? { validada: validadaState } : {};
    return await authService.apiFetch(`/respuestas/${idRespuesta}/validar`, {
      method: 'PUT',
      body: JSON.stringify(bodyPayload),
    });
  },

  /**
   * Reportar una respuesta por contenido inapropiado
   */
  reportarRespuesta: async (idRespuesta, reporteData) => {
    return await authService.apiFetch(`/respuestas/${idRespuesta}/reportar`, {
      method: 'POST',
      body: JSON.stringify(reporteData),
    });
  },

  // ─────────────────────────────────────────────────────────────────
  // VOTOS (LIKES / DISLIKES)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Votar una respuesta (tipo: 'like' | 'dislike')
   * Mismo tipo → toggle / quita voto
   * Tipo contrario → cambia voto
   */
  votarRespuesta: async (idRespuesta, tipo) => {
    return await authService.apiFetch(`/respuestas/${idRespuesta}/votar`, {
      method: 'POST',
      body: JSON.stringify({ tipo }),
    });
  },
};
