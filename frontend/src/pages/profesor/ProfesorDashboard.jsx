import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { BookOpen, Users, Clock, PlusCircle, CheckCircle, MessageSquare, AlertCircle, Sparkles, X, FileText, Code, LayoutGrid, List, ChevronRight } from 'lucide-react';

const ProfesorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertMsg] = useState('');

  // Toggle de vista de cursos ('grid' | 'list')
  const [viewMode, setViewMode] = useState('grid');

  // Modal Nueva Actividad State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authService.apiFetch('/dashboard');
      setDashboardData(data);
      if (data?.widgets?.cursos?.length > 0) {
        setSelectedCourseId(data.widgets.cursos[0].idCurso);
      }
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
    navigate('/cursos', { state: { openModal: true } });
  };

  const handleNewActivity = () => {
    setIsActivityModalOpen(true);
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Hace un momento';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
      if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return 'Hace un momento';
    }
  };

  const getLanguageLogo = (lp) => {
    const lang = lp?.toLowerCase() || '';
    if (lang.includes('javascript') || lang.includes('js')) {
      return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg';
    }
    if (lang.includes('c++') || lang.includes('cpp')) {
      return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg';
    }
    if (lang.includes('java')) {
      return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg';
    }
    if (lang.includes('c#') || lang.includes('csharp')) {
      return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg';
    }
    return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg';
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

    if (viewMode === 'list') {
      return (
        <div className="flex flex-col space-y-3">
          {cursos.map((curso) => (
            <button
              key={curso.idCurso}
              type="button"
              onClick={() => navigate(`/cursos/${curso.idCurso}`)}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs p-4 flex items-center justify-between transition cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <img alt={curso.lp || 'Python'} className="w-9 h-9 drop-shadow-xs shrink-0" src={getLanguageLogo(curso.lp)} />
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#2c5364] truncate">{curso.titulo}</h4>
                  <div className="flex items-center gap-3 text-slate-500 text-xs mt-0.5">
                    <span>{curso.estudiantes_count} Alumnos</span>
                    <span>•</span>
                    <span>Paralelo {curso.paralelo}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2.5 py-0.5 border border-emerald-500 text-emerald-600 rounded-full text-[10px] font-bold bg-emerald-50/20">
                  Activo
                </span>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 transition" />
              </div>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cursos.map((curso) => {
          const cardContent = (
            <>
              {/* Lado izquierdo - Info */}
              <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#2c5364] transition-colors mb-2 truncate">{curso.titulo}</h4>
                  <div className="space-y-1.5 mb-3 text-slate-600 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      <span>{curso.estudiantes_count} Estudiantes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{curso.semanas} semanas</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 font-bold mb-3">
                    Paralelo: {curso.paralelo}
                  </div>
                </div>
                <div>
                  <span className="px-2.5 py-0.5 border border-emerald-500 text-emerald-600 rounded-full text-[10px] font-semibold bg-emerald-50/20">
                    Activo
                  </span>
                </div>
              </div>
              {/* Lado derecho - Icono de Lenguaje */}
              <div className="w-24 bg-slate-50 flex flex-col items-center justify-center border-l border-slate-100 gap-1.5 group-hover:bg-slate-100/80 transition-colors shrink-0">
                <img alt={curso.lp || 'Python'} className="w-9 h-9 drop-shadow-xs" src={getLanguageLogo(curso.lp)} />
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{curso.lp || 'Python'}</span>
              </div>
            </>
          );
          return (
            <button
              key={curso.idCurso}
              type="button"
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all duration-300 flex overflow-hidden cursor-pointer text-left w-full group"
              onClick={() => navigate(`/cursos/${curso.idCurso}`)}
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
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-400 text-xs font-medium">
          No se registra actividad reciente en tus cursos todavía.
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {actividades.map((actividad) => {
          const sidebarElement = actividad.tipo === 'foro'
            ? (
              <div className="w-10 bg-blue-100 border-r border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <MessageSquare size={16} />
              </div>
            )
            : (
              <div className="w-10 bg-emerald-500 border-r border-emerald-600 flex items-center justify-center text-white shrink-0">
                <CheckCircle size={16} />
              </div>
            );
          const activityTitle = actividad.tipo === 'foro'
            ? `Foro: ${actividad.estudiante} hizo una pregunta`
            : `${actividad.estudiante} completó: "${actividad.titulo_actividad}"`;
          return (
            <div
              key={actividad.id ?? `${actividad.estudiante}-${actividad.fecha}`}
              className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex items-stretch hover:border-slate-300 transition"
            >
              {sidebarElement}
              <div className="p-3 flex-1 flex flex-col justify-center min-w-0">
                <h5 className="text-xs font-bold text-slate-900 truncate">{activityTitle}</h5>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                  {actividad.curso} - P{actividad.paralelo}
                </p>
                <span className="text-[10px] text-slate-400 mt-1">
                  {formatTime(actividad.fecha)}
                </span>
              </div>
            </div>
          );
        })}
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
            className="flex items-center justify-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <PlusCircle size={18} />
            <span>Nuevo Curso</span>
          </button>
          <button
            onClick={handleNewActivity}
            className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <PlusCircle size={18} />
            <span>Nueva Actividad</span>
          </button>
        </div>
      </div>

      {/* Estructura Principal en 2 Columnas: Cursos a la Izquierda, Actividad a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Columna Izquierda (2/3 width) - Tus Cursos con Selector Grid / Lista */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={20} className="text-[#2c5364]" />
              <span>Tus Cursos</span>
            </h3>

            {/* Selector de orden Grid / Lista */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Vista en Cuadrícula (Grid)"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Vista en Lista"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {renderCursosSection()}
        </div>

        {/* Columna Derecha (1/3 width) - Actividad Reciente */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-[#2c5364]" />
              <span>Actividad Reciente</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Entregas y preguntas de estudiantes</p>
          </div>

          {renderActividadSection()}
        </div>
      </div>

      {/* Modal Nueva Actividad */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setIsActivityModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Añadir Nueva Actividad</h3>
            <p className="text-gray-500 text-sm mb-6">Selecciona el curso y el tipo de contenido que deseas agregar.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Seleccionar Curso Destino</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm font-semibold text-gray-800"
                >
                  {cursos.length === 0 ? (
                    <option value="">No tienes cursos activos</option>
                  ) : (
                    cursos.map((c) => (
                      <option key={c.idCurso} value={c.idCurso}>
                        {c.titulo} (Paralelo: {c.paralelo})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Tipo de Contenido a Crear</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!selectedCourseId}
                    onClick={() => {
                      setIsActivityModalOpen(false);
                      navigate(`/cursos/${selectedCourseId}`, { state: { action: 'createTema' } });
                    }}
                    className="p-4 border border-gray-100 hover:border-blue-200 bg-gray-50/50 hover:bg-blue-50/50 rounded-2xl text-left transition-all group cursor-pointer disabled:opacity-50"
                  >
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                      <BookOpen size={20} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">Nuevo Tema</h4>
                    <p className="text-gray-400 text-xs mt-0.5">Crea un módulo o sección.</p>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedCourseId}
                    onClick={() => {
                      setIsActivityModalOpen(false);
                      navigate(`/cursos/${selectedCourseId}`, { state: { action: 'createMaterial' } });
                    }}
                    className="p-4 border border-gray-100 hover:border-green-200 bg-gray-50/50 hover:bg-green-50/50 rounded-2xl text-left transition-all group cursor-pointer disabled:opacity-50"
                  >
                    <div className="p-2 bg-green-50 text-green-600 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                      <FileText size={20} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">Subir Material</h4>
                    <p className="text-gray-400 text-xs mt-0.5">Sube PDF o videos.</p>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedCourseId}
                    onClick={() => {
                      setIsActivityModalOpen(false);
                      navigate(`/cursos/${selectedCourseId}`, { state: { action: 'createDesafio' } });
                    }}
                    className="p-4 border border-gray-100 hover:border-amber-200 bg-gray-50/50 hover:bg-amber-50/50 rounded-2xl text-left transition-all group cursor-pointer disabled:opacity-50"
                  >
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                      <Code size={20} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">Crear Desafío</h4>
                    <p className="text-gray-400 text-xs mt-0.5">Ejercicio interactivo.</p>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedCourseId}
                    onClick={() => {
                      setIsActivityModalOpen(false);
                      navigate(`/cursos/${selectedCourseId}`, { state: { action: 'createForo' } });
                    }}
                    className="p-4 border border-gray-100 hover:border-teal-200 bg-gray-50/50 hover:bg-teal-50/50 rounded-2xl text-left transition-all group cursor-pointer disabled:opacity-50"
                  >
                    <div className="p-2 bg-teal-50 text-teal-600 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                      <MessageSquare size={20} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">Crear Foro</h4>
                    <p className="text-gray-400 text-xs mt-0.5">Espacio de preguntas Q&A.</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100 mt-6">
              <button 
                type="button" 
                onClick={() => setIsActivityModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
  );
};

export default ProfesorDashboard;
