import { authService } from './authService';

export const desafiosService = {
  getDesafiosByTema: async (idTema) => {
    return await authService.apiFetch(`/temas/${idTema}/desafios`);
  },

  getDesafio: async (id) => {
    return await authService.apiFetch(`/desafios/${id}`);
  },

  createDesafio: async (idTema, desafioData) => {
    return await authService.apiFetch(`/temas/${idTema}/desafios`, {
      method: 'POST',
      body: JSON.stringify(desafioData),
    });
  },

  updateDesafio: async (id, desafioData) => {
    return await authService.apiFetch(`/desafios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(desafioData),
    });
  },

  deleteDesafio: async (id) => {
    return await authService.apiFetch(`/desafios/${id}`, {
      method: 'DELETE',
    });
  },

  enviarSolucion: async (idDesafio, codigoFuente, idLenguaje) => {
    return await authService.apiFetch(`/desafios/${idDesafio}/soluciones`, {
      method: 'POST',
      body: JSON.stringify({ codigoFuente, idLenguaje }),
    });
  },

  getIntentos: async (idDesafio) => {
    return await authService.apiFetch(`/desafios/${idDesafio}/soluciones`);
  }
};
