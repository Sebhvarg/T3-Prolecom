import React from 'react';
import Sidebar from './Sidebar';
import { Bell, User } from 'lucide-react';

const DashboardContainer = ({ title, user, children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          <div className="flex items-center gap-6">
            <div className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full cursor-pointer">
              <Bell size={20} />
              <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            <div className="flex items-center gap-3 p-1 pl-4 border-l border-gray-200">
              <div className="p-2 bg-gray-100 rounded-full">
                <User size={20} className="text-gray-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 leading-tight">{user?.usuario || 'Cargando...'}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full w-fit uppercase tracking-tighter mt-1">{user?.rol || 'Usuario'}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardContainer;

