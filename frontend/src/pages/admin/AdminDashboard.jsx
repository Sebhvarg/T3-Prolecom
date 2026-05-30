import React from 'react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { Clock, Users, Database, Shield, ArrowUpRight, AlertTriangle } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Uptime Sistema', value: '99.8%', icon: <Clock size={24} />, color: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Usuarios Activos', value: '187', icon: <Users size={24} />, color: 'bg-slate-50', iconColor: 'text-slate-600' },
    { label: 'Uso Base Datos', value: '42%', icon: <Database size={24} />, color: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Eventos Seguridad', value: '0', icon: <Shield size={24} />, color: 'bg-slate-50', iconColor: 'text-slate-600' },
  ];

  const metrics = [
    { label: 'Tiempo de respuesta promedio', value: '245 ms' },
    { label: 'Solicitudes por minuto', value: '1.247' },
    { label: 'Ancho de banda usado', value: '2.4 GB' },
  ];

  const logs = [
    { title: 'Backup automático completado', time: 'Hace 15 minutos', color: 'bg-blue-600' },
    { title: 'Uso de CPU elevado detectado', time: 'Hace 2 horas', color: 'bg-yellow-500' },
    { title: 'Actualización de Sistema Exitosa', time: 'Hace 4 horas', color: 'bg-green-600' },
  ];

  return (
    <DashboardContainer title="Principal" user={user}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">¡Bienvenido, Francisco!</h2>
        <p className="text-gray-500">Supervisa la seguridad, estabilidad y rendimiento de Prolecom</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color} ${stat.iconColor}`}>
              {stat.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
              <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Métricas de Rendimiento</h3>
          <div className="space-y-4">
            {metrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-800">{m.value}</span>
                  <span className="text-sm text-gray-500">{m.label}</span>
                </div>
                <ArrowUpRight size={20} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Logs del Sistema</h3>
            <AlertTriangle size={20} className="text-yellow-500" />
          </div>
          <div className="space-y-6 flex-1">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${log.color}`}></div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700">{log.title}</span>
                  <span className="text-xs text-gray-400">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Estado de Servicios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Servidor Web', 'Base de Datos', 'Sistema de Archivos'].map((service, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-700">{service}</span>
                <span className="text-xs text-green-600 font-medium">Operacional</span>
              </div>
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            </div>
          ))}
        </div>
      </div>
    </DashboardContainer>
  );
};

export default AdminDashboard;
