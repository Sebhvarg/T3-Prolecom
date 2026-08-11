import { authService } from './authService';

export const quizzesService = {
  getQuizzesByCurso: async (idCurso) => {
    return await authService.apiFetch(`/cursos/${idCurso}/quizzes`);
  },

  getQuiz: async (idQuiz) => {
    return await authService.apiFetch(`/quizzes/${idQuiz}`);
  },

  createQuiz: async (idCurso, payload) => {
    return await authService.apiFetch(`/cursos/${idCurso}/quizzes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateQuiz: async (idQuiz, payload) => {
    return await authService.apiFetch(`/quizzes/${idQuiz}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteQuiz: async (idQuiz) => {
    return await authService.apiFetch(`/quizzes/${idQuiz}`, {
      method: 'DELETE',
    });
  },

  enviarIntento: async (idQuiz, payload) => {
    return await authService.apiFetch(`/quizzes/${idQuiz}/intentos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getIntentos: async (idQuiz) => {
    return await authService.apiFetch(`/quizzes/${idQuiz}/intentos`);
  },

  reiniciarIntentos: async (idQuiz, payload = {}) => {
    return await authService.apiFetch(`/quizzes/${idQuiz}/reiniciar-intentos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
