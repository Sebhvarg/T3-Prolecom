import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import NotificacionesDropdown from './NotificacionesDropdown';
import { User } from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';

const DashboardContainer = ({ title, user: propUser, children }) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  const displayName = user?.nombreCompleto || user?.usuario || (authUser ? 'Usuario' : 'Cargando...');
  const displayRole = user?.rol || 'Usuario';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[#0f2027] border-b border-[#1e3a47] flex items-center justify-between px-8 shadow-xs">
          <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
          <div className="flex items-center gap-6">
            <NotificacionesDropdown />
            <div className="flex items-center gap-3 p-1 pl-4 border-l border-[#1e3a47]">
              <div className="p-2 bg-white/10 border border-white/15 rounded-full text-slate-200">
                <User size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">{displayName}</span>
                <span className="px-2.5 py-0.5 bg-white/15 text-slate-200 border border-white/20 text-[10px] font-semibold rounded-full w-fit uppercase tracking-wider mt-1">{displayRole}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-slate-50">
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  );
};

DashboardContainer.propTypes = {
  title: PropTypes.string,
  user: PropTypes.shape({
    usuario: PropTypes.string,
    rol: PropTypes.string,
  }),
  children: PropTypes.node,
};

export default DashboardContainer;

