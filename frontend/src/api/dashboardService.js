import { authService } from './authService';

export const getAdminDashboardData = async () => {
  // Obtener datos reales desde la API en paralelo
  let usuariosActivosCount = '—';
  let cursosCount = '—';

  try {
    const [usuariosData, cursosData] = await Promise.all([
      authService.apiFetch('/usuarios/activos'),
      authService.apiFetch('/cursos/total'),
    ]);
    usuariosActivosCount = usuariosData?.count ?? '—';
    cursosCount = cursosData?.count ?? '—';
  } catch (error) {
    console.error('Error cargando datos del dashboard:', error);
  }

  return {
    stats: [
      { id: 2, label: 'Usuarios Activos', value: usuariosActivosCount, icon: 'Users', color: 'bg-slate-50', iconColor: 'text-slate-600' },
      { id: 1, label: 'Cursos Totales', value: cursosCount, icon: 'BookOpen', color: 'bg-green-50', iconColor: 'text-green-600' },
      { id: 3, label: 'Uso Base Datos', value: '42%', icon: 'Database', color: 'bg-blue-50', iconColor: 'text-blue-600' },
  
    ],
    logs: [
      { id: 1, title: 'Backup automático completado', time: 'Hace 15 minutos', color: 'bg-blue-600' },
      { id: 2, title: 'Uso de CPU elevado detectado', time: 'Hace 2 horas', color: 'bg-yellow-500' },
      { id: 3, title: 'Actualización de Sistema Exitosa', time: 'Hace 4 horas', color: 'bg-green-600' },
    ],
  };
};
