import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { cursosService } from '../../api/cursosService';
import { desafiosService } from '../../api/desafiosService';
import { storage } from '../../utils/crypto';
import ForoSeccion from '../../components/foro/ForoSeccion';
import QuizSeccion from '../../components/quizzes/QuizSeccion';
import { 
  ArrowLeft, Plus, Trash2, FileText, Video, Play, Download, Eye, 
  X, AlertCircle, Loader2, CheckCircle2, ChevronDown, ChevronUp, Code, Pencil, User, Sparkles, RotateCcw, CheckCircle, Trophy,
  MessageSquare, BookOpen, HelpCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

let testCaseIdCounter = 0;
const generateTestCaseId = () => {
  testCaseIdCounter += 1;
  return `tc-id-${testCaseIdCounter}`;
};

const CursoDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const [reloadKey, setReloadKey] = useState(0);
  const fetchCurso = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const loadCursoData = async () => {
      try {
        const data = await cursosService.getCurso(id);
        if (!isMounted) return;

        if (data.temas) {
          data.temas.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { numeric: true }));
          data.temas.forEach((t) => {
            if (t.items) {
              t.items.sort((a, b) => {
                const titleA = a.titulo || a.itemable?.titulo || a.nombre || '';
                const titleB = b.titulo || b.itemable?.titulo || b.nombre || '';
                return titleA.localeCompare(titleB, 'es', { numeric: true });
              });
            }
          });
        }

        setCurso(data);

        const expandMap = {};
        data.temas?.forEach((t) => {
          expandMap[t.idTema] = true;
        });
        setExpandedTemas(expandMap);
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('No se pudo cargar la información del curso.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCursoData();

    return () => {
      isMounted = false;
    };
  }, [id, reloadKey]);

  useEffect(() => {
    return () => {
      if (viewerBlobUrl) {
        URL.revokeObjectURL(viewerBlobUrl);
      }
    };
  }, [viewerBlobUrl]);

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

  const handleCreateTema = async (e) => {
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

  const handleCreateMaterial = async (e) => {
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

  const handleSaveDesafio = async (e) => {
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
      <DashboardContainer activeTab="cursos">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Curso no encontrado</h2>
          <button 
            onClick={() => navigate('/cursos')} 
            className="mt-4 inline-flex items-center gap-2 text-[#2c5364] font-semibold hover:underline"
          >
            <ArrowLeft size={16} /> Volver a Cursos
          </button>
        </div>
      </DashboardContainer>
    );
  }

  const progreso = curso.progreso_estudiante || { xp_ganado: 0, xp_total: 0, desafios_resueltos: 0, desafios_totales: 0, porcentaje: 0 };

  return (
    <DashboardContainer activeTab="cursos">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Botón Volver */}
        <button 
          onClick={() => navigate('/cursos')} 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm select-none cursor-pointer"
        >
          <ArrowLeft size={16} /> Volver a Cursos
        </button>

        {/* Notificaciones */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg"><X size={16} /></button>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between text-green-700 text-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="p-1 hover:bg-green-100 rounded-lg"><X size={16} /></button>
          </div>
        )}

        {/* Banner del Curso */}
        <div className="bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white/90">
                {curso.lp}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase">
                {curso.tipo}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{curso.titulo}</h1>
            <p className="text-white/80 max-w-2xl text-sm md:text-base leading-relaxed">{curso.descripcion}</p>

            <div className="pt-2 text-xs text-white/60 font-medium">
              Creado por: <span className="text-white font-semibold">{curso.creador?.nombreCompleto || 'Profesor'}</span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Progreso de XP para Estudiantes */}
        {user?.rol === 'Estudiante' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 text-white shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-2xl">
                  <Trophy size={28} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-100">Tu Progreso de XP en el Curso</h3>
                  <p className="text-xs text-slate-400">
                    Has completado <span className="font-bold text-amber-400">{progreso.desafios_resueltos}</span> de <span className="font-bold text-slate-200">{progreso.desafios_totales}</span> desafíos disponibles.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-300">{progreso.porcentaje}% Completado</span>
                  <span className="text-amber-400">{progreso.xp_ganado} / {progreso.xp_total} XP</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${progreso.porcentaje}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navegación por pestañas (Temas vs Quizzes vs Foro) */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('temas')}
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-all shrink-0 cursor-pointer ${
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
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'quizzes'
                ? 'border-[#2c5364] text-[#2c5364]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <HelpCircle size={18} />
            <span>Cuestionarios & Quizzes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('foro')}
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-all shrink-0 cursor-pointer ${
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
          <ForoSeccion idCurso={id} user={user} />
        ) : activeTab === 'quizzes' ? (
          <QuizSeccion idCurso={id} user={user} temas={curso.temas} onQuizCompleted={fetchCurso} />
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

            {curso.temas?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No hay contenido disponible</h3>
                <p className="text-gray-500 mt-1 max-w-sm mx-auto">Este curso aún no tiene temas ni módulos cargados por el profesor.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {curso.temas?.map((tema) => (
                  <div key={tema.idTema} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                    {/* Header Tema */}
                    <div className="p-5 flex justify-between items-center hover:bg-gray-50/50 transition-colors select-none">
                      <button 
                        type="button"
                        onClick={() => toggleTema(tema.idTema)}
                        className="flex items-center gap-4 flex-1 text-left focus:outline-none"
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
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          {expandedTemas[tema.idTema] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* Lista de Ítems del Tema */}
                    {expandedTemas[tema.idTema] && (
                      <div className="border-t border-gray-100 p-5 bg-gray-50/30 space-y-3">
                        {tema.items?.length === 0 ? (
                          <p className="text-center text-gray-400 text-sm py-4 italic">No hay ítems en este módulo.</p>
                        ) : (
                          tema.items?.map((item) => {
                            const isMaterial = Boolean(item.itemable_type && item.itemable_type.includes('Material'));
                            const isDesafio = Boolean(item.itemable_type && item.itemable_type.includes('Desafio'));
                            const resource = item.itemable;

                            if (!resource) return null;

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

      </div>

      {/* Modal Crear Tema */}
      {isTemaModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Agregar Nuevo Tema</h3>
              <button type="button" onClick={() => setIsTemaModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTema} className="space-y-4">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Subir Material Didáctico</h3>
              <button type="button" onClick={() => setIsMaterialModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-4">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDesafioId ? 'Editar Desafío de Programación' : 'Crear Desafío de Programación'}
              </h3>
              <button type="button" onClick={() => setIsDesafioModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDesafio} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título del Desafío</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. Invertir una Cadena de Texto"
                  value={desafioForm.titulo}
                  onChange={(e) => setDesafioForm({ ...desafioForm, titulo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Descripción del Problema</label>
                <textarea 
                  rows="3"
                  required
                  placeholder="Explica detalladamente las entradas, salidas y restricciones del problema..."
                  value={desafioForm.descripcionProblema}
                  onChange={(e) => setDesafioForm({ ...desafioForm, descripcionProblema: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

      {/* Modal Visor Seguro de Materiales */}
      {activeViewerMaterial && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col h-[85vh]">
            <div className="p-4 md:p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base md:text-lg">{activeViewerMaterial.titulo}</h3>
                <p className="text-xs text-slate-400">{activeViewerMaterial.descripcion || 'Visualización segura en línea'}</p>
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

    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
      <button
        type="button"
        onClick={(e) => handleViewSecure(resource.idMaterial, e)}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
      >
        <Eye size={14} />
        <span>Ver</span>
      </button>

      <button
        type="button"
        onClick={(e) => handleDownloadSecure(resource.idMaterial, resource.nombreOriginal || resource.titulo, e)}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
      >
        <Download size={14} />
        <span>Descargar</span>
      </button>

      {canManage && (
        <button
          type="button"
          onClick={() => handleDeleteMaterial(resource.idMaterial)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          title="Eliminar Material"
        >
          <Trash2 size={16} />
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
            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs"
            title={`Reiniciar Desafío (-${resource.puntos || 10} XP)`}
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

export default CursoDetallePage;
