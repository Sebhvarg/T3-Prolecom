import React from 'react';
import AdminDashboard from './admin/AdminDashboard';
import StudentDashboard from './estudiante/StudentDashboard';
import { useAuth } from '../context/AuthContext';

/**
 * Patrón Factory Method (En React): 
 * Este componente actúa como fábrica. Evalúa el contexto del usuario (su rol)
 * y devuelve (renderiza) el Dashboard que le corresponde.
 */
const Dashboard = () => {
  const { user } = useAuth();

  const roleName = user?.roles?.[0]?.rol?.toLowerCase() || user?.rol?.toLowerCase() || 'estudiante';

  switch (roleName) {
    case 'admin':
    case 'administrador':
      return <AdminDashboard />;
    
    case 'estudiante':
    case 'alumno':
    case 'cliente':
    case 'usuario':
      return <StudentDashboard />;
    
    default:
      // Fallback
      return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
          <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800">Acceso no configurado</h1>
            <p className="mt-2 text-gray-500">No se encontró un panel asignado para tu rol ({roleName}).</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;
