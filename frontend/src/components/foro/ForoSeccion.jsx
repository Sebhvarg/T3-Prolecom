import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  MessageSquare, Plus, Search,
  Loader2, AlertCircle, ShieldCheck, Lock, Unlock, ArrowLeft
} from 'lucide-react';
import { foroService } from '../../api/foroService';
import PreguntaCard from './PreguntaCard';
import HiloRespuestas from './HiloRespuestas';
import NuevaPreguntaModal from './NuevaPreguntaModal';
import EditPreguntaModal from './EditPreguntaModal';
import EditRespuestaModal from './EditRespuestaModal';
import ReporteModal from './ReporteModal';
import ForoEmptyState from './ForoEmptyState';

const ForoSeccion = ({ idForo, user, onBack }) => {
  const [searchParams] = useSearchParams();
  const initialPreguntaId = searchParams.get('preguntaId');

  const [foro, setForo] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todas'); // 'todas' | 'oficial' | 'abiertas' | 'fijadas'
  const [orden, setOrden] = useState('recientes'); // 'recientes' | 'respuestas' | 'vistas'

  // Modales
  const [isModalNuevaOpen, setIsModalNuevaOpen] = useState(false);
  const [submittingPregunta, setSubmittingPregunta] = useState(false);

  const [editingPregunta, setEditingPregunta] = useState(null);
  const [submittingEditPregunta, setSubmittingEditPregunta] = useState(false);

  const [editingRespuesta, setEditingRespuesta] = useState(null);
  const [submittingEditRespuesta, setSubmittingEditRespuesta] = useState(false);

  const [reportModalData, setReportModalData] = useState({ isOpen: false, targetId: null, targetType: 'pregunta' });

  // Detalle Pregunta seleccionada (Hilo)
  const [selectedPreguntaId, setSelectedPreguntaId] = useState(initialPreguntaId ? Number(initialPreguntaId) : null);
  const [preguntaDetalle, setPreguntaDetalle] = useState(null);

  // Verificación RBAC para validar respuestas y gestionar el foro
  const isAuthorizedToValidate = Boolean(
    user?.rol === 'Administrador' ||
    user?.rol === 'Profesor' ||
    user?.rol === 'Ayudante' ||
    user?.roles?.some(r => ['Administrador', 'Profesor', 'Ayudante'].includes(r.rol || r))
  );

  const canManageForo = Boolean(
    user?.rol === 'Administrador' ||
    user?.rol === 'Moderador' ||
    user?.rol === 'Profesor' ||
    user?.roles?.some(r => ['Administrador', 'Moderador', 'Profesor'].includes(r.rol || r))
  );

  const loadPreguntaDetalle = useCallback(async (idPregunta) => {
    setSelectedPreguntaId(idPregunta);
    try {
      const data = await foroService.getPreguntaDetalle(idPregunta);
      setPreguntaDetalle(data);
    } catch (err) {
      console.error(err);
      alert('Error al cargar el detalle de la pregunta.');
    }
  }, []);

  const fetchForoData = useCallback(async () => {
    if (!idForo) {
      setLoading(false);
      setError('No se ha especificado un ID de foro válido.');
      return;
    }
    try {
      const [foroData, preguntasData] = await Promise.all([
        foroService.getForo(idForo),
        foroService.getPreguntasForo(idForo),
      ]);
      setForo(foroData);
      setPreguntas(preguntasData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar los datos del foro.');
    } finally {
      setLoading(false);
    }
  }, [idForo]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      await fetchForoData();
      if (initialPreguntaId && !ignore) {
        await loadPreguntaDetalle(Number(initialPreguntaId));
      }
    }
    init();
    return () => { ignore = true; };
  }, [fetchForoData, initialPreguntaId, loadPreguntaDetalle]);

  const handleCreatePregunta = async (preguntaData) => {
    setSubmittingPregunta(true);
    try {
      await foroService.createPregunta(idForo, preguntaData);
      setIsModalNuevaOpen(false);
      fetchForoData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al publicar la pregunta.');
    } finally {
      setSubmittingPregunta(false);
    }
  };

  const handleEditPreguntaSubmit = async (idPregunta, data) => {
    setSubmittingEditPregunta(true);
    try {
      await foroService.updatePregunta(idPregunta, data);
      setEditingPregunta(null);
      fetchForoData();
      if (selectedPreguntaId === idPregunta) {
        loadPreguntaDetalle(idPregunta);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al actualizar la pregunta.');
    } finally {
      setSubmittingEditPregunta(false);
    }
  };

  const handleDeletePregunta = async (idPregunta) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta pregunta y todas sus respuestas?')) return;

    try {
      await foroService.deletePregunta(idPregunta);
      if (selectedPreguntaId === idPregunta) {
        setSelectedPreguntaId(null);
        setPreguntaDetalle(null);
      }
      fetchForoData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al eliminar la pregunta.');
    }
  };

  const handleTogglePin = async (idPregunta) => {
    try {
      await foroService.toggleFijarPregunta(idPregunta);
      fetchForoData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al cambiar el estado fijado.');
    }
  };

  const handleToggleEstadoForo = async () => {
    try {
      await foroService.toggleEstadoForo(idForo);
      fetchForoData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al cambiar el estado del foro.');
    }
  };

  const handleEditRespuestaSubmit = async (idRespuesta, data) => {
    setSubmittingEditRespuesta(true);
    try {
      await foroService.updateRespuesta(idRespuesta, data);
      setEditingRespuesta(null);
      if (selectedPreguntaId) {
        loadPreguntaDetalle(selectedPreguntaId);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al editar la respuesta.');
    } finally {
      setSubmittingEditRespuesta(false);
    }
  };

  const handleDeleteRespuesta = async (idRespuesta) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta respuesta?')) return;

    try {
      await foroService.deleteRespuesta(idRespuesta);
      if (selectedPreguntaId) {
        loadPreguntaDetalle(selectedPreguntaId);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al eliminar la respuesta.');
    }
  };

  // Filtrado y Ordenamiento
  let preguntasProcesadas = preguntas.filter(p => {
    const matchSearch = p.titulo.toLowerCase().includes(search.toLowerCase()) ||
                        p.descripcion.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (filtro === 'mis_preguntas') return p.idUsuarioCreador === user?.idUsuario;
    if (filtro === 'sin_respuesta') return (p.respuestas_count ?? 0) === 0;
    if (filtro === 'oficial') return p.tiene_respuesta_validada;
    if (filtro === 'fijadas') return p.fijada;
    return true;
  });

  // Ordenamiento adicional
  preguntasProcesadas.sort((a, b) => {
    // Las fijadas siempre primero
    if (a.fijada !== b.fijada) return b.fijada ? 1 : -1;

    if (orden === 'respuestas') {
      return (b.respuestas_count ?? 0) - (a.respuestas_count ?? 0);
    }
    if (orden === 'vistas') {
      return (b.vistas ?? 0) - (a.vistas ?? 0);
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const isForoClosed = foro?.estado === 'cerrado';

  // Si hay una pregunta seleccionada, renderizar la Vista Completa del Hilo
  if (selectedPreguntaId && preguntaDetalle) {
    return (
      <div className="space-y-6">
        <HiloRespuestas
          pregunta={preguntaDetalle}
          currentUser={user}
          isAuthorizedToValidate={isAuthorizedToValidate}
          isForoClosed={isForoClosed}
          onClose={() => { setSelectedPreguntaId(null); setPreguntaDetalle(null); }}
          onRefresh={() => loadPreguntaDetalle(selectedPreguntaId)}
          onEditRespuesta={(r) => setEditingRespuesta(r)}
          onDeleteRespuesta={handleDeleteRespuesta}
          onReportRespuesta={(id) => setReportModalData({ isOpen: true, targetId: id, targetType: 'respuesta' })}
        />

        <EditRespuestaModal
          isOpen={Boolean(editingRespuesta)}
          onClose={() => setEditingRespuesta(null)}
          onSubmit={handleEditRespuestaSubmit}
          respuesta={editingRespuesta}
          submitting={submittingEditRespuesta}
        />

        <ReporteModal
          isOpen={reportModalData.isOpen}
          onClose={() => setReportModalData({ isOpen: false, targetId: null, targetType: 'pregunta' })}
          targetId={reportModalData.targetId || 0}
          targetType={reportModalData.targetType}
        />
      </div>
    );
  }

  let mainContent;
  if (loading) {
    mainContent = (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-10 h-10 text-[#2c5364] animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Cargando preguntas del foro...</p>
      </div>
    );
  } else if (preguntasProcesadas.length === 0) {
    mainContent = (
      <ForoEmptyState
        onOpenCreateModal={() => setIsModalNuevaOpen(true)}
        isClosed={isForoClosed}
      />
    );
  } else {
    mainContent = (
      <div className="space-y-4">
        {preguntasProcesadas.map((preg) => (
          <PreguntaCard
            key={preg.idPregunta}
            pregunta={preg}
            currentUser={user}
            onSelect={loadPreguntaDetalle}
            onPinToggle={handleTogglePin}
            onEdit={(p) => setEditingPregunta(p)}
            onDelete={handleDeletePregunta}
            onReport={(id) => setReportModalData({ isOpen: true, targetId: id, targetType: 'pregunta' })}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón Volver si fue invocado como vista */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#2c5364] transition"
        >
          <ArrowLeft size={16} />
          <span>Volver a los Temas del Curso</span>
        </button>
      )}

      {/* Banner Superior del Foro */}
      <div className="bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 pointer-events-none">
          <MessageSquare size={240} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-300" />
                Foro Académico (PB12)
              </span>

              {isForoClosed ? (
                <span className="px-3 py-1 bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-bold rounded-full flex items-center gap-1">
                  <Lock size={12} /> Foro Cerrado
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold rounded-full flex items-center gap-1">
                  <Unlock size={12} /> Foro Abierto
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {foro?.titulo || 'Foro de Discusión'}
            </h2>
            <p className="text-white/80 text-sm max-w-xl leading-relaxed">
              {foro?.descripcion || 'Espacio académico para resolver dudas y compartir explicaciones con tus compañeros e instructores.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {canManageForo && (
              <button
                type="button"
                onClick={handleToggleEstadoForo}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-3 rounded-xl backdrop-blur-md transition border border-white/20"
                title={isForoClosed ? 'Abrir foro' : 'Cerrar foro'}
              >
                {isForoClosed ? <Unlock size={16} /> : <Lock size={16} />}
                <span>{isForoClosed ? 'Abrir Foro' : 'Cerrar Foro'}</span>
              </button>
            )}

            {!isForoClosed && (
              <button
                type="button"
                onClick={() => setIsModalNuevaOpen(true)}
                className="flex items-center justify-center gap-2 bg-white text-[#203a43] hover:bg-gray-100 font-bold px-5 py-3 rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Plus size={18} />
                <span>Hacer una Pregunta</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Búsqueda y Ordenamiento */}
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

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          {/* Botones de Filtro */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold flex-wrap">
            <button
              type="button"
              onClick={() => setFiltro('todas')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtro === 'todas' ? 'bg-white text-[#2c5364] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todas ({preguntas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('mis_preguntas')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtro === 'mis_preguntas' ? 'bg-white text-[#2c5364] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mis Preguntas
            </button>
            <button
              type="button"
              onClick={() => setFiltro('sin_respuesta')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtro === 'sin_respuesta' ? 'bg-white text-[#2c5364] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sin Respuesta
            </button>
            <button
              type="button"
              onClick={() => setFiltro('oficial')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtro === 'oficial' ? 'bg-white text-[#2c5364] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Resueltas
            </button>
            <button
              type="button"
              onClick={() => setFiltro('fijadas')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtro === 'fijadas' ? 'bg-white text-[#2c5364] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Fijadas
            </button>
          </div>

          {/* Selector de Orden */}
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
          >
            <option value="recientes">Más recientes</option>
            <option value="respuestas">Más respuestas</option>
            <option value="vistas">Más vistas</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {mainContent}

      {/* Modal Nueva Pregunta */}
      <NuevaPreguntaModal
        isOpen={isModalNuevaOpen}
        onClose={() => setIsModalNuevaOpen(false)}
        onSubmit={handleCreatePregunta}
        submitting={submittingPregunta}
      />

      {/* Modal Editar Pregunta */}
      <EditPreguntaModal
        isOpen={Boolean(editingPregunta)}
        onClose={() => setEditingPregunta(null)}
        onSubmit={handleEditPreguntaSubmit}
        pregunta={editingPregunta}
        submitting={submittingEditPregunta}
      />

      {/* Modal Editar Respuesta */}
      <EditRespuestaModal
        isOpen={Boolean(editingRespuesta)}
        onClose={() => setEditingRespuesta(null)}
        onSubmit={handleEditRespuestaSubmit}
        respuesta={editingRespuesta}
        submitting={submittingEditRespuesta}
      />

      {/* Modal Reportar Contenido */}
      <ReporteModal
        isOpen={reportModalData.isOpen}
        onClose={() => setReportModalData({ isOpen: false, targetId: null, targetType: 'pregunta' })}
        targetId={reportModalData.targetId || 0}
        targetType={reportModalData.targetType}
      />
    </div>
  );
};

ForoSeccion.propTypes = {
  idForo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  user: PropTypes.object,
  onBack: PropTypes.func,
};

export default ForoSeccion;
