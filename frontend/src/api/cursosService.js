import { authService } from './authService';

export const cursosService = {
  getCursos: async () => {
    return await authService.apiFetch('/cursos');
  },

  getCurso: async (id) => {
    return await authService.apiFetch(`/cursos/${id}`);
  },

  createCurso: async (cursoData) => {
    return await authService.apiFetch('/cursos', {
      method: 'POST',
      body: JSON.stringify(cursoData),
    });
  },

  updateCurso: async (id, cursoData) => {
    return await authService.apiFetch(`/cursos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cursoData),
    });
  },

  deleteCurso: async (id) => {
    return await authService.apiFetch(`/cursos/${id}`, {
      method: 'DELETE',
    });
  }
};
