import { useState, useEffect } from 'react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { Clock, Users, Database, Shield, BookOpen, Activity, UserCheck } from 'lucide-react';

import StatCard from '../../components/dashboard/StatCard';
import { getAdminDashboardData } from '../../api/dashboardService';
import UserManagementTable from '../../components/admin/UserManagementTable';
import SystemHealthMonitor from '../../components/admin/SystemHealthMonitor';

const ICON_MAP = {
  'Clock': <Clock size={24} />,
  'Users': <Users size={24} />,
  'Database': <Database size={24} />,
  'Shield': <Shield size={24} />,
  'BookOpen': <BookOpen size={24} />,
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ stats: [], logs: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'health'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAdminDashboardData();
        setData(result);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardContainer title="Panel de Administración y Soporte" user={user}>
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            ¡Bienvenido, {user?.nombreCompleto || user?.usuario?.toUpperCase() || 'Administrador'}!
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Herramientas de soporte, gestión de usuarios y monitoreo de salud del sistema
          </p>
        </div>

        {/* Pestañas de navegación interna */}
        <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck size={15} /> Gestión de Usuarios
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity size={15} /> Salud & Logs del Sistema
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-700"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas de Estadísticas Globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {data.stats.map((stat) => (
              <StatCard
                key={stat.id}
                label={stat.label}
                value={stat.value}
                icon={ICON_MAP[stat.icon]}
                color={stat.color}
                iconColor={stat.iconColor}
              />
            ))}
          </div>

          {/* Renderizado condicional de Pestañas */}
          {activeTab === 'users' ? (
            <div>
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Administración de Cuentas de Usuario
                </h3>
                <p className="text-xs text-slate-500">
                  Modifica roles, cambia estado de cuenta (activar/deshabilitar) y restablece contraseñas.
                </p>
              </div>
              <UserManagementTable />
            </div>
          ) : (
            <SystemHealthMonitor />
          )}
        </>
      )}
    </DashboardContainer>
  );
};

export default AdminDashboard;
