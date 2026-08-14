import { useState, useEffect } from 'react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { Clock, Users, Database, Shield, BookOpen, UserCheck, Activity, LifeBuoy } from 'lucide-react';

import StatCard from '../../components/dashboard/StatCard';
import { getAdminDashboardData } from '../../api/dashboardService';
import UserManagementTable from '../../components/admin/UserManagementTable';
import SystemHealthMonitor from '../../components/admin/SystemHealthMonitor';

const ICON_MAP = {
  'Clock': <Clock size={22} />,
  'Users': <Users size={22} />,
  'Database': <Database size={22} />,
  'Shield': <Shield size={22} />,
  'BookOpen': <BookOpen size={22} />,
};

const SoporteDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ stats: [], logs: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

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
    <DashboardContainer title="Panel de Soporte Técnico y Atención" user={user}>
      <div className="space-y-6">
        {/* Banner Encabezado Sobrio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80">
              <LifeBuoy size={26} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Panel de Atención y Soporte Técnico
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ¡Bienvenido, <strong className="text-slate-800 font-semibold">{user?.nombreCompleto || user?.usuario?.toUpperCase() || 'Soporte'}</strong>! Herramientas de atención a cuentas y diagnóstico del sistema.
              </p>
            </div>
          </div>

          {/* Segmented Control Tabs */}
          <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck size={15} />
              <span>Gestión de Cuentas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('health')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'health'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity size={15} />
              <span>Estado del Sistema & Logs</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mb-3" />
            <p className="text-xs font-medium text-slate-500">Cargando métricas de soporte...</p>
          </div>
        ) : (
          <>
            {/* Tarjetas de Estadísticas Sobrias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.stats.map((stat) => (
                <StatCard
                  key={stat.id}
                  label={stat.label}
                  value={stat.value}
                  icon={ICON_MAP[stat.icon]}
                  color="bg-white border border-slate-200/80 shadow-2xs"
                  iconColor="text-slate-700"
                />
              ))}
            </div>

            {/* Vista según pestaña */}
            {activeTab === 'users' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Shield size={16} className="text-slate-700" /> Atenciones de Cuentas y Soporte
                    </h3>
                    <p className="text-xs text-slate-500 font-normal">
                      Ciclo de vida de usuarios, restablecimiento seguro de claves y gestión de estados de acceso.
                    </p>
                  </div>
                </div>
                <UserManagementTable />
              </div>
            ) : (
              <SystemHealthMonitor />
            )}
          </>
        )}
      </div>
    </DashboardContainer>
  );
};

export default SoporteDashboard;
