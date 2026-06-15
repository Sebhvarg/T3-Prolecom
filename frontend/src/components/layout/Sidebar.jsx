import { Home, Settings, LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/Logo/logoHorizontal.webp';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const nonStudentPath = user?.rol === 'Profesor' ? '/profesor/dashboard' : '/admin';
  const homePath = user?.rol === 'Estudiante' ? '/dashboard/estudiante' : nonStudentPath;

  const menuItems = [
    { name: 'Principal', path: homePath, icon: <Home size={20} />, show: true },
    { name: 'Cursos', path: '/cursos', icon: <BookOpen size={20} />, show: true },
  ];

  return (
    <div className="w-64 bg-[#0f2027] text-white flex flex-col h-full">
      <div className="p-6 flex items-center justify-center border-b border-gray-800">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo} alt="PROLECOM" className="h-10 w-auto" />
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.filter(item => item.show).map((item) => (
          <div 
            key={item.path}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              location.pathname === item.path 
                ? 'bg-[#2c5364] text-white' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span className="font-medium underline-offset-4">{item.name}</span>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors text-gray-400 hover:bg-gray-800 hover:text-white leading-none">
          <Settings size={20} />
          <span className="font-medium">Configuración</span>
        </div>
        <div 
          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors text-gray-400 hover:bg-red-900/30 hover:text-red-400 leading-none" 
          onClick={logout}
        >
          <LogOut size={20} />
          <span className="font-medium">Salir</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

