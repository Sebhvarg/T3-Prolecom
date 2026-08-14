import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForoHandlers } from '../../hooks/useForoHandlers';
import { useForoData } from '../../hooks/useForoData';
import PropTypes from 'prop-types';
import {
  MessageSquare, Plus, Search,
  Loader2, AlertCircle, ShieldCheck, Lock, Unlock, ArrowLeft
} from 'lucide-react';
import PreguntaCard from './PreguntaCard';
import HiloRespuestas from './HiloRespuestas';
import NuevaPreguntaModal from './NuevaPreguntaModal';
import EditPreguntaModal from './EditPreguntaModal';
import EditRespuestaModal from './EditRespuestaModal';
import ReporteModal from './ReporteModal';
import ForoEmptyState from './ForoEmptyState';

const filterAndSortPreguntas = (preguntas, search, filtro, orden, userId) => {
  const filtered = preguntas.filter((p) => {
    const matchSearch = p.titulo.toLowerCase().includes(search.toLowerCase()) ||
                        p.descripcion.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (filtro === 'mis_preguntas') return p.idUsuarioCreador === userId;
    if (filtro === 'sin_respuesta') return (p.respuestas_count ?? 0) === 0;
    if (filtro === 'oficial') return p.tiene_respuesta_validada;
    if (filtro === 'fijadas') return p.fijada;
    return true;
  });

  return filtered.sort((a, b) => {
    if (a.fijada !== b.fijada) return b.fijada ? 1 : -1;
    if (orden === 'respuestas') return (b.respuestas_count ?? 0) - (a.respuestas_count ?? 0);
    if (orden === 'vistas') return (b.vistas ?? 0) - (a.vistas ?? 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });
};

const checkAuthToValidate = (user) => Boolean(
  user?.rol === 'Administrador' ||
  user?.rol === 'Profesor' ||
  user?.rol === 'Ayudante' ||
  user?.roles?.some(r => ['Administrador', 'Profesor', 'Ayudante'].includes(r.rol || r))
);

const checkCanManageForo = (user) => Boolean(
  user?.rol === 'Administrador' ||
  user?.rol === 'Moderador' ||
  user?.rol === 'Profesor' ||
  user?.roles?.some(r => ['Administrador', 'Moderador', 'Profesor'].includes(r.rol || r))
);

const resolveTargetForoIdHelper = (idForo, temas) => {
  const isValidId = (val) => Boolean(val && val !== 'undefined' && val !== 'null' && !Number.isNaN(Number(val)));
  if (isValidId(idForo)) return Number(idForo);

  const items = (temas || []).flatMap(t => t.items || []);
  const match = items.find(item => {
    const pid = item.idForo || (item.itemable_type?.includes('Foro') ? item.itemable_id : null);
    return isValidId(pid);
  });

  if (match) {
    const pid = match.idForo || (match.itemable_type?.includes('Foro') ? match.itemable_id : null);
    return Number(pid);
  }
  return null;
};

const ForoSeccion = ({ idForo, user, temas, onBack }) => {
  const [searchParams] = useSearchParams();
  const initialPreguntaId = searchParams.get('preguntaId');

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [orden, setOrden] = useState('recientes');

  const [isModalNuevaOpen, setIsModalNuevaOpen] = useState(false);
  const [submittingPregunta, setSubmittingPregunta] = useState(false);

  const [editingPregunta, setEditingPregunta] = useState(null);
  const [submittingEditPregunta, setSubmittingEditPregunta] = useState(false);

  const [editingRespuesta, setEditingRespuesta] = useState(null);
  const [submittingEditRespuesta, setSubmittingEditRespuesta] = useState(false);

  const [reportModalData, setReportModalData] = useState({ isOpen: false, targetId: null, targetType: 'pregunta' });

  const isAuthorizedToValidate = checkAuthToValidate(user);
  const canManageForo = checkCanManageForo(user);

  const resolveTargetForoId = useCallback(() => resolveTargetForoIdHelper(idForo, temas), [idForo, temas]);

  const {
    foro,
    preguntas,
    loading,
    error,
    selectedPreguntaId,
    setSelectedPreguntaId,
    preguntaDetalle,
    setPreguntaDetalle,
    loadPreguntaDetalle,
    fetchForoData,
  } = useForoData({ resolveTargetForoId, initialPreguntaId });

  const targetForoId = resolveTargetForoId();

  const {
    handleCreatePregunta,
    handleEditPreguntaSubmit,
    handleDeletePregunta,
    handleTogglePin,
    handleToggleEstadoForo,
    handleEditRespuestaSubmit,
    handleDeleteRespuesta,
  } = useForoHandlers({
    idForo: targetForoId || idForo,
    selectedPreguntaId,
    setSelectedPreguntaId,
    setPreguntaDetalle,
    setEditingPregunta,
    setSubmittingPregunta,
    setSubmittingEditPregunta,
    setEditingRespuesta,
    setSubmittingEditRespuesta,
    loadPreguntaDetalle,
    fetchForoData,
    setIsModalNuevaOpen,
  });

  const preguntasProcesadas = filterAndSortPreguntas(preguntas, search, filtro, orden, user?.idUsuario);

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

  if (!loading && !targetForoId) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs p-8 max-w-lg mx-auto my-6 space-y-3">
        <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Sin Foro de Discusión Activo</h3>
          <p className="text-slate-500 text-xs mt-2 max-w-sm mx-auto leading-relaxed font-medium">
            Este curso aún no cuenta con un foro de preguntas agregado a sus temas. Los profesores pueden crear uno agregando una actividad de tipo Foro en cualquier tema.
          </p>
        </div>
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

      <ForoMainContent
        loading={loading}
        preguntasProcesadas={preguntasProcesadas}
        isForoClosed={isForoClosed}
        onOpenCreateModal={() => setIsModalNuevaOpen(true)}
        user={user}
        loadPreguntaDetalle={loadPreguntaDetalle}
        handleTogglePin={handleTogglePin}
        setEditingPregunta={setEditingPregunta}
        handleDeletePregunta={handleDeletePregunta}
        setReportModalData={setReportModalData}
      />

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

const ForoHiloSelectedView = ({
  preguntaDetalle,
  user,
  isAuthorizedToValidate,
  isForoClosed,
  onClose,
  onRefresh,
  onEditRespuesta,
  onDeleteRespuesta,
  onReportRespuesta,
  editingRespuesta,
  onCloseEditRespuesta,
  handleEditRespuestaSubmit,
  submittingEditRespuesta,
  reportModalData,
  onCloseReportModal,
}) => (
  <div className="space-y-6">
    <HiloRespuestas
      pregunta={preguntaDetalle}
      currentUser={user}
      isAuthorizedToValidate={isAuthorizedToValidate}
      isForoClosed={isForoClosed}
      onClose={onClose}
      onRefresh={onRefresh}
      onEditRespuesta={onEditRespuesta}
      onDeleteRespuesta={onDeleteRespuesta}
      onReportRespuesta={onReportRespuesta}
    />

    <EditRespuestaModal
      isOpen={Boolean(editingRespuesta)}
      onClose={onCloseEditRespuesta}
      onSubmit={handleEditRespuestaSubmit}
      respuesta={editingRespuesta}
      submitting={submittingEditRespuesta}
    />

    <ReporteModal
      isOpen={reportModalData.isOpen}
      onClose={onCloseReportModal}
      targetId={reportModalData.targetId || 0}
      targetType={reportModalData.targetType}
    />
  </div>
);

const ForoMainContent = ({
  loading,
  preguntasProcesadas,
  isForoClosed,
  onOpenCreateModal,
  user,
  loadPreguntaDetalle,
  handleTogglePin,
  setEditingPregunta,
  handleDeletePregunta,
  setReportModalData,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-10 h-10 text-[#2c5364] animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Cargando preguntas del foro...</p>
      </div>
    );
  }

  if (preguntasProcesadas.length === 0) {
    return (
      <ForoEmptyState
        onOpenCreateModal={onOpenCreateModal}
        isClosed={isForoClosed}
      />
    );
  }

  return (
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
};

ForoSeccion.propTypes = {
  idForo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  user: PropTypes.object,
  onBack: PropTypes.func,
};

export default ForoSeccion;
