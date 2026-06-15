import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { BookOpen, Users, Clock, PlusCircle, CheckCircle, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';

const ProfesorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authService.apiFetch('/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el dashboard del profesor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, [fetchDashboard]);

  const firstName = user?.nombreCompleto ? user.nombreCompleto.split(' ')[0] : 'Profesor';

  const handleNewCourse = () => {
    // Navigate to courses page
    navigate('/cursos');
  };

  const handleNewActivity = () => {
    setAlertMsg('La función para crear nuevas actividades y desafíos estará disponible en el próximo sprint.');
    setTimeout(() => setAlertMsg(''), 5000);
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 60) {
        return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
      } else if (diffHours < 24) {
        return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      } else {
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
    } catch {
      return 'Hace un momento';
    }
  };

  const renderLpIcon = (lp) => {
    const name = lp?.toLowerCase() || '';
    if (name.includes('python')) {
      return (
        <div className="flex flex-col items-center justify-center text-amber-400 font-bold">
          <span className="text-3xl">🐍</span>
          <span className="text-xs text-blue-400 mt-1 font-mono">&lt;/&gt;</span>
        </div>
      );
    } else if (name.includes('javascript') || name.includes('js')) {
      return (
        <div className="flex flex-col items-center justify-center text-yellow-400 font-bold">
          <span className="text-3xl">JS</span>
          <span className="text-xs text-yellow-400 mt-1 font-mono">&lt;/&gt;</span>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center text-teal-400 font-bold">
          <span className="text-3xl">💻</span>
          <span className="text-xs text-teal-400 mt-1 font-mono">&lt;/&gt;</span>
        </div>
      );
    }
  };

  const widgetData = dashboardData?.widgets || {};
  const cursos = widgetData.cursos || [];
  const actividades = widgetData.actividad_reciente || [];

  const renderCursosSection = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2c5364]"></div>
        </div>
      );
    }
    if (cursos.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h4 className="text-md font-bold text-gray-800">No has creado cursos todavía</h4>
          <p className="text-gray-500 text-sm mt-1">Haz clic en &quot;Nuevo Curso&quot; para crear tu primera oferta académica.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {cursos.map((curso) => {
          const cardContent = (
            <>
              {/* Lado izquierdo - Info */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-red-600 mb-4">{curso.titulo}</h4>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Users size={16} />
                      <span>{curso.estudiantes_count} Estudiantes</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Clock size={16} />
                      <span>{curso.semanas} semanas</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 font-bold mb-4">
                    Paralelo: {curso.paralelo}
                  </div>
                </div>
                <div>
                  <span className="px-3 py-1 border border-emerald-500 text-emerald-600 rounded-full text-xs font-semibold bg-emerald-50/20">
                    Activo
                  </span>
                </div>
              </div>
              {/* Lado derecho - Icono en fondo negro */}
              <div className="w-1/3 bg-black flex items-center justify-center min-h-[160px]">
                {renderLpIcon(curso.lp)}
              </div>
            </>
          );
          return (
            <button
              key={curso.idCurso}
              type="button"
              className="bg-white rounded-3xl border border-red-100 shadow-sm hover:shadow-md transition-all duration-300 flex overflow-hidden cursor-pointer text-left w-full"
              onClick={() => navigate('/cursos')}
            >
              {cardContent}
            </button>
          );
        })}
      </div>
    );
  };

  const renderActividadSection = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5364]"></div>
        </div>
      );
    }
    if (actividades.length === 0) {
      return (
        <div className="text-center py-10 bg-gray-100 rounded-3xl text-gray-400">
          No se registra actividad reciente en tus cursos todavía.
        </div>
      );
    }
    return (
      <div className="bg-gray-100/80 p-6 rounded-3xl border border-gray-200/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actividades.map((actividad) => {
            const sidebarElement = actividad.tipo === 'foro'
              ? (
                <div className="w-12 bg-blue-100 border-r border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <MessageSquare size={18} />
                </div>
              )
              : (
                <div className="w-12 bg-emerald-500 border-r border-emerald-600 flex items-center justify-center text-white shrink-0">
                  <CheckCircle size={18} />
                </div>
              );
            const activityTitle = actividad.tipo === 'foro'
              ? `Foro: ${actividad.estudiante} hizo una pregunta`
              : `${actividad.estudiante} completó: "${actividad.titulo_actividad}"`;
            return (
              <div
                key={actividad.id ?? `${actividad.estudiante}-${actividad.fecha}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden flex items-stretch hover:shadow-md transition-shadow"
              >
                {sidebarElement}
                <div className="p-4 flex-1 flex flex-col justify-center min-w-0">
                  <h5 className="text-sm font-bold text-gray-900 truncate">{activityTitle}</h5>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5 truncate">
                    {actividad.curso} - P{actividad.paralelo}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-1">
                    {formatTime(actividad.fecha)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardContainer title="Principal" user={user}>
      {alertMsg && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <Sparkles size={20} className="shrink-0 text-blue-500" />
          <p className="text-sm font-medium">{alertMsg}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Bienvenida y Acciones Rápidas */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">¡Bienvenida, {firstName}!</h2>
          <p className="text-gray-500 mt-1">Gestiona tus cursos y guía a tus estudiantes</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            onClick={handleNewCourse}
            className="flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl font-bold transition-all w-full sm:w-auto"
          >
            <PlusCircle size={20} />
            <span>Nuevo Curso</span>
          </button>
          <button
            onClick={handleNewActivity}
            className="flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl font-bold transition-all w-full sm:w-auto"
          >
            <PlusCircle size={20} />
            <span>Nueva Actividad</span>
          </button>
        </div>
      </div>

      {/* Listado de Cursos */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Tus cursos</h3>
        {renderCursosSection()}
      </div>

      {/* Actividad Reciente */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Actividad Reciente</h3>
        <p className="text-sm text-gray-500 mb-6 text-center">Entregas y preguntas de estudiantes</p>
        {renderActividadSection()}
      </div>
    </DashboardContainer>
  );
};

export default ProfesorDashboard;
