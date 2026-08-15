import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getHomePath = (rol) => {
  if (rol === 'Estudiante') return '/dashboard/estudiante';
  if (rol === 'Moderador') return '/moderador/dashboard';
  if (rol === 'Profesor') return '/profesor/dashboard';
  if (rol === 'Soporte') return '/soporte/dashboard';
  if (rol === 'Ayudante') return '/ayudante/dashboard';
  return '/admin';
};

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500 font-medium animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const idRol = Number.parseInt(user.id_rol, 10);

  if (allowedRoles && !allowedRoles.includes(idRol)) {
    // Redirect to the user's correct home instead of / (avoids redirect loops)
    return <Navigate to={getHomePath(user.rol)} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
