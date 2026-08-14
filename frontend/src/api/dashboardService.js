import { authService } from './authService';
import { adminService } from './adminService';

export const getAdminDashboardData = async () => {
  let usuariosActivosCount = 0;
  let cursosCount = 0;
  let usuariosTotalesCount = 0;
  let healthLogsData = { health: {}, summary: {}, logs: [] };

  try {
    const [usuariosActivosRes, usuariosListRes, cursosRes, logsRes] = await Promise.all([
      authService.apiFetch('/usuarios/activos').catch(() => ({ count: 0 })),
      adminService.getUsers().catch(() => ({ users: [] })),
      authService.apiFetch('/cursos/total').catch(() => ({ count: 0 })),
      adminService.getHealthLogs().catch(() => ({ health: {}, summary: {}, logs: [] })),
    ]);

    usuariosActivosCount = usuariosActivosRes?.count ?? 0;
    usuariosTotalesCount = usuariosListRes?.users?.length ?? 0;
    cursosCount = cursosRes?.count ?? 0;
    healthLogsData = logsRes || {};
  } catch (error) {
    console.error('Error cargando datos del dashboard:', error);
  }

  return {
    stats: [
      { id: 1, label: 'Usuarios Activos', value: usuariosActivosCount, icon: 'Users', color: 'bg-slate-50 border-slate-200/80', iconColor: 'text-slate-700' },
      { id: 2, label: 'Total Registrados', value: usuariosTotalesCount, icon: 'Users', color: 'bg-slate-50 border-slate-200/80', iconColor: 'text-slate-700' },
      { id: 3, label: 'Cursos Totales', value: cursosCount, icon: 'BookOpen', color: 'bg-slate-50 border-slate-200/80', iconColor: 'text-slate-700' },
      { id: 4, label: 'Estado Base Datos', value: healthLogsData.health?.database || 'OK', icon: 'Database', color: 'bg-slate-50 border-slate-200/80', iconColor: 'text-slate-700' },
    ],
    health: healthLogsData.health || {},
    summary: healthLogsData.summary || { errors: 0, warnings: 0, info: 0, total: 0 },
    logs: healthLogsData.logs || [],
  };
};
