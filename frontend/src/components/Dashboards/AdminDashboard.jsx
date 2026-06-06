import React from 'react';
import BaseDashboard from './BaseDashboard';

const AdminDashboard = () => {
  const adminLinks = [
    { name: 'Gestión de Usuarios', route: '/admin/usuarios' },
  ];

  return (
    <BaseDashboard sidebarLinks={adminLinks}>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Usuarios Totales</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">1,250</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Ingresos del Mes</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">$45,000</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Alertas del Sistema</h3>
          <p className="text-3xl font-bold text-red-500 mt-2">3</p>
        </div>
      </div>
    </BaseDashboard>
  );
};

export default AdminDashboard;
