import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_REDIRECTS } from '../../api/authService';

const Breadcrumbs = () => {
  const { user } = useAuth();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  // Mapeo de rutas estáticas a etiquetas amigables
  const routeLabels = {
    admin: 'Administración',
    profesor: 'Profesor',
    dashboard: 'Panel',
    estudiante: 'Estudiante',
    cursos: 'Cursos',
    desafios: 'Desafíos',
    moderador: 'Moderador',
    ayudante: 'Ayudante',
    soporte: 'Soporte',
  };

  // Segmentos intermedios que no tienen una página propia y no deben ser clickeables
  const nonClickableSegments = new Set([
    'dashboard',
    'moderador',
    'profesor',
    'ayudante',
    'soporte'
  ]);

  // Obtener la ruta de inicio correcta según el rol del usuario para evitar redirección al login
  const getHomePath = () => {
    if (!user) return '/login';
    return ROLE_REDIRECTS[user.rol] || '/login';
  };

  // Helper para determinar la etiqueta de cada segmento del path
  const getLabel = (segment, index) => {
    // Si el segmento previo es "cursos", significa que este segmento es un idCurso
    if (index > 0 && pathnames[index - 1] === 'cursos') {
      return 'Detalle de Curso';
    }
    // Si el segmento previo es "desafios", este segmento es un idDesafio
    if (index > 0 && pathnames[index - 1] === 'desafios') {
      return 'Detalle de Desafío';
    }
    
    // Si es una ruta mapeada
    const mappedLabel = routeLabels[segment.toLowerCase()];
    if (mappedLabel) return mappedLabel;

    // Formateo por defecto: capitalizar
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  // Construir la URL completa hasta el segmento indicado
  const buildLinkPath = (index) => {
    return '/' + pathnames.slice(0, index + 1).join('/');
  };

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs text-gray-500 mb-6 bg-white py-2 px-4 rounded-xl border border-gray-100 shadow-2xs w-fit">
      <Link to={getHomePath()} className="hover:text-[#2c5364] flex items-center gap-1 transition-colors">
        <Home size={14} />
        <span>Inicio</span>
      </Link>
      {pathnames.map((segment, index) => {
        const label = getLabel(segment, index);
        const to = buildLinkPath(index);
        const isLast = index === pathnames.length - 1;
        const isClickable = !nonClickableSegments.has(segment.toLowerCase()) && !isLast;

        return (
          <div key={to} className="flex items-center space-x-2">
            <ChevronRight size={12} className="text-gray-400" />
            {isClickable ? (
              <Link to={to} className="hover:text-[#2c5364] transition-colors">
                {label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-gray-700" : "text-gray-400"}>
                {label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
