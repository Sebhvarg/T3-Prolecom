import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { cursosService } from '../../api/cursosService';
import { desafiosService } from '../../api/desafiosService';
import { foroService } from '../../api/foroService';
import { storage } from '../../utils/crypto';
import ForoSeccion from '../../components/foro/ForoSeccion';
import { 
  ArrowLeft, Plus, Trash2, FileText, Video, Play, Download, Eye,
  X, AlertCircle, Loader2, CheckCircle2, ChevronDown, ChevronUp, Code, Pencil, User, Sparkles, RotateCcw, CheckCircle,
  MessageSquare, BookOpen
} from 'lucide-react';
import CourseProgressBar from '../../components/cursos/CourseProgressBar';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

let testCaseIdCounter = 0;
const generateTestCaseId = () => {
  testCaseIdCounter += 1;
  return `tc-id-${testCaseIdCounter}`;
};

const CursoDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialForoId = searchParams.get('foroId');
  const { user, updateUser } = useAuth();
  
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedTemas, setExpandedTemas] = useState({});
  const [activeTab, setActiveTab] = useState('temas');


  // Modales
  const [isTemaModalOpen, setIsTemaModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [activeTemaId, setActiveTemaId] = useState(null);

  // Foro Itemable States
  const [isForoModalOpen, setIsForoModalOpen] = useState(false);
  const [foroForm, setForoForm] = useState({ titulo: '', descripcion: '' });
  const [selectedForoId, setSelectedForoId] = useState(initialForoId ? Number(initialForoId) : null);

  // Desafio Modal States
  const [isDesafioModalOpen, setIsDesafioModalOpen] = useState(false);
  const [editingDesafioId, setEditingDesafioId] = useState(null);
  const [desafioForm, setDesafioForm] = useState({
    titulo: '',
    descripcionProblema: '',
    dificultad: 'Easy',
    puntos: 10,
    starter_code: '',
    testCases: [{ id: generateTestCaseId(), input: '', expected_output: '', is_hidden: false }]
  });

  // Forms data
  const [temaForm, setTemaForm] = useState({ nombre: '', descripcion: '' });
  const [materialForm, setMaterialForm] = useState({ titulo: '', descripcion: '', tipo: 'PDF' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Secure Viewer State
  const [activeViewerMaterial, setActiveViewerMaterial] = useState(null);
  const [viewerBlobUrl, setViewerBlobUrl] = useState('');
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState('');

  const canManage = user?.rol === 'Administrador' || user?.rol === 'Profesor';

  const fetchCurso = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cursosService.getCurso(id);
      // Ordenar temas y sus ítems alfabético-numéricamente
      if (data.temas) {
        data.temas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));
        data.temas.forEach(t => {
          if (t.items) {
            t.items.sort((a, b) => {
              const tituloA = a.resource?.titulo || a.itemable?.titulo || '';
              const tituloB = b.resource?.titulo || b.itemable?.titulo || '';
              return tituloA.localeCompare(tituloB, 'es', { numeric: true });
            });
          }
        });
      }
      setCurso(data);
      
      // Auto-expandir todos los temas al iniciar
      const expandMap = {};
      data.temas?.forEach(t => {
        expandMap[t.idTema] = true;
      });
      setExpandedTemas(expandMap);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información del curso.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!ignore) {
        await fetchCurso();
      }
    }
    load();
    return () => { ignore = true; };
  }, [fetchCurso]);

  const location = useLocation();

  useEffect(() => {
    if (!curso) return;
    const action = location.state?.action;
    const targetTemaId = location.state?.idTema || (curso.temas?.[0]?.idTema);

    if (action === 'createTema') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTemaForm({ nombre: '', descripcion: '' });
      setIsTemaModalOpen(true);
    } else if (action === 'createMaterial' && targetTemaId) {
      setActiveTemaId(targetTemaId);
      setMaterialForm({ titulo: '', descripcion: '', tipo: 'PDF' });
      setSelectedFile(null);
      setIsMaterialModalOpen(true);
    } else if (action === 'createDesafio' && targetTemaId) {
      setActiveTemaId(targetTemaId);
      setEditingDesafioId(null);
      setDesafioForm({
        titulo: '',
        descripcionProblema: '',
        dificultad: 'Easy',
        puntos: 10,
        starter_code: '',
        testCases: [{ id: generateTestCaseId(), input: '', expected_output: '', is_hidden: false }]
      });
      setIsDesafioModalOpen(true);
    } else if (action === 'createForo' && targetTemaId) {
      setActiveTemaId(targetTemaId);
      setForoForm({ titulo: '', descripcion: '' });
      setIsForoModalOpen(true);
    }
  }, [curso, location.state]);

  const toggleTema = (temaId) => {
    setExpandedTemas(prev => ({
      ...prev,
      [temaId]: !prev[temaId]
    }));
  };

  // --- Handlers Tema ---
  const handleOpenTemaModal = () => {
    setTemaForm({ nombre: '', descripcion: '' });
    setIsTemaModalOpen(true);
  };

  const handleTemaSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      await cursosService.addTema(id, temaForm);
      setSuccess('Tema creado exitosamente.');
      setIsTemaModalOpen(false);
      fetchCurso();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el tema.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTema = async (idTema, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar este tema y todo su contenido?')) return;
    try {
      await cursosService.deleteTema(idTema);
      setSuccess('Tema eliminado.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el tema.');
    }
  };

  // --- Handlers Material ---
  const handleOpenMaterialModal = (temaId) => {
    setActiveTemaId(temaId);
    setMaterialForm({ titulo: '', descripcion: '', tipo: 'PDF' });
    setSelectedFile(null);
    setIsMaterialModalOpen(true);
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Por favor selecciona un archivo.');
      return;
    }
    setActionLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('titulo', materialForm.titulo);
    formData.append('descripcion', materialForm.descripcion || '');
    formData.append('tipo', materialForm.tipo);
    formData.append('archivo', selectedFile);

    try {
      await cursosService.addMaterial(activeTemaId, formData);
      setSuccess('Material subido exitosamente.');
      setIsMaterialModalOpen(false);
      fetchCurso();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir el material.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMaterial = async (idMaterial) => {
    if (!window.confirm('¿Estás seguro de eliminar este material?')) return;
    try {
      await cursosService.deleteMaterial(idMaterial);
      setSuccess('Material eliminado.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el material.');
    }
  };

  // --- Handlers Desafíos ---
  const handleOpenDesafioModal = (temaId) => {
    setActiveTemaId(temaId);
    setEditingDesafioId(null);
    setDesafioForm({
      titulo: '',
      descripcionProblema: '',
      dificultad: 'Easy',
      puntos: 10,
      starter_code: '',
      testCases: [{ id: generateTestCaseId(), input: '', expected_output: '', is_hidden: false }]
    });
    setIsDesafioModalOpen(true);
  };

  const handleOpenEditDesafioModal = (desafioResource, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      let parsedCases = desafioResource.testCases;
      if (typeof parsedCases === 'string') {
        try { 
          parsedCases = JSON.parse(parsedCases); 
        } catch { 
          parsedCases = []; 
        }
      }
      if (!Array.isArray(parsedCases)) {
        parsedCases = [];
      }

      setEditingDesafioId(desafioResource.idDesafio);
      setActiveTemaId(desafioResource.idTema || null);
      setDesafioForm({
        titulo: desafioResource.titulo || '',
        descripcionProblema: desafioResource.descripcionProblema || '',
        dificultad: desafioResource.dificultad || 'Easy',
        puntos: desafioResource.puntos || 10,
        starter_code: desafioResource.starter_code || '',
        testCases: parsedCases.length > 0 
          ? parsedCases.map(tc => ({ ...tc, id: tc.id || generateTestCaseId() }))
          : [{ id: generateTestCaseId(), input: '', expected_output: '', is_hidden: false }]
      });
      setIsDesafioModalOpen(true);
    } catch (err) {
      console.error('Error al abrir modal de edición:', err);
      setError('No se pudo cargar la información del desafío para editar.');
    }
  };

  const handleAddTestCase = () => {
    setDesafioForm(prev => ({
      ...prev,
      testCases: [...prev.testCases, { id: generateTestCaseId(), input: '', expected_output: '', is_hidden: false }]
    }));
  };

  const handleRemoveTestCase = (tcId) => {
    if (desafioForm.testCases.length <= 1) return;
    setDesafioForm(prev => ({
      ...prev,
      testCases: prev.testCases.filter(tc => tc.id !== tcId)
    }));
  };

  const handleTestCaseChange = (tcId, field, value) => {
    setDesafioForm(prev => ({
      ...prev,
      testCases: prev.testCases.map(tc => tc.id === tcId ? { ...tc, [field]: value } : tc)
    }));
  };

  // --- FOROS LOGIC ---
  const handleOpenForoModal = (temaId) => {
    setActiveTemaId(temaId);
    setForoForm({ titulo: '', descripcion: '' });
    setIsForoModalOpen(true);
  };

  const handleForoSubmit = async (e) => {
    e.preventDefault();
    if (!foroForm.titulo.trim()) return;
    setError('');
    setActionLoading(true);

    try {
      await foroService.createForo(activeTemaId, foroForm);
      setSuccess('Foro creado exitosamente.');
      setIsForoModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al crear el foro.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteForo = async (foroId) => {
    if (!globalThis.confirm('¿Estás seguro de eliminar este foro y todas sus preguntas?')) return;
    setError('');
    try {
      await foroService.deleteForo(foroId);
      setSuccess('Foro eliminado correctamente.');
      if (selectedForoId === foroId) {
        setSelectedForoId(null);
      }
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al eliminar el foro.');
    }
  };

  const handleDesafioSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    const formattedTestCases = desafioForm.testCases.map(({ input, expected_output, is_hidden }) => ({
      input,
      expected_output,
      is_hidden
    }));

    const payload = {
      titulo: desafioForm.titulo,
      descripcionProblema: desafioForm.descripcionProblema,
      dificultad: desafioForm.dificultad,
      puntos: parseInt(desafioForm.puntos, 10) || 10,
      starter_code: desafioForm.starter_code,
      testCases: formattedTestCases
    };

    try {
      if (editingDesafioId) {
        await desafiosService.updateDesafio(editingDesafioId, payload);
        setSuccess('Desafío actualizado exitosamente.');
      } else {
        await desafiosService.createDesafio(activeTemaId, payload);
        setSuccess('Desafío de programación creado exitosamente.');
      }
      setIsDesafioModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar el desafío.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDesafio = async (idDesafio) => {
    if (!window.confirm('¿Estás seguro de eliminar este desafío?')) return;
    try {
      await desafiosService.deleteDesafio(idDesafio);
      setSuccess('Desafío eliminado.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el desafío.');
    }
  };

  const handleResetDesafio = async (idDesafio, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('¿Estás seguro de reiniciar este desafío? Se deducirán los XP ganados de tu cuenta y podrás volver a resolverlo.')) return;
    
    try {
      const res = await desafiosService.resetDesafio(idDesafio);
      if (res.user && updateUser) {
        updateUser({ xp: res.user.xp });
      }
      setSuccess(`Desafío reiniciado. Se restaron ${res.xp_deducidos || 0} XP de tu total.`);
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al reiniciar el desafío.');
    }
  };

  // --- Handlers Visualización Segura de Archivos ---
  const handleViewSecure = async (materialId, e) => {
    if (e) e.preventDefault();
    setError('');
    setViewerLoading(true);
    setViewerError('');
    setActiveViewerMaterial(null);

    const mat = curso.temas.flatMap(t => t.items || [])
      .find(i => i.itemable && i.itemable.idMaterial === materialId)?.itemable;

    if (!mat) {
      setError('Material no encontrado.');
      setViewerLoading(false);
      return;
    }

    try {
      const token = storage.getItem('token');
      const res = await fetch(`${API_URL}/materiales/${materialId}/stream`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf, video/*, */*'
        }
      });

      if (!res.ok) {
        throw new Error('No tienes permisos o el archivo no está disponible.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setViewerBlobUrl(url);
      setActiveViewerMaterial(mat);
    } catch (err) {
      console.error(err);
      setViewerError(err.message || 'Error al cargar el archivo de manera segura.');
    } finally {
      setViewerLoading(false);
    }
  };

  const handleDownloadSecure = async (materialId, filename, e) => {
    if (e) e.preventDefault();
    try {
      const token = storage.getItem('token');
      const res = await fetch(`${API_URL}/materiales/${materialId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Error al descargar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'material';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('No se pudo descargar el archivo.');
    }
  };

  const handleCloseViewer = () => {
    setActiveViewerMaterial(null);
    if (viewerBlobUrl) URL.revokeObjectURL(viewerBlobUrl);
    setViewerBlobUrl('');
  };

  if (loading) {
    return (
      <DashboardContainer activeTab="cursos">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={40} className="animate-spin text-[#2c5364]" />
        </div>
      </DashboardContainer>
    );
  }

  if (!curso) {
    return (
      <DashboardContainer title="Curso no encontrado" user={user}>
        <div className="text-center py-16">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Curso no encontrado</h3>
          <p className="text-gray-500 mt-2">El curso que intentas ver no existe o fue eliminado.</p>
          <button
            type="button"
            onClick={() => navigate('/cursos')}
            className="mt-6 inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white px-5 py-2.5 rounded-xl font-semibold shadow"
          >
            <ArrowLeft size={16} /> Volver a Cursos
          </button>
        </div>
      </DashboardContainer>
    );
  }

  const allForos = (curso.temas || []).flatMap(tema => 
    (tema.items || [])
      .filter(item => Boolean(item.itemable_type?.includes('Foro') && (item.resource || item.itemable)))
      .map(item => ({
        ...(item.resource || item.itemable),
        temaNombre: tema.nombre,
        idTema: tema.idTema
      }))
  );

  return (
    <DashboardContainer title={`Curso: ${curso.titulo}`} user={user}>
      {/* Botón Volver */}
      <button
        type="button"
        onClick={() => navigate('/cursos')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-semibold"
      >
        <ArrowLeft size={18} />
        <span>Volver a Cursos</span>
      </button>

      {/* Notificaciones */}
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg"><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between text-green-700 text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="p-1 hover:bg-green-100 rounded-lg"><X size={16} /></button>
        </div>
      )}

      {/* Barra de progreso — solo visible para estudiantes */}
      {!canManage && <CourseProgressBar idCurso={curso.idCurso} />}


      {selectedForoId ? (
        <ForoSeccion idForo={selectedForoId} user={user} onBack={() => setSelectedForoId(null)} />
      ) : (
        <>
          {/* Navegación por pestañas (Temas vs Foro) */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('temas')}
              className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-all ${
                activeTab === 'temas'
                  ? 'border-[#2c5364] text-[#2c5364]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <BookOpen size={18} />
              <span>Temas y Módulos ({curso.temas?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('foro')}
              className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-all ${
                activeTab === 'foro'
                  ? 'border-[#2c5364] text-[#2c5364]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <MessageSquare size={18} />
              <span>Foro de Preguntas & Q&A</span>
            </button>
          </div>

          {activeTab === 'foro' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Foros de Discusión del Curso</h2>
                  <p className="text-gray-500 text-sm mt-0.5">Espacios de preguntas, respuestas y debate estructurado por temas.</p>
                </div>
              </div>

              {allForos.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">No hay foros de discusión activos</h3>
                  <p className="text-gray-500 mt-1 max-w-sm mx-auto">Este curso aún no tiene foros creados dentro de sus temas o módulos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allForos.map((foro) => (
                    <div key={foro.idForo} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-teal-50 text-teal-700">
                            {foro.temaNombre}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider ${
                            foro.estado === 'cerrado' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {foro.estado === 'cerrado' ? 'Cerrado' : 'Abierto'}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug">{foro.titulo}</h3>
                        {foro.descripcion && (
                          <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">{foro.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400 font-medium">
                          Creador: {foro.creador?.nombreCompleto || 'Profesor'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedForoId(foro.idForo)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                        >
                          <MessageSquare size={14} />
                          <span>Entrar al Foro</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Secciones de Contenido */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Temas del Curso</h2>
                {canManage && (
                  <button
                    type="button"
                    onClick={handleOpenTemaModal}
                    className="flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all hover:shadow-md cursor-pointer"
                  >
                    <Plus size={18} />
                    <span>Nuevo Tema</span>
                  </button>
                )}
              </div>

              {!curso.temas || curso.temas.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">No hay contenido disponible</h3>
                  <p className="text-gray-500 mt-1 max-w-sm mx-auto">Este curso aún no tiene temas ni módulos cargados por el profesor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {curso.temas.map((tema) => (
                    <div key={tema.idTema} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                      {/* Header Tema */}
                      <div className="p-5 flex justify-between items-center hover:bg-gray-50/50 transition-colors select-none">
                        <button 
                          type="button"
                          onClick={() => toggleTema(tema.idTema)}
                          className="flex items-center gap-4 flex-1 text-left focus:outline-none cursor-pointer"
                          aria-expanded={expandedTemas[tema.idTema]}
                        >
                          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{tema.nombre}</h3>
                            {tema.descripcion && <p className="text-gray-500 text-sm mt-0.5">{tema.descripcion}</p>}
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-3">
                          {canManage && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenMaterialModal(tema.idTema)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                <Plus size={14} />
                                <span>Subir Material</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDesafioModal(tema.idTema)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                <Plus size={14} />
                                <span>Crear Desafío</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenForoModal(tema.idTema)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                <Plus size={14} />
                                <span>Crear Foro</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTema(tema.idTema, e)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar Tema"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}

                          <button 
                            type="button"
                            onClick={() => toggleTema(tema.idTema)}
                            className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {expandedTemas[tema.idTema] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* Lista de Ítems del Tema */}
                      {expandedTemas[tema.idTema] && (
                        <div className="border-t border-gray-100 p-5 bg-gray-50/30 space-y-3">
                          {!tema.items || tema.items.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-4 italic">No hay ítems en este módulo.</p>
                          ) : (
                            tema.items.map((item) => {
                              const resource = item.resource || item.itemable;
                              if (!resource) return null;

                              const isMaterial = Boolean(item.itemable_type?.includes('Material'));
                              const isDesafio = Boolean(item.itemable_type?.includes('Desafio'));
                              const isForo = Boolean(item.itemable_type?.includes('Foro'));

                              if (isMaterial) {
                                return renderMaterialItem(
                                  item, resource, handleViewSecure, handleDownloadSecure, handleDeleteMaterial, canManage
                                );
                              }

                              if (isDesafio) {
                                return renderDesafioItem({
                                  item, resource, id, navigate, canManage, handleDeleteDesafio, handleOpenEditDesafioModal, handleResetDesafio
                                });
                              }

                              if (isForo) {
                                return renderForoItem(item, resource, (foroId) => setSelectedForoId(foroId), canManage, handleDeleteForo);
                              }

                              return null;
                            })
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal Crear Tema */}
      {isTemaModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setIsTemaModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Crear Nuevo Tema</h3>
            <p className="text-gray-500 text-sm mb-6">Organiza el contenido del curso creando unidades o secciones.</p>
            <form onSubmit={handleTemaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nombre del Tema</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. Tema 1: Variables y Tipos de Datos"
                  value={temaForm.nombre}
                  onChange={(e) => setTemaForm({ ...temaForm, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
                <textarea 
                  rows="3"
                  placeholder="Breve introducción de lo que tratará este módulo..."
                  value={temaForm.descripcion}
                  onChange={(e) => setTemaForm({ ...temaForm, descripcion: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsTemaModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-[#2c5364] hover:bg-[#203a43] text-white text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Guardando...' : 'Crear Tema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Subir Material */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setIsMaterialModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Subir Material de Aprendizaje</h3>
            <p className="text-gray-500 text-sm mb-6">Añade guías en formato PDF o grabaciones de clase.</p>
            <form onSubmit={handleMaterialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título del Material</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. Diapositivas de la Lectura 1"
                  value={materialForm.titulo}
                  onChange={(e) => setMaterialForm({ ...materialForm, titulo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tipo de Recurso</label>
                <select
                  value={materialForm.tipo}
                  onChange={(e) => setMaterialForm({ ...materialForm, tipo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm bg-white"
                >
                  <option value="PDF">PDF (Documento Lectura)</option>
                  <option value="Video">Video (Grabación o Tutorial)</option>
                  <option value="Doc">Documento de Texto</option>
                  <option value="Otro">Otro Formato</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Seleccionar Archivo (Máx 20MB)</label>
                <input 
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.mp4,.mov,.txt,.zip"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Subiendo Archivo...' : 'Subir Recurso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Desafío */}
      {isDesafioModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative my-8">
            <button 
              type="button"
              onClick={() => setIsDesafioModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Crear Nuevo Desafío de Programación</h3>
            <p className="text-gray-500 text-sm mb-6">Agrega un reto de código al banco de ejercicios para este tema.</p>
            <form onSubmit={handleDesafioSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="desafio-titulo" className="block text-sm font-bold text-gray-700 mb-1.5">Título del Desafío <span className="text-red-500">*</span></label>
                  <input 
                    id="desafio-titulo"
                    type="text" 
                    required
                    placeholder="Ej: Suma de dos números..."
                    value={desafioForm.titulo}
                    onChange={(e) => setDesafioForm(prev => ({ ...prev, titulo: e.target.value }))}
                    className="w-full border border-gray-300 hover:border-gray-400 focus:border-[#2c5364] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20 text-gray-900 bg-white shadow-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Dificultad</label>
                  <select
                    value={desafioForm.dificultad}
                    onChange={(e) => setDesafioForm({ ...desafioForm, dificultad: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm bg-white font-medium"
                  >
                    <option value="Easy">Fácil (Easy)</option>
                    <option value="Medium">Intermedio (Medium)</option>
                    <option value="Hard">Difícil (Hard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Puntos (XP)</label>
                  <input 
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={desafioForm.puntos}
                    onChange={(e) => setDesafioForm({ ...desafioForm, puntos: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Código Inicial (Starter Code Opcional)</label>
                <textarea 
                  rows="3"
                  placeholder="# Escribe la plantilla inicial para el alumno..."
                  value={desafioForm.starter_code}
                  onChange={(e) => setDesafioForm({ ...desafioForm, starter_code: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm font-mono text-xs bg-slate-50"
                />
              </div>

              {/* Casos de Prueba (Test Cases) */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Casos de Prueba (Test Cases para Judge0)</label>
                  <button 
                    type="button" 
                    onClick={handleAddTestCase}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                  >
                    <Plus size={14} /> Agregar Caso
                  </button>
                </div>

                {desafioForm.testCases.map((tc, index) => (
                  <div key={tc.id} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-600">Caso #{index + 1}</span>
                      {desafioForm.testCases.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveTestCase(tc.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Eliminar Caso"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Entrada (STDIN)</label>
                        <textarea 
                          rows="2"
                          placeholder="Entrada del test..."
                          value={tc.input}
                          onChange={(e) => handleTestCaseChange(tc.id, 'input', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Salida Esperada (STDOUT)</label>
                        <textarea 
                          rows="2"
                          placeholder="Salida esperada..."
                          value={tc.expected_output}
                          onChange={(e) => handleTestCaseChange(tc.id, 'expected_output', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 font-mono bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input 
                        type="checkbox"
                        id={`hidden-${tc.id}`}
                        checked={tc.is_hidden}
                        onChange={(e) => handleTestCaseChange(tc.id, 'is_hidden', e.target.checked)}
                        className="rounded text-[#2c5364] focus:ring-[#2c5364]"
                      />
                      <label htmlFor={`hidden-${tc.id}`} className="text-xs text-gray-600 font-medium">
                        Caso oculto (Ocultar parámetros en la evaluación del estudiante)
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsDesafioModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-amber-600 hover:bg-amber-700 text-white text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Code size={16} />}
                  <span>{editingDesafioId ? 'Actualizar Desafío' : 'Guardar Desafío'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CREAR FORO --- */}
      {isForoModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setIsForoModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Crear Foro de Discusión</h3>
            <p className="text-gray-500 text-sm mb-6">Agrega un foro Q&amp;A a este tema para que los estudiantes hagan sus consultas.</p>
            <form onSubmit={handleForoSubmit} className="space-y-4">
              <div>
                <label htmlFor="foro-titulo" className="block text-sm font-bold text-gray-700 mb-1.5">Título del Foro <span className="text-red-500">*</span></label>
                <input
                  id="foro-titulo"
                  type="text" 
                  required
                  placeholder="Ej: Dudas sobre Recursión y Casos Base..."
                  value={foroForm.titulo}
                  onChange={(e) => setForoForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                />
              </div>
              <div>
                <label htmlFor="foro-descripcion" className="block text-sm font-bold text-gray-700 mb-1.5">Descripción (Opcional)</label>
                <textarea 
                  id="foro-descripcion"
                  placeholder="Instrucciones o temas que se discutirán en este espacio..."
                  value={foroForm.descripcion}
                  onChange={(e) => setForoForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsForoModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-xl text-sm font-semibold shadow flex items-center gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Publicar Foro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL VISOR SEGURO (SECURE VIEWER) --- */}
      {activeViewerMaterial && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col h-[90vh] overflow-hidden">
            {/* Cabecera del Visor */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activeViewerMaterial.tipo === 'PDF' ? 'bg-red-50 text-red-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  {activeViewerMaterial.tipo === 'PDF' ? <FileText size={18} /> : <Video size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base md:text-lg leading-tight">
                    Visor Seguro: {activeViewerMaterial.titulo}
                  </h3>
                  <p className="text-gray-400 text-xxs font-bold uppercase tracking-wider">Carga Protegida con Encriptación Local</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSecure(activeViewerMaterial)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold rounded-lg transition-colors"
                  title="Descargar para almacenamiento sin conexión"
                >
                  <Download size={12} />
                  <span>Descargar</span>
                </button>
                <button 
                  type="button"
                  onClick={handleCloseViewer}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setActiveViewerMaterial(null);
                  if (viewerBlobUrl) URL.revokeObjectURL(viewerBlobUrl);
                  setViewerBlobUrl('');
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 relative overflow-hidden">
              {viewerLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <Loader2 size={40} className="animate-spin text-[#2c5364]" />
                </div>
              )}

              {viewerError ? (
                <div className="flex items-center justify-center h-full p-6 text-center text-red-600">
                  <AlertCircle size={32} className="mr-2" />
                  <span>{viewerError}</span>
                </div>
              ) : activeViewerMaterial.tipo === 'Video' ? (
                <video 
                  controls 
                  src={viewerBlobUrl} 
                  className="w-full h-full object-contain bg-black"
                  controlsList="nodownload"
                />
              ) : (
                <iframe 
                  src={viewerBlobUrl} 
                  title={activeViewerMaterial.titulo}
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
  );
};

// --- Componentes Auxiliares de Ítems ---
const renderMaterialItem = (item, resource, handleViewSecure, handleDownloadSecure, handleDeleteMaterial, canManage) => (
  <div 
    key={item.idItemTema} 
    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all gap-4 w-full"
  >
    <div className="flex items-start gap-4 flex-1">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0 mt-0.5">
        {resource.tipo === 'Video' ? <Video size={20} /> : <FileText size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-gray-900 text-sm md:text-base leading-snug">{resource.titulo}</h4>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 uppercase tracking-wider">
            {resource.tipo}
          </span>
        </div>
        {resource.descripcion && (
          <p className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-2">{resource.descripcion}</p>
        )}
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleViewSecure(resource)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
      >
        {resource.tipo === 'Video' ? <Play size={14} /> : <Eye size={14} />}
        <span>{resource.tipo === 'Video' ? 'Reproducir' : 'Ver'}</span>
      </button>
      
      <button
        type="button"
        onClick={() => handleDownloadSecure(resource)}
        className="p-1.5 border border-gray-100 hover:border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
        title="Descargar"
      >
        <Download size={16} />
      </button>

      {canManage && (
        <button
          type="button"
          onClick={() => handleDeleteMaterial(resource.idMaterial)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          title="Eliminar Material"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  </div>
);

const renderDesafioItem = ({ item, resource, id, navigate, canManage, handleDeleteDesafio, handleOpenEditDesafioModal, handleResetDesafio }) => {
  const getDificultadBadgeClass = (dificultad) => {
    if (dificultad === 'Easy') return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    if (dificultad === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200/60';
    return 'bg-rose-50 text-rose-700 border-rose-200/60';
  };

  const isCompleted = Boolean(resource.completado);

  return (
    <div 
      key={item.idItemTema} 
      className={`group relative flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 md:p-5 rounded-2xl border transition-all duration-200 gap-4 w-full shadow-xs hover:shadow-md ${
        isCompleted 
          ? 'bg-emerald-50/20 border-emerald-200 hover:border-emerald-300' 
          : 'bg-white border-slate-100 hover:border-amber-200/70'
      }`}
    >
      <div className="flex items-start gap-4 flex-1">
        <div className={`p-3 border rounded-2xl shrink-0 mt-0.5 group-hover:scale-105 transition-transform ${
          isCompleted 
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600' 
            : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-600'
        }`}>
          {isCompleted ? <CheckCircle size={20} /> : <Code size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-slate-900 text-sm md:text-base leading-snug group-hover:text-amber-700 transition-colors">
              {resource.titulo}
            </h4>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getDificultadBadgeClass(resource.dificultad)}`}>
              {resource.dificultad}
            </span>
          </div>

          <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">
            {resource.descripcionProblema}
          </p>

          {/* Chips de Metadatos Modernos */}
          <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 font-medium">
              <User size={13} className="text-slate-400" />
              <span>{resource.creador?.nombreCompleto || 'Profesor'}</span>
            </span>

            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/80 border border-emerald-200 text-emerald-800 font-bold">
                <CheckCircle size={13} className="text-emerald-600" />
                <span>Completado (+{resource.puntos || 10} XP)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-100 text-amber-800 font-semibold">
                <Sparkles size={13} className="text-amber-500" />
                <span>+{resource.puntos || 10} XP</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={() => navigate(`/cursos/${id}/desafios/${resource.idDesafio}`)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98 text-white ${
            isCompleted
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
          }`}
        >
          <Play size={14} fill="currentColor" />
          <span>{isCompleted ? 'Volver a Intentar' : 'Resolver'}</span>
        </button>

        {isCompleted && (
          <button
            type="button"
            onClick={(e) => handleResetDesafio(resource.idDesafio, e)}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Reiniciar Desafío"
          >
            <RotateCcw size={15} />
          </button>
        )}

        {canManage && (
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={(e) => handleOpenEditDesafioModal(resource, e)}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-all cursor-pointer shadow-xs hover:shadow-xs"
              title="Editar Desafío"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteDesafio(resource.idDesafio)}
              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-white rounded-lg transition-all cursor-pointer shadow-xs hover:shadow-xs"
              title="Eliminar Desafío"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const renderForoItem = (item, resource, handleSelectForo, canManage, handleDeleteForo) => {
  return (
    <div key={item.idItemTema} className="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-xl shadow-xs hover:shadow-md transition-shadow w-full">
      <div className="flex items-center gap-4.5">
        <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
          <MessageSquare size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 text-sm md:text-base leading-snug">{resource.titulo}</h4>
            <span className={`px-2 py-0.5 text-xxs font-bold rounded-md uppercase tracking-wider ${
              resource.estado === 'cerrado' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {resource.estado === 'cerrado' ? 'Cerrado' : 'Abierto'}
            </span>
          </div>
          {resource.descripcion && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{resource.descripcion}</p>}
          <div className="flex items-center gap-3 mt-1.5 text-xxs text-gray-400 font-semibold uppercase tracking-wider">
            <span>Foro de discusión • Creador: {resource.creador?.nombreCompleto || 'Profesor'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleSelectForo(resource.idForo)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          <MessageSquare size={14} />
          <span>Abrir Foro</span>
        </button>

        {canManage && (
          <button
            type="button"
            onClick={() => handleDeleteForo(resource.idForo)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar Foro"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CursoDetallePage;
