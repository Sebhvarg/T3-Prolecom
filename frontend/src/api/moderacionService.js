import { authService } from './authService';

export const moderacionService = {
  /**
   * Obtener métricas y estadísticas de moderación
   */
  getStats: async () => {
    return await authService.apiFetch('/moderacion/stats');
  },

  /**
   * Listar publicaciones y contenidos reportados
   */
  getReportes: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.estado) query.append('estado', params.estado);
    if (params.tipo) query.append('tipo', params.tipo);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await authService.apiFetch(`/moderacion/reportes${queryString}`);
  },

  /**
   * Marcar reporte como resuelto
   */
  resolverReporte: async (idReporte) => {
    return await authService.apiFetch(`/moderacion/reportes/${idReporte}/resolver`, {
      method: 'POST',
    });
  },

  /**
   * Ocultar o restaurar publicación reportada
   */
  ocultarPublicacion: async (idReporte) => {
    return await authService.apiFetch(`/moderacion/reportes/${idReporte}/ocultar`, {
      method: 'POST',
    });
  },

  /**
   * Banear o suspender usuario infractor
   */
  banearUsuario: async (idUsuario, idEstado = 4) => {
    return await authService.apiFetch(`/moderacion/usuarios/${idUsuario}/banear`, {
      method: 'POST',
      body: JSON.stringify({ idEstado }),
    });
  },

  /**
   * Obtener registro de auditoría del sistema
   */
  getAuditoria: async () => {
    return await authService.apiFetch('/moderacion/auditoria');
  },
};
