import React from 'react';
import AdminDashboard from './AdminDashboard';
import EstudianteDashboard from './EstudianteDashboard';

/**
 * Componente Factory: Su única responsabilidad es recibir el rol del usuario actual
 * y retornar (renderizar) el Dashboard correspondiente.
 */
const DashboardFactory = ({ userRole }) => {
 
  const role = userRole?.toLowerCase();

  switch (role) {
    case 'admin':
    case 'administrador':
      return <AdminDashboard />;
    
    case 'estudiante':
    case 'alumno':
      return <EstudianteDashboard />;
    
    default:
      // Fallback a un dashboard por defecto, o una pantalla de error/acceso denegado
      return (
        <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-800">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Dashboard no disponible</h1>
            <p className="mt-2">No se encontró un panel asignado para el rol actual.</p>
          </div>
        </div>
      );
  }
};

export default DashboardFactory;
