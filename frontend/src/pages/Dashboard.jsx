import AdminDashboard from './admin/AdminDashboard';
import SoporteDashboard from './soporte/SoporteDashboard';
import AyudanteDashboard from './ayudante/AyudanteDashboard';
import ProfesorDashboard from './profesor/ProfesorDashboard';
import ModeratorDashboard from './dashboard/ModeratorDashboard';
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

    case 'soporte':
      return <SoporteDashboard />;

    case 'ayudante':
    case 'ayudante de cátedra':
      return <AyudanteDashboard />;

    case 'profesor':
    case 'docente':
      return <ProfesorDashboard />;

    case 'moderador':
      return <ModeratorDashboard />;

    case 'estudiante':
    case 'alumno':
    case 'cliente':
    case 'usuario':
      return <StudentDashboard />;

    default:
      return <StudentDashboard />;
  }
};

export default Dashboard;
