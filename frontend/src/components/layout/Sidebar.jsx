import { useState } from 'react';
import { Home, Settings, LogOut, BookOpen, ShieldAlert, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/Logo/logoHorizontal.webp';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const isModeratorOrAdmin = Boolean(
    user?.rol === 'Administrador' ||
    user?.rol === 'Moderador' ||
    user?.roles?.some(r => ['Administrador', 'Moderador'].includes(r.rol || r))
  );

  const isAdminOrSupport = Boolean(
    ['Administrador', 'Soporte'].includes(user?.rol) ||
    [1, 4].includes(parseInt(user?.id_rol))
  );

  const getHomePath = (userRole) => {
    if (userRole === 'Estudiante') return '/dashboard/estudiante';
    if (userRole === 'Moderador') return '/moderador/dashboard';
    if (userRole === 'Profesor') return '/profesor/dashboard';
    if (userRole === 'Soporte') return '/soporte/dashboard';
    if (userRole === 'Ayudante') return '/ayudante/dashboard';
    return '/admin';
  };

  const homePath = getHomePath(user?.rol);

  const canViewReports = Boolean(
    ['Administrador', 'Profesor', 'Soporte', 'Ayudante'].includes(user?.rol) ||
    user?.roles?.some(r => ['Administrador', 'Profesor', 'Soporte', 'Ayudante'].includes(r.rol || r))
  );

  const menuItems = [
    { name: 'Principal', path: homePath, icon: <Home size={20} />, show: true },
    { name: 'Cursos', path: '/cursos', icon: <BookOpen size={20} />, show: !isAdminOrSupport },
    { name: 'Reportes', path: '/reportes', icon: <FileText size={20} />, show: canViewReports },
    { name: 'Moderación', path: '/moderador/dashboard', icon: <ShieldAlert size={20} />, show: isModeratorOrAdmin },
  ];

  return (
    <div
      className={`bg-[#0f2027] text-white flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header del Sidebar con Logo y Botón Colapsar */}
      <div className="p-4 flex items-center justify-between border-b border-[#1e3a47] min-h-[64px]">
        {!isCollapsed && (
          <button
            type="button"
            className="cursor-pointer bg-transparent border-0 p-0 overflow-hidden"
            onClick={() => navigate('/')}
          >
            <img src={logo} alt="PROLECOM" className="h-9 w-auto object-contain" />
          </button>
        )}

        <button
          type="button"
          onClick={toggleCollapse}
          className={`p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Ítems del Menú */}
      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                type="button"
                key={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`w-full flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition-all bg-transparent border-0 ${
                  isCollapsed ? 'justify-center' : 'justify-start'
                } ${
                  isActive
                    ? 'bg-[#2c5364] text-white shadow-2xs font-semibold'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white font-medium'
                }`}
                onClick={() => navigate(item.path)}
              >
                <div className="shrink-0">{item.icon}</div>
                {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
              </button>
            );
          })}
      </nav>

      {/* Pie del Sidebar - Perfil y Salir */}
      <div className="p-3 border-t border-[#1e3a47] space-y-2">
        <button
          type="button"
          title={isCollapsed ? 'Mi Perfil' : undefined}
          className={`w-full flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition-all bg-transparent border-0 ${
            isCollapsed ? 'justify-center' : 'justify-start'
          } ${
            location.pathname === '/perfil'
              ? 'bg-[#2c5364] text-white font-semibold'
              : 'text-slate-400 hover:bg-white/10 hover:text-white font-medium'
          }`}
          onClick={() => navigate('/perfil')}
        >
          <div className="shrink-0">
            <Settings size={20} />
          </div>
          {!isCollapsed && <span className="text-sm truncate">Mi Perfil</span>}
        </button>

        <button
          type="button"
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
          className={`w-full flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition-all text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 bg-transparent border-0 ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          onClick={logout}
        >
          <div className="shrink-0">
            <LogOut size={20} />
          </div>
          {!isCollapsed && <span className="text-sm font-medium truncate">Salir</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;