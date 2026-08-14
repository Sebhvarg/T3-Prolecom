import { useState, useEffect } from 'react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { Clock, Users, Database, Shield, BookOpen, Activity, UserCheck, LifeBuoy } from 'lucide-react';

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

const SoporteDashboard = () => {
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
        console.error("Error cargando dashboard de soporte:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardContainer title="Panel de Soporte Técnico" user={user}>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <LifeBuoy className="text-blue-600" size={28} />
            ¡Bienvenido, {user?.nombreCompleto || user?.usuario?.toUpperCase() || 'Soporte'}!
          </h2>
          <p className="text-gray-500 text-sm">
            Herramientas de atención al usuario, gestión de cuentas y monitoreo del sistema
          </p>
        </div>

        {/* Pestañas de navegación interna */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCheck size={16} /> Gestión de Cuentas
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'health'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity size={16} /> Estado del Sistema & Logs
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas de Estadísticas Globales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Shield size={20} className="text-blue-600" /> Soporte & Gestión de Cuentas
                </h3>
                <p className="text-xs text-gray-500">
                  Asistencia a usuarios, restablecimiento de contraseñas y habilitación de accesos.
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

export default SoporteDashboard;
