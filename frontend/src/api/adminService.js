import { authService } from './authService';

export const adminService = {
  // Obtener lista de usuarios con filtros (SCRUM-60)
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/admin/usuarios${query ? `?${query}` : ''}`;
    return await authService.apiFetch(endpoint);
  },

  // Cambiar rol de un usuario (SCRUM-60)
  updateUserRole: async (idUsuario, idRol) => {
    return await authService.apiFetch(`/admin/usuarios/${idUsuario}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ idRol }),
    });
  },

  // Cambiar estado / deshabilitar cuenta (SCRUM-60)
  updateUserEstado: async (idUsuario, idEstado) => {
    return await authService.apiFetch(`/admin/usuarios/${idUsuario}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ idEstado }),
    });
  },

  // Reseteo de contraseña (SCRUM-60)
  resetUserPassword: async (idUsuario, newPassword) => {
    return await authService.apiFetch(`/admin/usuarios/${idUsuario}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword }),
    });
  },

  // Monitor de salud del sistema y logs (SCRUM-61)
  getHealthLogs: async () => {
    return await authService.apiFetch('/admin/logs');
  },
};
