import React from 'react';

/**
 * Patrón Template Method: Este es nuestro Dashboard Genérico <T>.
 * Define la estructura (layout) y recibe las partes específicas como "props" (sidebar, children).
 */
const BaseDashboard = ({ sidebarLinks, children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Genérico que recibe links específicos */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Sistema Prolecom</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarLinks.map((link, idx) => (
              <li key={idx}>
                <a
                  href={link.route}
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto">
        {/* Header Genérico */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Panel de Control</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Usuario Logueado</span>
            <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
          </div>
        </header>

        {/* Aquí se inyectan los Widgets/Contenido específico de cada rol */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default BaseDashboard;
