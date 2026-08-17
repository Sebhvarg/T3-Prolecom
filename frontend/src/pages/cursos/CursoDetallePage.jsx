import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { useSecureViewer } from '../../hooks/useSecureViewer';
import { useCursoHandlers } from '../../hooks/useCursoHandlers';
import { useCursoDataLoader } from '../../hooks/useCursoDataLoader';
import ForoSeccion from '../../components/foro/ForoSeccion';
import QuizSeccion from '../../components/quizzes/QuizSeccion';
import CourseProgressBar from '../../components/cursos/CourseProgressBar';
import PDFSecureViewer from '../../components/cursos/PDFSecureViewer';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { 
  ArrowLeft, Plus, Trash2, FileText, Play, Download, Eye, 
  AlertCircle, Loader2, CheckCircle2, ChevronDown, ChevronUp, Code, Pencil,
  MessageSquare, BookOpen, HelpCircle
} from 'lucide-react';

let testCaseIdCounter = 0;
const generateTestCaseId = () => {
  testCaseIdCounter += 1;
  return `tc-id-${testCaseIdCounter}`;
};

const renderItemMetadata = (item) => {
  const typeStr = item.itemable_type || '';
  const isDesafio = typeStr.includes('Desafio') || Boolean(item.dificultad) || Boolean(item.itemable?.dificultad);
  const isForo = typeStr.includes('Foro') || Boolean(item.itemable?.idForo) || Boolean(item.idForo) || Boolean(item.titulo?.includes('Foro'));
  const isQuiz = typeStr.includes('Quiz') || Boolean(item.itemable?.idQuiz) || Boolean(item.titulo?.includes('Evaluación'));

  let icon = <FileText size={18} />;
  let iconBg = 'bg-slate-100 text-[#2c5364]';
  let subtitle = `Material (${item.tipo || item.itemable?.tipo || 'Lectura'})`;

  if (isDesafio) {
    icon = <Code size={18} />;
    iconBg = 'bg-amber-100 text-amber-900';
    subtitle = `Desafío (${item.dificultad || item.itemable?.dificultad || 'Práctico'})`;
  } else if (isForo) {
    icon = <MessageSquare size={18} />;
    iconBg = 'bg-purple-100 text-purple-900';
    subtitle = 'Foro de Discusión';
  } else if (isQuiz) {
    icon = <HelpCircle size={18} />;
    iconBg = 'bg-indigo-100 text-indigo-900';
    subtitle = 'Evaluación / Quiz';
  }

  const isMaterial = !isDesafio && !isForo && !isQuiz;
  return { icon, iconBg, subtitle, isDesafio, isForo, isQuiz, isMaterial };
};

