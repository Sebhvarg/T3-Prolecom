export const getAdminDashboardData = async () => {
  // Simulamos un pequeño retraso de red (500ms)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        stats: [
          { id: 1, label: 'Uptime Sistema', value: '99.8%', icon: 'Clock', color: 'bg-blue-50', iconColor: 'text-blue-600' },
          { id: 2, label: 'Usuarios Activos', value: '187', icon: 'Users', color: 'bg-slate-50', iconColor: 'text-slate-600' },
          { id: 3, label: 'Uso Base Datos', value: '42%', icon: 'Database', color: 'bg-blue-50', iconColor: 'text-blue-600' },
          { id: 4, label: 'Eventos Seguridad', value: '0', icon: 'Shield', color: 'bg-slate-50', iconColor: 'text-slate-600' },
        ],
        metrics: [
          { id: 1, label: 'Tiempo de respuesta promedio', value: '245 ms' },
          { id: 2, label: 'Solicitudes por minuto', value: '1.247' },
          { id: 3, label: 'Ancho de banda usado', value: '2.4 GB' },
        ],
        logs: [
          { id: 1, title: 'Backup automático completado', time: 'Hace 15 minutos', color: 'bg-blue-600' },
          { id: 2, title: 'Uso de CPU elevado detectado', time: 'Hace 2 horas', color: 'bg-yellow-500' },
          { id: 3, title: 'Actualización de Sistema Exitosa', time: 'Hace 4 horas', color: 'bg-green-600' },
        ],
        services: [
          { id: 1, name: 'Servidor Web', status: 'Operacional' },
          { id: 2, name: 'Base de Datos', status: 'Operacional' },
          { id: 3, name: 'Sistema de Archivos', status: 'Operacional' },
        ]
      });
    }, 500);
  });
};
