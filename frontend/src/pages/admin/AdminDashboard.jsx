import { useState, useEffect } from 'react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { Clock, Users, Database, Shield, AlertTriangle, BookOpen } from 'lucide-react';

import StatCard from '../../components/dashboard/StatCard';
import LogItem from '../../components/dashboard/LogItem';
import { getAdminDashboardData } from '../../api/dashboardService';

// Mapa de iconos para renderizarlos dinámicamente como componentes
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
    <DashboardContainer title="Principal" user={user}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">¡Bienvenido, {user?.nombreCompleto || user?.usuario?.toUpperCase() || 'Administrador'}!</h2>
        <p className="text-gray-500">Supervisa la seguridad, estabilidad y rendimiento de Prolecom</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
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

          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Logs del Sistema</h3>
              <AlertTriangle size={20} className="text-yellow-500" />
            </div>
            <div className="space-y-6">
              {data.logs.map((log) => (
                <LogItem key={log.id} title={log.title} time={log.time} color={log.color} />
              ))}
            </div>
          </div>

        </>
      )}
    </DashboardContainer>
  );
};

export default AdminDashboard;