const TemaItemCard = ({
  item,
  itemIdx,
  temaId,
  canManage,
  canResolve,
  handleOpenSecureViewer,
  handleDownloadMaterial,
  handleDeleteMaterial,
  handleDeleteDesafio,
  handleOpenForoModal,
  handleDeleteForo,
  navigate,
  idCurso,
  setActiveTab,
}) => {
  const { icon, iconBg, subtitle, isDesafio, isForo, isQuiz, isMaterial } = renderItemMetadata(item);
  const itemKey = item.idItem || item.idMaterial || item.idDesafio || item.idForo || item.idQuiz || `item-${itemIdx}`;

  return (
    <div key={itemKey} className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-between items-center gap-4 hover:border-slate-300 transition-all">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl text-xs font-black ${iconBg}`}>
          {icon}
        </div>
        <div>
          <h4 className="font-extrabold text-xs text-slate-900">
            {item.titulo || item.itemable?.titulo || item.nombre}
          </h4>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {subtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isMaterial && (
          <>
            <button
              type="button"
              onClick={() => handleOpenSecureViewer(item)}
              className="px-3 py-1.5 bg-[#2c5364]/10 hover:bg-[#2c5364]/20 text-[#2c5364] font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Eye size={14} />
              <span>Ver Documento</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadMaterial(item)}
              className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Descargar Material"
            >
              <Download size={14} />
            </button>
          </>
        )}

        {isDesafio && (
          <button
            type="button"
            onClick={() => {
              const targetDesafioId = item.idDesafio || item.itemable_id || item.itemable?.idDesafio || item.idItem;
              navigate(`/cursos/${idCurso}/desafios/${targetDesafioId}`);
            }}
            className="px-3 py-1.5 bg-[#2c5364] hover:bg-[#203a43] text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Play size={14} fill="currentColor" />
            <span>Resolver Desafío</span>
          </button>
        )}

        {isForo && (
          <button
            type="button"
            onClick={() => setActiveTab('foro')}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <MessageSquare size={14} />
            <span>Ir al Foro</span>
          </button>
        )}

        {isQuiz && canResolve && (
          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <HelpCircle size={14} />
            <span>Rendir Quiz</span>
          </button>
        )}

        {canManage && (
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            {isMaterial && (
              <button
                type="button"
                onClick={() => handleDeleteMaterial(item)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                title="Eliminar Material"
              >
                <Trash2 size={14} />
              </button>
            )}
            {isDesafio && (
              <button
                type="button"
                onClick={() => handleDeleteDesafio(item.idDesafio || item.itemable_id)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                title="Eliminar Desafío"
              >
                <Trash2 size={14} />
              </button>
            )}
            {isForo && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenForoModal(temaId, item)}
                  className="p-1.5 text-slate-400 hover:text-[#2c5364] rounded-lg transition-colors cursor-pointer"
                  title="Editar Foro"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteForo(item)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar Foro"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const checkCanManage = (user) => {
  if (!user) return false;
  const rol = user.rol;
  return rol === 'Administrador' || rol === 'Profesor' || rol === 'Ayudante';
};

const CursoHeroCard = ({ curso, user, onNavigateTab, handleOpenSecureViewer }) => {
  const progreso = curso.progreso;
  const isPrivado = curso.esPrivado;
  const badgeClass = isPrivado ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
  const badgeText = isPrivado ? 'Curso Privado' : 'Curso Público';

  return (
    <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider border border-slate-200 shrink-0">
            {curso.lenguaje || 'General'}
          </span>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight shrink-0">{curso.titulo}</h1>
          {curso.descripcion && (
            <span className="hidden md:inline-block text-slate-500 text-xs font-medium border-l border-slate-200 pl-3 truncate max-w-lg">
              {curso.descripcion}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-3 py-1 rounded-lg text-xs font-black border ${badgeClass}`}>
            {badgeText}
          </span>
        </div>
      </div>

      {user?.rol === 'Estudiante' && (
        <CourseProgressBar
          idCurso={curso.idCurso}
          progreso={progreso}
          onNavigateTab={onNavigateTab}
          onSelectMaterial={(matId) => {
            const allItems = (curso.temas || []).flatMap(t => t.items || []);
            const targetMat = allItems.find(i => (i.idMaterial === matId || i.itemable_id === matId || i.idItem === matId));
            if (targetMat && handleOpenSecureViewer) {
              handleOpenSecureViewer(targetMat);
            }
          }}
        />
      )}
    </div>
  );
};

const CursoNavTabs = ({ activeTab, setActiveTab, totalTemas }) => {
  const tabs = [
    { id: 'temas', label: `Temas y Módulos (${totalTemas})`, icon: BookOpen },
    { id: 'quizzes', label: 'Cuestionarios & Quizzes', icon: HelpCircle },
    { id: 'foro', label: 'Foro del Curso', icon: MessageSquare },
  ];

  return (
    <div className="flex border-b border-slate-200 overflow-x-auto">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;
        const activeClass = isActive
          ? 'border-[#2c5364] text-[#2c5364]'
          : 'border-transparent text-slate-500 hover:text-slate-900';

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-all shrink-0 cursor-pointer ${activeClass}`}
          >
            <Icon size={18} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const CursoDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const location = useLocation();

  const {
    curso,
    loading,
    error,
    setError,
    expandedTemas,
    fetchCurso,
    toggleTema,
  } = useCursoDataLoader(id);

  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return ['temas', 'quizzes', 'foro'].includes(tab) ? tab : 'temas';
  });

  // Modales Estado
  const [isTemaModalOpen, setIsTemaModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isDesafioModalOpen, setIsDesafioModalOpen] = useState(false);
  const [isForoModalOpen, setIsForoModalOpen] = useState(false);

  const [temaEditId, setTemaEditId] = useState(null);
  const [activeTemaId, setActiveTemaId] = useState(null);

  // Form Tema
  const [temaNombre, setTemaNombre] = useState('');
  const [temaDescripcion, setTemaDescripcion] = useState('');

  // Form Material
  const [materialNombre, setMaterialNombre] = useState('');
  const [materialTipo, setMaterialTipo] = useState('documento');
  const [materialFile, setMaterialFile] = useState(null);

  // Form Desafío
  const [desafioTitulo, setDesafioTitulo] = useState('');
  const [desafioDescripcion, setDesafioDescripcion] = useState('');
  const [desafioDificultad, setDesafioDificultad] = useState('Facil');
  const [desafioLenguaje, setDesafioLenguaje] = useState('python');
  const [desafioPlantillaCodigo, setDesafioPlantillaCodigo] = useState('');
  const [desafioTestCases, setDesafioTestCases] = useState([
    { id: generateTestCaseId(), input: '', expected_output: '', is_public: true }
  ]);

  // Form Foro
  const [foroEditId, setForoEditId] = useState(null);
  const [foroTitulo, setForoTitulo] = useState('');
  const [foroDescripcion, setForoDescripcion] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const {
    activeViewerMaterial,
    viewerBlobUrl,
    viewerLoading,
    viewerError,
    handleOpenSecureViewer,
    handleCloseSecureViewer,
    handleDownloadMaterial,
  } = useSecureViewer();

  const canManage = checkCanManage(user);

  // Confirm Modal State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    variant: 'danger',
    onConfirm: () => {},
  });

  const {
    handleOpenTemaModal,
    handleSaveTema,
    handleDeleteTema,
    handleOpenMaterialModal,
    handleSaveMaterial,
    handleDeleteMaterial,
    handleOpenDesafioModal,
    handleSaveDesafio,
    handleDeleteDesafio,
    handleOpenForoModal,
    handleSaveForo,
    handleDeleteForo,
  } = useCursoHandlers({
    id,
    temaEditId,
    temaNombre,
    temaDescripcion,
    materialFile,
    materialTipo,
    materialNombre,
    activeTemaId,
    desafioTitulo,
    desafioDescripcion,
    desafioDificultad,
    desafioLenguaje,
    desafioPlantillaCodigo,
    desafioTestCases,
    foroEditId,
    foroTitulo,
    foroDescripcion,
    setSubmitting,
    setError,
    setSuccess,
    setIsTemaModalOpen,
    setTemaEditId,
    setTemaNombre,
    setTemaDescripcion,
    setActiveTemaId,
    setMaterialNombre,
    setMaterialTipo,
    setMaterialFile,
    setIsMaterialModalOpen,
    setIsDesafioModalOpen,
    setIsForoModalOpen,
    setForoEditId,
    setForoTitulo,
    setForoDescripcion,
    setDesafioTitulo,
    setDesafioDescripcion,
    setDesafioDificultad,
    setDesafioLenguaje,
    setDesafioPlantillaCodigo,
    setDesafioTestCases,
    generateTestCaseId,
    fetchCurso,
    setConfirmState,
  });

  useEffect(() => {
    if (location.state?.action && curso?.temas?.length > 0) {
      const action = location.state.action;
      const firstTemaId = curso.temas[0].idTema;
      if (action === 'createMaterial') {
        handleOpenMaterialModal(firstTemaId);
      } else if (action === 'createDesafio') {
        handleOpenDesafioModal(firstTemaId);
      } else if (action === 'createForo') {
        handleOpenForoModal(firstTemaId);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, curso?.temas, handleOpenMaterialModal, handleOpenDesafioModal, handleOpenForoModal]);

  const handleAddTestCase = () => {
    setDesafioTestCases((prev) => [
      ...prev,
      { id: generateTestCaseId(), input: '', expected_output: '', is_public: true },
    ]);
  };

  const handleRemoveTestCase = (tcId) => {
    if (desafioTestCases.length <= 1) return;
    setDesafioTestCases((prev) => prev.filter((tc) => tc.id !== tcId));
  };

  const handleTestCaseChange = (tcId, field, value) => {
    setDesafioTestCases((prev) =>
      prev.map((tc) => (tc.id === tcId ? { ...tc, [field]: value } : tc))
    );
  };

  if (loading && !curso) {
    return (
      <DashboardContainer activeSection="Cursos" title="Cargando Curso...">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-[#2c5364]" />
        </div>
      </DashboardContainer>
    );
  }

  if (!curso) {
    return (
      <DashboardContainer activeSection="Cursos" title="Curso no Encontrado">
        <div className="p-8 bg-red-50 rounded-2xl border border-red-200 text-center space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h2 className="text-xl font-bold text-red-900">No se pudo encontrar el curso solicitado.</h2>
          <button
            type="button"
            onClick={() => navigate('/cursos')}
            className="px-6 py-2 bg-[#2c5364] text-[#ffffff] rounded-xl font-bold text-sm"
          >
            Volver a la Lista de Cursos
          </button>
        </div>
      </DashboardContainer>
    );
  }



  return (
    <DashboardContainer activeSection="Cursos" title={curso.titulo}>
      <div className="space-y-6">

        {/* Botón Volver */}
        <button
          type="button"
          onClick={() => navigate('/cursos')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Volver a Cursos</span>
        </button>

        {/* Alert Notificaciones */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-xs font-bold">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2 text-green-700 text-xs font-bold">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Hero Card del Curso */}
        <CursoHeroCard
          curso={curso}
          user={user}
          onNavigateTab={setActiveTab}
          handleOpenSecureViewer={handleOpenSecureViewer}
        />

        {/* Navegación por pestañas */}
        <CursoNavTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalTemas={curso.temas?.length || 0}
        />

        {/* Renderizado Condicional por Pestaña */}
        <CursoTabContent
          activeTab={activeTab}
          id={id}
          user={user}
          curso={curso}
          canManage={canManage}
          setActiveTab={setActiveTab}
          fetchCurso={fetchCurso}
          handleOpenTemaModal={handleOpenTemaModal}
          handleOpenMaterialModal={handleOpenMaterialModal}
          handleOpenDesafioModal={handleOpenDesafioModal}
          handleOpenForoModal={handleOpenForoModal}
          handleDeleteForo={handleDeleteForo}
          handleDeleteTema={handleDeleteTema}
          toggleTema={toggleTema}
          expandedTemas={expandedTemas}
          handleOpenSecureViewer={handleOpenSecureViewer}
          handleDownloadMaterial={handleDownloadMaterial}
          handleDeleteMaterial={handleDeleteMaterial}
          handleDeleteDesafio={handleDeleteDesafio}
          navigate={navigate}
        />

      </div>

      {/* Modal Crear / Editar Tema */}
      <Modal
        isOpen={isTemaModalOpen}
        onClose={() => setIsTemaModalOpen(false)}
        title={temaEditId ? "Editar Tema / Módulo" : "Nuevo Tema del Curso"}
      >
        <form onSubmit={handleSaveTema} className="space-y-4">
          <div>
            <label htmlFor="tema-form-nombre" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Nombre del Tema</label>
            <input 
              id="tema-form-nombre"
              type="text"
              required
              placeholder="Ej. Introducción a Funciones y Recursión"
              value={temaNombre}
              onChange={(e) => setTemaNombre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            />
          </div>

          <div>
            <label htmlFor="tema-form-descripcion" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Descripción (Opcional)</label>
            <textarea 
              id="tema-form-descripcion"
              rows="3"
              placeholder="Explica qué aprenderán los estudiantes en esta sección..."
              value={temaDescripcion}
              onChange={(e) => setTemaDescripcion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsTemaModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>{submitting ? 'Guardando...' : temaEditId ? 'Actualizar Tema' : 'Crear Tema'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Subir Material */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        title="Subir Material de Aprendizaje"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          <div>
            <label htmlFor="mat-form-nombre" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Título del Material</label>
            <input 
              id="mat-form-nombre"
              type="text"
              required
              placeholder="Ej. Guía Práctica de Sintaxis"
              value={materialNombre}
              onChange={(e) => setMaterialNombre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            />
          </div>

          <div>
            <label htmlFor="mat-form-tipo" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Tipo de Recurso</label>
            <select 
              id="mat-form-tipo"
              value={materialTipo}
              onChange={(e) => setMaterialTipo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            >
              <option value="documento">Documento / Guía (PDF)</option>
              <option value="video">Video Explicativo (MP4)</option>
            </select>
          </div>

          <div>
            <label htmlFor="mat-form-archivo" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Archivo de Origen</label>
            <input 
              id="mat-form-archivo"
              type="file"
              required
              onChange={(e) => setMaterialFile(e.target.files[0])}
              className="w-full text-xs font-semibold text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#2c5364]/10 file:text-[#2c5364] hover:file:bg-[#2c5364]/20 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsMaterialModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>{submitting ? 'Subiendo...' : 'Cargar Material'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Crear / Editar Foro */}
      <Modal
        isOpen={isForoModalOpen}
        onClose={() => setIsForoModalOpen(false)}
        title={foroEditId ? "Editar Foro de Discusión" : "Crear Foro de Discusión en Tema"}
      >
        <form onSubmit={handleSaveForo} className="space-y-4">
          {curso?.temas?.length > 0 && (
            <div>
              <label htmlFor="foro-form-tema" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Módulo / Tema del Curso <span className="text-red-500">*</span></label>
              <select
                id="foro-form-tema"
                value={activeTemaId || (curso.temas[0]?.idTema || '')}
                onChange={(e) => setActiveTemaId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2c5364] cursor-pointer"
              >
                {curso.temas.map((t) => (
                  <option key={t.idTema} value={t.idTema}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="foro-form-titulo" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Título del Foro <span className="text-red-500">*</span></label>
            <input 
              id="foro-form-titulo"
              type="text"
              required
              placeholder="Ej. Foro: Dudas y Consultas sobre Bucles"
              value={foroTitulo}
              onChange={(e) => setForoTitulo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            />
          </div>

          <div>
            <label htmlFor="foro-form-descripcion" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Descripción / Normas (Opcional)</label>
            <textarea 
              id="foro-form-descripcion"
              rows="3"
              placeholder="Instrucciones o normas para los estudiantes en este espacio..."
              value={foroDescripcion}
              onChange={(e) => setForoDescripcion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsForoModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>{submitting ? 'Guardando...' : foroEditId ? 'Actualizar Foro' : 'Crear Foro'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Desafío Práctico */}
      <Modal
        isOpen={isDesafioModalOpen}
        onClose={() => setIsDesafioModalOpen(false)}
        title="Crear Desafío Práctico de Código"
      >
        <form onSubmit={handleSaveDesafio} className="space-y-4">
          <div>
            <label htmlFor="des-form-titulo" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Título del Desafío</label>
            <input 
              id="des-form-titulo"
              type="text"
              required
              placeholder="Ej. Suma de Elementos de una Lista"
              value={desafioTitulo}
              onChange={(e) => setDesafioTitulo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            />
          </div>

          <div>
            <label htmlFor="des-form-descripcion" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Enunciado y Problema</label>
            <textarea 
              id="des-form-descripcion"
              rows="3"
              required
              placeholder="Explica detalladamente qué debe realizar la función o algoritmo..."
              value={desafioDescripcion}
              onChange={(e) => setDesafioDescripcion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="des-form-dificultad" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Dificultad</label>
              <select 
                id="des-form-dificultad"
                value={desafioDificultad}
                onChange={(e) => setDesafioDificultad(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
              >
                <option value="Facil">Fácil</option>
                <option value="Medio">Medio</option>
                <option value="Dificil">Difícil</option>
              </select>
            </div>

            <div>
              <label htmlFor="des-form-lenguaje" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Lenguaje de Programación</label>
              <select 
                id="des-form-lenguaje"
                value={desafioLenguaje}
                onChange={(e) => setDesafioLenguaje(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
              >
                <option value="python">Python 3</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="des-form-plantilla" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Plantilla Inicial de Código</label>
            <textarea 
              id="des-form-plantilla"
              rows="3"
              value={desafioPlantillaCodigo}
              onChange={(e) => setDesafioPlantillaCodigo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs resize-none bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            />
          </div>

          {/* Casos de Prueba */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-900 uppercase">Casos de Prueba ({desafioTestCases.length})</span>
              <button 
                type="button" 
                onClick={handleAddTestCase}
                className="text-xs font-bold text-[#2c5364] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Añadir Caso
              </button>
            </div>

            {desafioTestCases.map((tc, idx) => (
              <div key={tc.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-700">Caso #{idx + 1}</span>
                  {desafioTestCases.length > 1 && (
                    <button type="button" onClick={() => handleRemoveTestCase(tc.id)} className="text-slate-400 hover:text-red-600 cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text"
                    placeholder="Entrada (Input)..."
                    value={tc.input}
                    onChange={(e) => handleTestCaseChange(tc.id, 'input', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                  />
                  <input 
                    type="text"
                    required
                    placeholder="Salida Esperada (Expected Output)..."
                    value={tc.expected_output}
                    onChange={(e) => handleTestCaseChange(tc.id, 'expected_output', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsDesafioModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>{submitting ? 'Creando...' : 'Crear Desafío'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Foro de Discusión */}
      <Modal
        isOpen={isForoModalOpen}
        onClose={() => setIsForoModalOpen(false)}
        title="Crear Foro de Discusión"
      >
        <form onSubmit={handleSaveForo} className="space-y-4">
          <div>
            <label htmlFor="foro-tema-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tema del Curso
            </label>
            <select
              id="foro-tema-select"
              value={activeTemaId || ''}
              onChange={(e) => setActiveTemaId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            >
              <option value="" disabled>Selecciona un tema...</option>
              {curso.temas?.map((t) => (
                <option key={t.idTema} value={t.idTema}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="foro-titulo-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título del Foro
            </label>
            <input
              id="foro-titulo-input"
              type="text"
              required
              value={foroTitulo}
              onChange={(e) => setForoTitulo(e.target.value)}
              placeholder="Ej: Foro de Consultas - Unidad 1"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            />
          </div>

          <div>
            <label htmlFor="foro-descripcion-textarea" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descripción / Instrucciones (Opcional)
            </label>
            <textarea
              id="foro-descripcion-textarea"
              rows={3}
              value={foroDescripcion}
              onChange={(e) => setForoDescripcion(e.target.value)}
              placeholder="Espacio para resolver dudas y debatir sobre este tema..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsForoModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#2c5364] hover:bg-[#203a43] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <span>Crear Foro</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Secure Viewer (TC-SP2-05) */}
      <PDFSecureViewer
        material={activeViewerMaterial}
        blobUrl={viewerBlobUrl}
        loading={viewerLoading}
        error={viewerError}
        onClose={handleCloseSecureViewer}
      />

      {/* ConfirmModal Reutilizable */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />

    </DashboardContainer>
  );
};

// Extrae todos los foros de todos los temas del curso
const extractForosFromTemas = (temas = []) => {
  const result = [];
  for (const tema of temas) {
    const foroItems = (tema.items || []).filter(item => {
      const type = item.itemable_type || '';
      return type.includes('Foro') || Boolean(item.itemable?.idForo) || Boolean(item.idForo);
    });
    if (foroItems.length > 0) {
      result.push({ tema, foros: foroItems });
    }
  }
  return result;
};

const ForosDelCurso = ({ curso, user, canManage, handleOpenForoModal, handleDeleteForo }) => {
  const [foroActivoId, setForoActivoId] = useState(null);

  const temasConForos = extractForosFromTemas(curso?.temas);
  const totalForos = temasConForos.reduce((acc, t) => acc + t.foros.length, 0);

  if (foroActivoId) {
    return (
      <ForoSeccion
        idForo={foroActivoId}
        user={user}
        temas={curso.temas}
        onBack={() => setForoActivoId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Foros del Curso</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            {totalForos} {totalForos === 1 ? 'foro disponible' : 'foros disponibles'} en este curso
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              const firstTemaId = curso?.temas?.[0]?.idTema || null;
              handleOpenForoModal(firstTemaId);
            }}
            className="bg-[#2c5364] hover:bg-[#203a43] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>Crear Nuevo Foro</span>
          </button>
        )}
      </div>

      {totalForos === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-extrabold text-slate-900">No hay foros disponibles</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto font-medium leading-relaxed">
            {canManage
              ? 'Habilita foros de discusión en este curso para interactuar con tus estudiantes.'
              : 'El profesor aún no ha habilitado foros de discusión en este curso.'}
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                const firstTemaId = curso?.temas?.[0]?.idTema || null;
                handleOpenForoModal(firstTemaId);
              }}
              className="inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Crear Nuevo Foro</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {temasConForos.map(({ tema, foros }) => (
            <div key={tema.idTema} className="space-y-3">
              {/* Encabezado del Tema */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 w-6 bg-slate-200" />
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-2">
                    {tema.nombre}
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleOpenForoModal(tema.idTema)}
                    className="flex items-center gap-1 text-[10px] font-extrabold text-[#2c5364] hover:text-[#203a43] px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ml-2 shrink-0"
                    title={`Crear foro en "${tema.nombre}"`}
                  >
                    <Plus size={12} />
                    <span>Nuevo Foro</span>
                  </button>
                )}
              </div>

              {/* Foros del Tema */}
              {foros.map((item) => {
                const foroId = item.idForo || item.itemable?.idForo || item.itemable_id;
                const titulo = item.titulo || item.itemable?.titulo || 'Foro de Discusión';
                const descripcion = item.descripcion || item.itemable?.descripcion || '';

                return (
                  <div
                    key={foroId || item.idItem}
                    className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-[#2c5364]/40 hover:shadow-md transition-all duration-200 flex justify-between items-center gap-4 shadow-xs"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 shrink-0">
                        <MessageSquare size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug truncate">{titulo}</h3>
                        {descripcion && (
                          <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">{descripcion}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => foroId && setForoActivoId(Number(foroId))}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-md"
                      >
                        <MessageSquare size={14} />
                        <span>Abrir Foro</span>
                      </button>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteForo(item)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar Foro"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CursoTabContent = ({
  activeTab,
  id,
  user,
  curso,
  canManage,
  setActiveTab,
  fetchCurso,
  handleOpenTemaModal,
  handleOpenMaterialModal,
  handleOpenDesafioModal,
  handleOpenForoModal,
  handleDeleteForo,
  handleDeleteTema,
  toggleTema,
  expandedTemas,
  handleOpenSecureViewer,
  handleDownloadMaterial,
  handleDeleteMaterial,
  handleDeleteDesafio,
  navigate,
}) => {
  if (activeTab === 'foro') {
    return (
      <ForosDelCurso
        curso={curso}
        user={user}
        canManage={canManage}
        handleOpenForoModal={handleOpenForoModal}
        handleDeleteForo={handleDeleteForo}
        fetchCurso={fetchCurso}
      />
    );
  }

  if (activeTab === 'quizzes') {
    return <QuizSeccion idCurso={id} user={user} temas={curso.temas} onQuizCompleted={fetchCurso} />;
  }

  return (
    <>
      {/* Secciones de Contenido */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Temas del Curso</h2>
        {canManage && (
          <button
            type="button"
            onClick={() => handleOpenTemaModal()}
            className="flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white px-4 py-2.5 rounded-xl font-extrabold shadow-sm transition-all hover:shadow-md cursor-pointer text-xs"
          >
            <Plus size={18} />
            <span>Nuevo Tema</span>
          </button>
        )}
      </div>

      {curso.temas?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-extrabold text-slate-900">No hay contenido disponible</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto font-medium">Este curso aún no tiene temas ni módulos cargados por el profesor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {curso.temas?.map((tema) => (
            <div key={tema.idTema} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-300">
              {/* Header Tema */}
              <div className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors select-none">
                <button 
                  type="button"
                  onClick={() => toggleTema(tema.idTema)}
                  className="flex items-center gap-4 flex-1 text-left focus:outline-none cursor-pointer"
                >
                  <div className="p-2.5 bg-slate-100 text-[#2c5364] rounded-2xl">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{tema.nombre}</h3>
                    {tema.descripcion && (
                      <p className="text-slate-500 text-xs font-medium">{tema.descripcion}</p>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-3">
                  {canManage && (
                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleOpenMaterialModal(tema.idTema)}
                        className="p-1.5 text-slate-700 hover:text-[#2c5364] hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Subir Material"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDesafioModal(tema.idTema)}
                        className="p-1.5 text-slate-700 hover:text-[#2c5364] hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Crear Desafío Práctico"
                      >
                        <Code size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenForoModal(tema.idTema)}
                        className="p-1.5 text-slate-700 hover:text-purple-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Crear Foro de Discusión en este Tema"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenTemaModal(tema)}
                        className="p-1.5 text-slate-700 hover:text-[#2c5364] hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Editar Tema"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTema(tema.idTema)}
                        className="p-1.5 text-slate-700 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Tema"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleTema(tema.idTema)}
                    className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {expandedTemas[tema.idTema] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* Contenido Expandible */}
              {expandedTemas[tema.idTema] && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-3">
                  {tema.items?.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium italic text-center py-4">No hay ítems cargados en este tema.</p>
                  ) : (
                    tema.items?.map((item, itemIdx) => (
                      <TemaItemCard
                        key={item.idItem || item.idMaterial || item.idDesafio || item.idForo || item.idQuiz || `item-${itemIdx}`}
                        item={item}
                        itemIdx={itemIdx}
                        temaId={tema.idTema}
                        canManage={canManage}
                        canResolve={user?.rol === 'Estudiante'}
                        handleOpenSecureViewer={handleOpenSecureViewer}
                        handleDownloadMaterial={handleDownloadMaterial}
                        handleDeleteMaterial={handleDeleteMaterial}
                        handleDeleteDesafio={handleDeleteDesafio}
                        handleOpenForoModal={handleOpenForoModal}
                        handleDeleteForo={handleDeleteForo}
                        navigate={navigate}
                        idCurso={id}
                        setActiveTab={setActiveTab}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default CursoDetallePage;