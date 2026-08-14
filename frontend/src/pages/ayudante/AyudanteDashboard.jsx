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
  FileQuestion,
  ShieldCheck
} from 'lucide-react';
import BotonDescargaReporte from '../../components/common/BotonDescargaReporte';

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
  const [activeTab, setActiveTab] = useState('mentoria');
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
    <DashboardContainer title="Panel de Cátedra & Mentoría Académica" user={user}>
      <div className="space-y-6">
        {/* Banner Encabezado Sobrio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80 shrink-0">
              <GraduationCap size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                  Rol: Ayudante de Cátedra
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                ¡Bienvenido, {user?.nombreCompleto || user?.usuario || 'Ayudante'}!
              </h1>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Atención a consultas académicas, asistencia pedagógica y validación oficial de respuestas en el foro.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <BotonDescargaReporte tipoReporte="ayudantes" label="Reporte Cátedra" variant="secondary" />
          </div>

          {/* Segmented Control Tabs */}
          <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('mentoria')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'mentoria'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles size={15} />
              <span>Foro & Consultas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cursos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'cursos'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen size={15} />
              <span>Cursos Asignados</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('actividad')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'actividad'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock size={15} />
              <span>Actividad en Vivo</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mb-3" />
            <p className="text-xs font-medium text-slate-500">Cargando métricas de cátedra...</p>
          </div>
        ) : (
          <>
            {/* Tarjetas Métricas del Ayudante en Tonos Sobrios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Respuestas Validadas</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{metricas.respuestas_validadas}</div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">Marcadas como Respuesta Oficial</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dudas Abiertas</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60">
                    <FileQuestion size={18} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{metricas.preguntas_abiertas}</div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">Consultas de alumnos sin resolver</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mis Aportes en Foro</span>
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60">
                    <MessageSquare size={18} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{metricas.mis_respuestas}</div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">Respuestas publicadas como mentor</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cursos Asignados</span>
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60">
                    <BookOpen size={18} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{metricas.cursos_activos}</div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">Cursos con soporte de cátedra</p>
              </div>
            </div>

            {/* Contenido según la pestaña activa */}
            {activeTab === 'mentoria' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-slate-700" /> Consultas Académicas Pendientes
                    </h3>
                    <p className="text-xs text-slate-500 font-normal">Responde o otorga la validación oficial a respuestas de estudiantes.</p>
                  </div>
                  
                  <div className="relative w-full sm:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar consulta en el foro..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 bg-white"
                    />
                  </div>
                </div>

                {preguntasFiltradas.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-2xs">
                    <FileQuestion size={36} className="mx-auto text-slate-300 mb-2" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">No hay consultas pendientes</h4>
                    <p className="text-xs text-slate-400 font-normal">Todas las dudas del foro han sido atendidas o no coinciden con la búsqueda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {preguntasFiltradas.map((preg) => (
                      <div
                        key={preg.idPregunta}
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/70">
                              {preg.foro_titulo}
                            </span>
                            <span>·</span>
                            <span>Por <strong className="text-slate-700 font-semibold">{preg.autor}</strong></span>
                            <span>·</span>
                            <span>{preg.fecha}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">{preg.titulo}</h4>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{preg.descripcion}</p>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          <div className="text-center px-3 py-1 bg-slate-50 rounded-xl border border-slate-200/60">
                            <span className="block text-xs font-bold text-slate-900">{preg.respuestas_count}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Respuestas</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(preg.idCurso ? `/cursos/${preg.idCurso}?tab=foro` : '/cursos')}
                            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                          >
                            <span>Atender / Validar</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cursos' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-900">Cursos con Soporte de Cátedra</h3>
                  <p className="text-xs text-slate-500 font-normal">Supervisa contenidos, guía actividades prácticas y apoya en evaluaciones de código.</p>
                </div>

                {cursos.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-2xs">
                    <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Aún no estás asignado como ayudante a ningún curso</h4>
                    <p className="text-xs text-slate-400 font-normal">
                      Un profesor debe asignarte como Ayudante de Cátedra a su curso para que puedas atender consultas y supervisar sus contenidos.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cursos.map((curso) => (
                      <div key={curso.idCurso} className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                              {curso.lp || 'Programación'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {curso.tipo || 'Público'}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mb-1">{curso.titulo}</h4>
                          <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{curso.descripcion || 'Sin descripción disponible.'}</p>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500 font-normal">
                            Estudiantes: <strong className="text-slate-800 font-semibold">{curso.estudiantes_count || 0}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate(`/cursos/${curso.idCurso}`)}
                            className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver Curso</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'actividad' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Actividad Reciente de Estudiantes en Cátedra</h3>
                  <p className="text-xs text-slate-500 font-normal">Supervisión en vivo de soluciones enviadas y preguntas planteadas en los foros.</p>
                </div>

                <div className="space-y-2">
                  {actividad.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-8">No hay registros de actividad reciente en tus cursos.</p>
                  ) : (
                    actividad.map((act, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3.5 rounded-xl border border-slate-200/60 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/75'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${act.tipo === 'solucion' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                            {act.tipo === 'solucion' ? <Code2 size={16} /> : <MessageSquare size={16} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {act.usuario} <span className="font-normal text-slate-500">{act.tipo === 'solucion' ? 'completó el desafío' : 'publicó en el foro'}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">{act.titulo}</p>
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
      </div>
    </DashboardContainer>
  );
};

export default AyudanteDashboard;
