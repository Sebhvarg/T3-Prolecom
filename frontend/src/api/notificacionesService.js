import { authService } from './authService';

export const notificacionesService = {
  /**
   * Obtener notificaciones del usuario autenticado (paginadas)
   */
  getNotificaciones: async (page = 1) => {
    return await authService.apiFetch(`/notificaciones?page=${page}`);
  },

  /**
   * Marcar una notificación como leída
   */
  marcarLeida: async (idNotificacion) => {
    return await authService.apiFetch(`/notificaciones/${idNotificacion}/leer`, {
      method: 'PATCH',
    });
  },

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasLeidas: async () => {
    return await authService.apiFetch('/notificaciones/leer-todas', {
      method: 'PATCH',
    });
  },

  /**
   * Eliminar (limpiar) todas las notificaciones del usuario
   */
  limpiarTodas: async () => {
    return await authService.apiFetch('/notificaciones', {
      method: 'DELETE',
    });
  },
};
