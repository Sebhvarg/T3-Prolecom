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
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'oficial', 'abiertas'

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
    setLoading(true);
    setError('');
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
    fetchPreguntas();
  }, [fetchPreguntas]);

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
      // Recargar el detalle de la pregunta
      await loadPreguntaDetalle(selectedPreguntaId);
      // Recargar lista global para actualizar contadores
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
      {/* Banner Superior Foro */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <MessageSquare size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-400" />
                Foro Validado PB16
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Foro de Consultas y Preguntas</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Resuelve tus dudas académicas. Las respuestas oficializadas por profesores y ayudantes destacan con el distintivo de <span className="text-emerald-400 font-semibold">Respuesta Oficial</span>.
            </p>
          </div>

          <button
            onClick={() => setIsModalNuevaOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Hacer una Pregunta</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
        {/* Buscador */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en las preguntas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Pestañas de Filtro */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => setFiltro('todas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtro === 'todas'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todas ({preguntas.length})
          </button>
          <button
            onClick={() => setFiltro('oficial')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtro === 'oficial'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Con Respuesta Oficial
          </button>
          <button
            onClick={() => setFiltro('abiertas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtro === 'abiertas'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Sin Resolver
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Cargando preguntas del foro...</p>
        </div>
      ) : preguntasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8">
          <HelpCircle className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No hay preguntas disponibles</h3>
          <p className="text-slate-500 text-sm mt-1">Sé el primero en realizar una consulta sobre el contenido de este curso.</p>
          <button
            onClick={() => setIsModalNuevaOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
          >
            <Plus size={16} />
            <span>Crear Pregunta</span>
          </button>
        </div>
      ) : (
        /* Lista de Preguntas */
        <div className="space-y-4">
          {preguntasFiltradas.map((preg) => (
            <div
              key={preg.idPregunta}
              onClick={() => loadPreguntaDetalle(preg.idPregunta)}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {preg.tiene_respuesta_validada ? (
                      <OfficialAnswerBadge size="small" validatorRole="Oficial" />
                    ) : preg.estado === 'resuelta' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 size={12} />
                        Resuelta
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Abierta
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-medium">
                      Publicado por <strong className="text-slate-700 dark:text-slate-300">{preg.creador?.nombreCompleto || 'Usuario'}</strong>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                    {preg.titulo}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 line-clamp-2">
                    {preg.descripcion}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl shrink-0">
                  <MessageSquare size={14} className="text-indigo-500" />
                  <span>{preg.respuestas_count ?? 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Crear Pregunta */}
      {isModalNuevaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Publicar Nueva Pregunta</h3>
              <button
                onClick={() => setIsModalNuevaOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePregunta} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título de la consulta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ¿Cómo implementar el algoritmo de búsqueda?"
                  value={formPregunta.titulo}
                  onChange={(e) => setFormPregunta({ ...formPregunta, titulo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción o código *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Explica en detalle tu pregunta..."
                  value={formPregunta.descripcion}
                  onChange={(e) => setFormPregunta({ ...formPregunta, descripcion: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalNuevaOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPregunta}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2 rounded-xl transition"
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
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header del modal */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
              {loadingDetalle || !preguntaDetalle ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                  <span className="font-semibold text-sm">Cargando conversación...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {preguntaDetalle.respuestas?.some(r => r.validada) ? (
                      <OfficialAnswerBadge size="small" />
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Pregunta Abierta
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold leading-tight">{preguntaDetalle.titulo}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <User size={12} />
                    <span>Preguntado por {preguntaDetalle.creador?.nombreCompleto || 'Usuario'}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => { setSelectedPreguntaId(null); setPreguntaDetalle(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={22} />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {preguntaDetalle && (
                <>
                  {/* Cuerpo de la pregunta */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                    <p className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                      {preguntaDetalle.descripcion}
                    </p>
                  </div>

                  <hr className="border-slate-200 dark:border-slate-800" />

                  {/* Lista de Respuestas */}
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      <span>Respuestas ({preguntaDetalle.respuestas?.length || 0})</span>
                    </h4>

                    {preguntaDetalle.respuestas?.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        Todavía no hay respuestas. ¡Sé el primero en responder!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {preguntaDetalle.respuestas?.map((resp) => {
                          const authorRole = resp.usuario?.roles?.[0]?.rol || 'Estudiante';

                          return (
                            <div
                              key={resp.idRespuesta}
                              className={`p-5 rounded-2xl transition-all border ${
                                resp.validada
                                  ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow">
                                    {resp.usuario?.nombreCompleto?.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                        {resp.usuario?.nombreCompleto || 'Usuario'}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        {authorRole}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* PB16 Badges & Validation Button */}
                                <div className="flex items-center gap-2">
                                  {resp.validada && (
                                    <OfficialAnswerBadge validatorRole={authorRole} size="small" />
                                  )}

                                  {/* Botón de validación de respuesta (visible solo a roles autorizados) */}
                                  <ValidationButton
                                    respuestaId={resp.idRespuesta}
                                    isValidated={Boolean(resp.validada)}
                                    isAuthorized={isAuthorizedToValidate}
                                    onStatusChange={handleAnswerStatusChange}
                                  />
                                </div>
                              </div>

                              <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed pl-10">
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

            {/* Formulario de nueva respuesta */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700">
              <form onSubmit={handleCreateRespuesta} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe una respuesta académica..."
                  value={nuevoContenidoRespuesta}
                  onChange={(e) => setNuevoContenidoRespuesta(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={submittingRespuesta || !nuevoContenidoRespuesta.trim()}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-md"
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
