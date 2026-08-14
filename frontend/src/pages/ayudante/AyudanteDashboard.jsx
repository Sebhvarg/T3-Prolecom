import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { 
  GraduationCap, 
  MessageSquare, 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  ArrowRight,
  Sparkles,
  Search,
  Code2,
  FileQuestion
} from 'lucide-react';

const AyudanteDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState({
    widgets: {
      metricas_ayudantia: {
        respuestas_validadas: 0,
        mis_respuestas: 0,
        preguntas_abiertas: 0,
        cursos_activos: 0,
      },
      cursos: [],
      preguntas_pendientes: [],
      actividad_reciente: [],
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mentoria'); // 'mentoria' | 'cursos' | 'actividad'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAyudanteDashboard = async () => {
      try {
        const response = await authService.apiFetch('/dashboard');
        if (response?.widgets) {
          setData(response);
        }
      } catch (error) {
        console.error("Error cargando dashboard de ayudante:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAyudanteDashboard();
  }, []);

  const metricas = data.widgets?.metricas_ayudantia || {
    respuestas_validadas: 0,
    mis_respuestas: 0,
    preguntas_abiertas: 0,
    cursos_activos: 0,
  };

  const cursos = data.widgets?.cursos || [];
  const preguntas = data.widgets?.preguntas_pendientes || [];
  const actividad = data.widgets?.actividad_reciente || [];

  const preguntasFiltradas = preguntas.filter(p => 
    p.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.autor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardContainer title="Panel de Cátedra & Mentoría" user={user}>
      {/* Header Banner de Ayudante */}
      <div className="relative overflow-hidden bg-[#1e293b] text-white p-6 sm:p-8 rounded-2xl shadow-sm mb-8 border border-slate-800">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold tracking-wide uppercase border border-blue-400/30">
              <GraduationCap size={14} />
              <span>Rol: Ayudante de Cátedra</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ¡Bienvenido, {user?.nombreCompleto || user?.usuario || 'Ayudante'}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Gestiona dudas académicas, valida soluciones de estudiantes y otorga el distintivo de <strong className="text-blue-200">Respuesta Oficial de Cátedra</strong> en el foro.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/cursos')}
              className="inline-flex items-center gap-2 bg-white text-[#2c5364] hover:bg-slate-100 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <BookOpen size={16} />
              <span>Explorar Cursos</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c5364]"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas Métricas del Ayudante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Respuestas Validadas</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1">{metricas.respuestas_validadas}</div>
              <p className="text-[11px] text-slate-500 font-medium">Marcadas como Respuesta Oficial</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dudas por Responder</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <FileQuestion size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1">{metricas.preguntas_abiertas}</div>
              <p className="text-[11px] text-slate-500 font-medium">Consultas de estudiantes abiertas</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aportes en Foro</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2c5364] flex items-center justify-center font-bold">
                  <MessageSquare size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1">{metricas.mis_respuestas}</div>
              <p className="text-[11px] text-slate-500 font-medium">Respuestas publicadas como mentor</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cursos de Cátedra</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <BookOpen size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1">{metricas.cursos_activos}</div>
              <p className="text-[11px] text-slate-500 font-medium">Disponibles para asistencia</p>
            </div>
          </div>

          {/* Navegación por Pestañas del Ayudante */}
          <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
            <button
              onClick={() => setActiveTab('mentoria')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mentoria'
                  ? 'bg-[#2c5364] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles size={15} />
              <span>Foro & Consultas Pendientes</span>
            </button>

            <button
              onClick={() => setActiveTab('cursos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cursos'
                  ? 'bg-[#2c5364] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen size={15} />
              <span>Cursos Asignados</span>
            </button>

            <button
              onClick={() => setActiveTab('actividad')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'actividad'
                  ? 'bg-[#2c5364] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock size={15} />
              <span>Actividad de Estudiantes</span>
            </button>
          </div>

          {/* Contenido según la pestaña activa */}
          {activeTab === 'mentoria' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Foro de Asistencia & Mentoría Académica</h3>
                  <p className="text-xs text-slate-500">Responde o valida respuestas como oficiales para guiar a los estudiantes.</p>
                </div>
                
                <div className="relative w-full sm:w-72">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar consulta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                  />
                </div>
              </div>

              {preguntasFiltradas.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                  <FileQuestion size={40} className="mx-auto text-slate-300 mb-3" />
                  <h4 className="text-sm font-bold text-slate-700 mb-1">No hay consultas pendientes</h4>
                  <p className="text-xs text-slate-400">Todas las dudas del foro han sido atendidas o no coinciden con la búsqueda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {preguntasFiltradas.map((preg) => (
                    <div
                      key={preg.idPregunta}
                      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-semibold text-[#2c5364] bg-blue-50 px-2 py-0.5 rounded-md">
                            {preg.foro_titulo}
                          </span>
                          <span>•</span>
                          <span>Por {preg.autor}</span>
                          <span>•</span>
                          <span>{preg.fecha}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{preg.titulo}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2">{preg.descripcion}</p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <div className="text-center px-3 py-1 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="block text-xs font-black text-slate-800">{preg.respuestas_count}</span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Respuestas</span>
                        </div>

                        <button
                          onClick={() => navigate(preg.idCurso ? `/cursos/${preg.idCurso}?tab=foro` : '/cursos')}
                          className="inline-flex items-center gap-1.5 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                        >
                          <span>Responder / Validar</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'cursos' && (
            <div>
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">Cursos con Soporte de Cátedra</h3>
                <p className="text-xs text-slate-500">Explora los contenidos, guías y ejercicios de programación para estudiantes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cursos.map((curso) => (
                  <div key={curso.idCurso} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                          {curso.lp || 'Programación'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          {curso.tipo || 'Público'}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mb-1">{curso.titulo}</h4>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{curso.descripcion || 'Sin descripción disponible.'}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500 font-medium">
                        👥 <strong>{curso.estudiantes_count || 0}</strong> alumnos
                      </span>
                      <button
                        onClick={() => navigate(`/cursos/${curso.idCurso}`)}
                        className="text-xs font-bold text-[#2c5364] hover:text-[#203a43] flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver Curso</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'actividad' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Actividad Reciente de Estudiantes</h3>
              <p className="text-xs text-slate-500 mb-6">Monitorea envíos de ejercicios y dudas planteadas en tiempo real.</p>

              <div className="space-y-4">
                {actividad.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">No hay registros de actividad reciente.</p>
                ) : (
                  actividad.map((act, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${act.tipo === 'solucion' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-[#2c5364]'}`}>
                          {act.tipo === 'solucion' ? <Code2 size={16} /> : <MessageSquare size={16} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {act.usuario} <span className="font-normal text-slate-500">{act.tipo === 'solucion' ? 'completó el desafío' : 'publicó en el foro'}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 font-semibold">{act.titulo}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardContainer>
  );
};

export default AyudanteDashboard;
