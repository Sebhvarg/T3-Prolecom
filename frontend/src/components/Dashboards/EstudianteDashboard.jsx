import React from 'react';
import BaseDashboard from './BaseDashboard';

const EstudianteDashboard = () => {
 
  const estudianteLinks = [
    { name: 'Mi Perfil', route: '/estudiante/perfil' }
  ];

  return (
    <BaseDashboard sidebarLinks={estudianteLinks}>
      {/* Widgets específicos del Estudiante */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Cursos Activos</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">4</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Promedio General</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">92%</p>
        </div>
      </div>
    </BaseDashboard>
  );
};

export default EstudianteDashboard;
