import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { useNotificaciones } from '../../context/NotificacionContext';
import { cursosService } from '../../api/cursosService';
import { MessageSquare, BookOpen, Clock, AlertCircle, LayoutGrid, List, ChevronRight, Trash2, Wifi, WifiOff } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notificaciones: actividades, noLeidas, conectado, limpiar } = useNotificaciones();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [limpiando, setLimpiando] = useState(false);

  useEffect(() => {
    const fetchCursos = async () => {
      setLoading(true);
      try {
        const myCursos = await cursosService.getCursos({ filtro: 'mis_cursos' });
        setCursos(myCursos || []);
      } catch (err) {
        console.error('Error al cargar cursos del estudiante:', err);
        setError('No se pudieron cargar tus datos.');
      } finally {
        setLoading(false);
      }
    };
    fetchCursos();
  }, []);

  const handleLimpiar = async () => {
    if (limpiando || actividades.length === 0) return;
    setLimpiando(true);
    try {
      await limpiar();
    } finally {
      setLimpiando(false);
    }
  };


  const getLanguageLogo = (lp) => {
    const lang = lp?.toLowerCase() || '';
    if (lang.includes('python')) {
      return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg';
    }
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
    return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chrome/chrome-original.svg';
  };

  const renderCursos = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5364]"></div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      );
    }
    if (cursos.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xs text-center flex flex-col items-center justify-center">
          <BookOpen size={48} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-xs mb-4">Aún no estás inscrito en ningún curso.</p>
          <button
            type="button"
            onClick={() => navigate('/cursos')}
            className="bg-[#2c5364] hover:bg-[#203a43] text-white px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            Explorar Cursos
          </button>
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="flex flex-col space-y-3">
          {cursos.map(curso => (
            <button
              key={curso.idCurso}
              type="button"
              onClick={() => navigate(`/cursos/${curso.idCurso}`)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-slate-300 hover:shadow-xs transition group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <img src={getLanguageLogo(curso.lp)} alt={curso.lp} className="w-8 h-8 drop-shadow-xs shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#2c5364] truncate">{curso.titulo}</h4>
                  <p className="text-slate-500 text-xs truncate mt-0.5">Profesor: {curso.creador?.nombreCompleto || 'Docente Cátedra'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {curso.tipo}
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
        {cursos.map(curso => (
          <button
            key={curso.idCurso}
            type="button"
            onClick={() => navigate(`/cursos/${curso.idCurso}`)}
            className="w-full text-left bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex hover:border-slate-300 hover:shadow-xs transition-all group cursor-pointer"
          >
            <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 mb-1.5 group-hover:text-[#2c5364] transition-colors truncate">{curso.titulo}</h4>
                <p className="text-slate-500 text-xs line-clamp-2 mb-3 leading-relaxed">{curso.descripcion}</p>
                <div className="text-[11px] text-slate-500 mb-2">
                  <span>Profesor: </span>
                  <strong className="text-slate-800 font-bold">{curso.creador?.nombreCompleto || 'Docente Cátedra'}</strong>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full w-fit uppercase tracking-wider">{curso.tipo}</span>
            </div>
            <div className="w-24 bg-slate-50 flex flex-col items-center justify-center border-l border-slate-100 gap-1 group-hover:bg-slate-100/80 transition-colors shrink-0">
              <img src={getLanguageLogo(curso.lp)} alt={curso.lp} className="w-9 h-9 drop-shadow-xs" />
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{curso.lp}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <DashboardContainer title="Panel de Estudiante" user={user}>
      <div className="space-y-8">
        {/* Header Hero Banner with XP & Progress Stats */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              ¡Bienvenido, {user?.nombreCompleto || user?.usuario || 'Estudiante'}!
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-xl font-medium">
              Continúa tu aprendizaje práctico, resuelve desafíos interactivos de programación y gana XP.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto">
            <button
              type="button"
              onClick={() => navigate('/cursos')}
              className="bg-white text-[#2c5364] hover:bg-slate-100 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer w-full sm:w-auto text-center"
            >
              Explorar Catálogo de Cursos
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-[#2c5364] rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase">Cursos Matriculados</p>
              <h3 className="text-2xl font-black text-slate-900">{cursos.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <span className="text-xl font-black">⚡</span>
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase">XP Acumulado</p>
              <h3 className="text-2xl font-black text-slate-900">{user?.xp ?? 0} PTS</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase">Actividades Pendientes</p>
              <h3 className="text-2xl font-black text-slate-900">{actividades.length}</h3>
            </div>
          </div>
        </div>

        {/* Estructura Principal en 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda (2/3 width) - Mis Cursos en Curso con Selector Grid / Lista */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={20} className="text-[#2c5364]" />
                <span>Mis Cursos En Curso</span>
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

            {renderCursos()}
          </div>

          {/* Columna Derecha (1/3 width) - Actividades Recientes */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={20} className="text-[#2c5364]" />
                  <span>Actividades Recientes</span>
                  {noLeidas > 0 && (
                    <span className="px-1.5 py-0.5 bg-[#2c5364] text-white text-[10px] font-black rounded-full leading-none">
                      {noLeidas}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  {conectado ? (
                    <><Wifi size={11} className="text-emerald-500" /> <span>En tiempo real</span></>
                  ) : (
                    <><WifiOff size={11} className="text-slate-400" /> <span>Notificaciones y tareas pendientes</span></>
                  )}
                </p>
              </div>

              {actividades.length > 0 && (
                <button
                  type="button"
                  onClick={handleLimpiar}
                  disabled={limpiando}
                  title="Limpiar todas las notificaciones"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors shrink-0 mt-1 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  {limpiando ? 'Limpiando…' : 'Limpiar todo'}
                </button>
              )}
            </div>

            {actividades.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-400 font-medium">
                No tienes actividades o notificaciones pendientes por ahora.
              </div>
            ) : (
              <div className="space-y-3">
                {actividades.map((act) => (
                  <div key={act.id || act.titulo} className={`bg-white rounded-xl border shadow-2xs flex overflow-hidden transition-colors ${act.leida ? 'border-slate-200/80 hover:border-slate-300' : 'border-[#2c5364]/30 hover:border-[#2c5364]/60'}`}>
                    <div className={`w-1.5 shrink-0 ${act.leida ? 'bg-slate-200' : 'bg-[#2c5364]'}`} />
                    <div className="flex-1 p-3.5 flex justify-between items-center min-w-0">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          {!act.leida && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2c5364] shrink-0" />
                          )}
                          <p className="text-slate-900 text-xs font-bold truncate"><strong>{act.tipo}:</strong> {act.titulo}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{act.curso}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{act.fecha}</p>
                      </div>
                      <div className={`p-2 rounded-full shrink-0 ${act.leida ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-[#2c5364]'}`}>
                        <MessageSquare size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
};

export default StudentDashboard;
