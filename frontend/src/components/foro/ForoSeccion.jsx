import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  MessageSquare, Plus, Search, CheckCircle2, HelpCircle, 
  User, Send, Loader2, AlertCircle, X, ShieldCheck 
} from 'lucide-react';
import { foroService } from '../../api/foroService';
import OfficialAnswerBadge from './OfficialAnswerBadge';
import ValidationButton from './ValidationButton';

const ForoSeccion = ({ idCurso, user }) => {
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todas');

  // Modal Nueva Pregunta
  const [isModalNuevaOpen, setIsModalNuevaOpen] = useState(false);
  const [formPregunta, setFormPregunta] = useState({ titulo: '', descripcion: '' });
  const [submittingPregunta, setSubmittingPregunta] = useState(false);

  // Detalle Pregunta seleccionada
  const [selectedPreguntaId, setSelectedPreguntaId] = useState(null);
  const [preguntaDetalle, setPreguntaDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Nueva Respuesta
  const [nuevoContenidoRespuesta, setNuevoContenidoRespuesta] = useState('');
  const [submittingRespuesta, setSubmittingRespuesta] = useState(false);

  // Determinar si el usuario actual posee rol autorizado (Profesor, Ayudante, Administrador) (PB16 RBAC)
  const isAuthorizedToValidate = Boolean(
    user?.rol === 'Administrador' ||
    user?.rol === 'Profesor' ||
    user?.rol === 'Ayudante' ||
    user?.roles?.some(r => ['Administrador', 'Profesor', 'Ayudante'].includes(r.rol || r))
  );

  const fetchPreguntas = useCallback(async () => {
    try {
      const data = await foroService.getPreguntasCurso(idCurso);
      setPreguntas(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar las preguntas del foro.');
    } finally {
      setLoading(false);
    }
  }, [idCurso]);

  useEffect(() => {
    let isSubscribed = true;
    const loadData = async () => {
      try {
        const data = await foroService.getPreguntasCurso(idCurso);
        if (!isSubscribed) return;
        setPreguntas(data);
      } catch (err) {
        if (!isSubscribed) return;
        console.error(err);
        setError(err.message || 'Error al cargar las preguntas del foro.');
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      isSubscribed = false;
    };
  }, [idCurso]);

  const loadPreguntaDetalle = async (idPregunta) => {
    setSelectedPreguntaId(idPregunta);
    setLoadingDetalle(true);
    try {
      const data = await foroService.getPreguntaDetalle(idPregunta);
      setPreguntaDetalle(data);
    } catch (err) {
      console.error(err);
      alert('Error al cargar el detalle de la pregunta.');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCreatePregunta = async (e) => {
    e.preventDefault();
    if (!formPregunta.titulo.trim() || !formPregunta.descripcion.trim()) return;

    setSubmittingPregunta(true);
    try {
      await foroService.createPregunta(idCurso, formPregunta);
      setFormPregunta({ titulo: '', descripcion: '' });
      setIsModalNuevaOpen(false);
      fetchPreguntas();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al publicar la pregunta.');
    } finally {
      setSubmittingPregunta(false);
    }
  };

  const handleCreateRespuesta = async (e) => {
    e.preventDefault();
    if (!nuevoContenidoRespuesta.trim() || !selectedPreguntaId) return;

    setSubmittingRespuesta(true);
    try {
      await foroService.createRespuesta(selectedPreguntaId, { contenido: nuevoContenidoRespuesta });
      setNuevoContenidoRespuesta('');
      await loadPreguntaDetalle(selectedPreguntaId);
      fetchPreguntas();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al enviar la respuesta.');
    } finally {
      setSubmittingRespuesta(false);
    }
  };

  const handleAnswerStatusChange = (updatedRespuesta) => {
    if (!preguntaDetalle) return;

    setPreguntaDetalle(prev => {
      if (!prev) return prev;
      const updatedRespuestas = prev.respuestas.map(r => 
        r.idRespuesta === updatedRespuesta.idRespuesta ? updatedRespuesta : r
      );
      
      const hasOfficial = updatedRespuestas.some(r => r.validada);
      return {
        ...prev,
        estado: hasOfficial ? 'resuelta' : 'abierta',
        respuestas: updatedRespuestas
      };
    });

    fetchPreguntas();
  };

  const renderQuestionStatusBadge = (preg) => {
    if (preg.tiene_respuesta_validada) {
      return <OfficialAnswerBadge size="small" validatorRole="Oficial" />;
    }

    if (preg.estado === 'resuelta') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <CheckCircle2 size={12} />
          Resuelta
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        Abierta
      </span>
    );
  };

  const renderModalHeaderBadge = () => {
    const hasValidated = preguntaDetalle?.respuestas?.some(r => r.validada);
    if (hasValidated) {
      return <OfficialAnswerBadge size="small" />;
    }

    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
        Pregunta Abierta
      </span>
    );
  };

  const getAnswerCardClasses = (isValidated) => {
    if (isValidated) {
      return 'p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs transition-all';
    }
    return 'p-5 rounded-2xl border border-gray-100 bg-white shadow-xs transition-all';
  };

  // Filtrado de preguntas
  const preguntasFiltradas = preguntas.filter(p => {
    const matchSearch = p.titulo.toLowerCase().includes(search.toLowerCase()) || 
                        p.descripcion.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (filtro === 'oficial') return p.tiene_respuesta_validada || p.estado === 'resuelta';
    if (filtro === 'abiertas') return p.estado === 'abierta' && !p.tiene_respuesta_validada;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner Superior Foro (Alineado con el estilo de cabecera del curso) */}
      <div className="bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
          <MessageSquare size={240} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-300" />
                Foro Validado (PB16)
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Foro de Consultas y Preguntas</h2>
            <p className="text-white/80 text-sm mt-2 max-w-xl leading-relaxed">
              Resuelve tus dudas académicas. Las respuestas convalidadas por profesores y ayudantes quedan destacadas como <strong className="text-white">Respuesta Oficial</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalNuevaOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-[#203a43] hover:bg-gray-100 font-bold px-5 py-3 rounded-xl shadow-md transition-all shrink-0"
          >
            <Plus size={18} />
            <span>Hacer una Pregunta</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en las preguntas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFiltro('todas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filtro === 'todas'
                ? 'bg-[#2c5364] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas ({preguntas.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('oficial')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filtro === 'oficial'
                ? 'bg-[#2c5364] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Con Respuesta Oficial
          </button>
          <button
            type="button"
            onClick={() => setFiltro('abiertas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filtro === 'abiertas'
                ? 'bg-[#2c5364] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sin Resolver
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-10 h-10 text-[#2c5364] animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Cargando preguntas del foro...</p>
        </div>
      ) : preguntasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No hay preguntas disponibles</h3>
          <p className="text-gray-500 text-sm mt-1">Sé el primero en realizar una consulta sobre el contenido de este curso.</p>
          <button
            type="button"
            onClick={() => setIsModalNuevaOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Crear Pregunta</span>
          </button>
        </div>
      ) : (
        /* Lista de Preguntas */
        <div className="space-y-4">
          {preguntasFiltradas.map((preg) => (
            <button
              key={preg.idPregunta}
              type="button"
              onClick={() => loadPreguntaDetalle(preg.idPregunta)}
              className="w-full text-left bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {renderQuestionStatusBadge(preg)}

                    <span className="text-xs text-gray-400 font-medium">
                      Publicado por <strong className="text-gray-700">{preg.creador?.nombreCompleto || 'Usuario'}</strong>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2c5364] transition-colors">
                    {preg.titulo}
                  </h3>

                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {preg.descripcion}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl shrink-0">
                  <MessageSquare size={14} className="text-[#2c5364]" />
                  <span>{preg.respuestas_count ?? 0}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal para Crear Pregunta */}
      {isModalNuevaOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Publicar Nueva Pregunta</h3>
              <button
                type="button"
                onClick={() => setIsModalNuevaOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePregunta} className="mt-4 space-y-4">
              <div>
                <label htmlFor="pregunta-titulo" className="block text-sm font-bold text-gray-700 mb-1.5">
                  Título de la consulta <span className="text-red-500">*</span>
                </label>
                <input
                  id="pregunta-titulo"
                  type="text"
                  required
                  placeholder="Ej: ¿Cómo implementar el algoritmo de búsqueda?"
                  value={formPregunta.titulo}
                  onChange={(e) => setFormPregunta({ ...formPregunta, titulo: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm"
                />
              </div>

              <div>
                <label htmlFor="pregunta-descripcion" className="block text-sm font-bold text-gray-700 mb-1.5">
                  Descripción o código <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="pregunta-descripcion"
                  required
                  rows={5}
                  placeholder="Explica en detalle tu pregunta..."
                  value={formPregunta.descripcion}
                  onChange={(e) => setFormPregunta({ ...formPregunta, descripcion: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalNuevaOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPregunta}
                  className="inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  {submittingPregunta && <Loader2 size={16} className="animate-spin" />}
                  <span>Publicar Pregunta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Overlay Detalle de Pregunta y Respuestas */}
      {selectedPreguntaId && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header del modal con el degradado del curso */}
            <div className="p-6 bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] text-white flex items-start justify-between gap-4">
              {loadingDetalle || !preguntaDetalle ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-200" />
                  <span className="font-semibold text-sm">Cargando conversación...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {renderModalHeaderBadge()}
                  </div>
                  <h3 className="text-xl font-bold leading-tight">{preguntaDetalle.titulo}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                    <User size={14} />
                    <span>Preguntado por <strong>{preguntaDetalle.creador?.nombreCompleto || 'Usuario'}</strong></span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setSelectedPreguntaId(null); setPreguntaDetalle(null); }}
                className="text-white/70 hover:text-white p-1 rounded-lg transition"
              >
                <X size={22} />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/50">
              {preguntaDetalle && (
                <>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                    <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                      {preguntaDetalle.descripcion}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#2c5364]" />
                      <span>Respuestas ({preguntaDetalle.respuestas?.length || 0})</span>
                    </h4>

                    {preguntaDetalle.respuestas?.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                        Todavía no hay respuestas. ¡Sé el primero en responder!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {preguntaDetalle.respuestas?.map((resp) => {
                          const authorRole = resp.usuario?.roles?.[0]?.rol || 'Estudiante';

                          return (
                            <div
                              key={resp.idRespuesta}
                              className={getAnswerCardClasses(Boolean(resp.validada))}
                            >
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-[#2c5364] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                    {resp.usuario?.nombreCompleto?.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-gray-900">
                                        {resp.usuario?.nombreCompleto || 'Usuario'}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                                        {authorRole}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {resp.validada && (
                                    <OfficialAnswerBadge validatorRole={authorRole} size="small" />
                                  )}

                                  <ValidationButton
                                    respuestaId={resp.idRespuesta}
                                    isValidated={Boolean(resp.validada)}
                                    isAuthorized={isAuthorizedToValidate}
                                    onStatusChange={handleAnswerStatusChange}
                                  />
                                </div>
                              </div>

                              <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed pl-10">
                                {resp.contenido}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleCreateRespuesta} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe una respuesta académica..."
                  value={nuevoContenidoRespuesta}
                  onChange={(e) => setNuevoContenidoRespuesta(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                />
                <button
                  type="submit"
                  disabled={submittingRespuesta || !nuevoContenidoRespuesta.trim()}
                  className="inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-xs"
                >
                  {submittingRespuesta ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  <span className="hidden sm:inline">Responder</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ForoSeccion.propTypes = {
  idCurso: PropTypes.string.isRequired,
  user: PropTypes.object,
};

export default ForoSeccion;
