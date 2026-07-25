import { authService } from './authService';

export const foroService = {
  /**
   * Obtener todas las preguntas de un curso
   */
  getPreguntasCurso: async (idCurso) => {
    return await authService.apiFetch(`/cursos/${idCurso}/preguntas`);
  },

  /**
   * Crear una nueva pregunta en un curso
   */
  createPregunta: async (idCurso, preguntaData) => {
    return await authService.apiFetch(`/cursos/${idCurso}/preguntas`, {
      method: 'POST',
      body: JSON.stringify(preguntaData),
    });
  },

  /**
   * Obtener detalle de una pregunta con sus respuestas
   */
  getPreguntaDetalle: async (idPregunta) => {
    return await authService.apiFetch(`/preguntas/${idPregunta}`);
  },

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
   * Alternar / Modificar el estado de validación de una respuesta (PB16 RBAC)
   */
  toggleValidarRespuesta: async (idRespuesta, validadaState = null) => {
    const bodyPayload = validadaState !== null ? { validada: validadaState } : {};
    return await authService.apiFetch(`/respuestas/${idRespuesta}/validar`, {
      method: 'PUT',
      body: JSON.stringify(bodyPayload),
    });
  },
};
