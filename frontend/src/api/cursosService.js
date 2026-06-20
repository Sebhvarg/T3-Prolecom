import { authService } from './authService';

export const cursosService = {
  getCursos: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await authService.apiFetch(`/cursos${query ? '?' + query : ''}`);
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
  },

  inscribirCurso: async (id) => {
    return await authService.apiFetch(`/cursos/${id}/inscribir`, {
      method: 'POST',
    });
  },

  desmatricularCurso: async (id, idUsuarioEstudiante = null) => {
    const options = { method: 'DELETE' };
    if (idUsuarioEstudiante) {
      options.body = JSON.stringify({ idUsuarioEstudiante });
    }
    return await authService.apiFetch(`/cursos/${id}/desmatricular`, options);
  },

  getEstudiantesMatriculados: async (id) => {
    return await authService.apiFetch(`/cursos/${id}/estudiantes`);
  },

  matricularManual: async (id, email) => {
    return await authService.apiFetch(`/cursos/${id}/matricular-manual`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getEstudiantesSistema: async () => {
    return await authService.apiFetch('/estudiantes');
  },

  // Gestión de Temas (Módulos)
  createTema: async (cursoId, temaData) => {
    return await authService.apiFetch(`/cursos/${cursoId}/temas`, {
      method: 'POST',
      body: JSON.stringify(temaData),
    });
  },

  updateTema: async (id, temaData) => {
    return await authService.apiFetch(`/temas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(temaData),
    });
  },

  deleteTema: async (id) => {
    return await authService.apiFetch(`/temas/${id}`, {
      method: 'DELETE',
    });
  },

  // Gestión de Materiales (PDF / Video)
  createMaterial: async (temaId, formData) => {
    return await authService.apiFetch(`/temas/${temaId}/materiales`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteMaterial: async (id) => {
    return await authService.apiFetch(`/materiales/${id}`, {
      method: 'DELETE',
    });
  },

  getLenguajes: async () => {
    return await authService.apiFetch('/lenguajes');
  }
};
