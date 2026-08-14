import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { cursosService } from '../../api/cursosService';
import { MessageSquare, BookOpen, Clock, AlertCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentDashboardData = async () => {
      setLoading(true);
      try {
        const [myCursos, dashboardData] = await Promise.all([
          cursosService.getCursos({ filtro: 'mis_cursos' }),
          authService.apiFetch('/dashboard').catch(() => null),
        ]);

        setCursos(myCursos || []);
        if (dashboardData?.widgets?.actividades) {
          setActividades(dashboardData.widgets.actividades);
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard de estudiante:', err);
        setError('No se pudieron cargar tus datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDashboardData();
  }, []);

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
          <p className="text-gray-500 font-medium mb-4">Aún no estás inscrito en ningún curso.</p>
          <button
            onClick={() => navigate('/cursos')}
            className="bg-[#2c5364] hover:bg-[#203a43] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs cursor-pointer"
          >
            Explorar Cursos
          </button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cursos.map(curso => (
          <button
            key={curso.idCurso}
            type="button"
            onClick={() => navigate(`/cursos/${curso.idCurso}`)}
            className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex hover:shadow-md transition-all group cursor-pointer hover:-translate-y-0.5 transform duration-200"
          >
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#2c5364] transition-colors">{curso.titulo}</h4>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">{curso.descripcion}</p>
                <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                  <p className="font-semibold text-gray-700">Profesor: <span className="font-bold text-gray-900">{curso.creador?.nombreCompleto || 'Docente Cátedra'}</span></p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full w-fit uppercase tracking-wider">{curso.tipo}</span>
            </div>
            <div className="w-32 bg-gray-50 flex flex-col items-center justify-center border-l border-gray-50 gap-2 group-hover:bg-gray-100 transition-colors">
              <img src={getLanguageLogo(curso.lp)} alt={curso.lp} className="w-12 h-12 drop-shadow-xs" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{curso.lp}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <DashboardContainer title="Panel de Estudiante" user={user}>
      <div className="space-y-8">
        {/* Header Hero Banner with XP & Progress Stats (Figure 8 in Report) */}
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
              onClick={() => navigate('/cursos')}
              className="bg-white text-[#2c5364] hover:bg-slate-100 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer w-full sm:w-auto text-center"
            >
              Explorar Catálogo de Cursos
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-[#2c5364] rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase">Cursos Matriculados</p>
              <h3 className="text-2xl font-black text-slate-900">{cursos.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <span className="text-xl font-black">⚡</span>
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase">XP Acumulado</p>
              <h3 className="text-2xl font-black text-slate-900">{user?.xp ?? 0} PTS</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase">Actividades Pendientes</p>
              <h3 className="text-2xl font-black text-slate-900">{actividades.length}</h3>
            </div>
          </div>
        </div>
        
        <section className="mb-10">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
             <BookOpen size={20} className="text-[#2c5364]" />
             <span>Mis Cursos En Curso</span>
          </h3>
          {renderCursos()}
        </section>

        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-[#2c5364]" />
            <span>Actividades Recientes & Notificaciones</span>
          </h3>
          
          {actividades.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 font-medium">
              No tienes actividades o notificaciones pendientes en tus cursos por ahora.
            </div>
          ) : (
            <div className="space-y-3">
              {actividades.map(act => (
                <div key={act.id || act.titulo} className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex overflow-hidden hover:border-slate-300 transition-colors">
                  <div className="w-1.5 bg-[#2c5364]"></div>
                  <div className="flex-1 p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-slate-900 text-xs font-bold"><strong>{act.tipo}:</strong> {act.titulo}</p>
                      <p className="text-xs text-slate-500 font-semibold">{act.curso}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{act.fecha}</p>
                    </div>
                    <div className="p-2.5 rounded-full bg-slate-100 text-[#2c5364]">
                      <MessageSquare size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardContainer>
  );
};

export default StudentDashboard;
