import { useState } from 'react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { Clock, Users, Database, Shield, BookOpen, Activity, UserCheck } from 'lucide-react';

import StatCard from '../../components/dashboard/StatCard';
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData';
import UserManagementTable from '../../components/admin/UserManagementTable';
import SystemHealthMonitor from '../../components/admin/SystemHealthMonitor';

const ICON_MAP = {
  Clock: <Clock size={24} />,
  Users: <Users size={24} />,
  Database: <Database size={24} />,
  Shield: <Shield size={24} />,
  BookOpen: <BookOpen size={24} />,
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { data, loading } = useAdminDashboardData();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'health'

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

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck size={16} />
            <span>Gestión de Usuarios</span>
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
            <Activity size={16} />
            <span>Salud del Sistema & Logs</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mb-3" />
          <p className="text-xs font-medium text-slate-500">Cargando métricas de administración...</p>
        </div>
      ) : (
        <>
          {/* Métricas Globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {data.stats.map((stat) => (
              <StatCard
                key={stat.id}
                label={stat.label}
                value={stat.value}
                icon={ICON_MAP[stat.icon]}
                color="bg-white border border-slate-200/80 shadow-2xs"
                iconColor="text-slate-800"
              />
            ))}
          </div>

          {/* Vistas según Tab activo */}
          {activeTab === 'users' ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield size={16} className="text-slate-700" /> Control de Acceso y Gestión de Cuentas
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Filtre por rol o estado, modifique asignaciones, deshabilite cuentas o restablezca contraseñas.
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
