import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { cursosService } from '../../api/cursosService';
import { authService } from '../../api/authService';
import { desafiosService } from '../../api/desafiosService';
import { storage } from '../../utils/crypto';
import ForoSeccion from '../../components/foro/ForoSeccion';
import QuizSeccion from '../../components/quizzes/QuizSeccion';
import { 
  ArrowLeft, Plus, Trash2, FileText, Play, Download, Eye, 
  X, AlertCircle, Loader2, CheckCircle2, ChevronDown, ChevronUp, Code, Pencil,
  MessageSquare, BookOpen, HelpCircle
} from 'lucide-react';
import CourseProgressBar from '../../components/cursos/CourseProgressBar';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

let testCaseIdCounter = 0;
const generateTestCaseId = () => {
  testCaseIdCounter += 1;
  return `tc-id-${testCaseIdCounter}`;
};

const sortCursoTemasEItems = (temas) => {
  if (!temas) return;
  temas.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { numeric: true }));
  temas.forEach((t) => {
    if (!t.items) return;
    t.items.sort((a, b) => {
      const titleA = a.titulo || a.itemable?.titulo || a.resource?.titulo || a.nombre || '';
      const titleB = b.titulo || b.itemable?.titulo || b.resource?.titulo || b.nombre || '';
      return titleA.localeCompare(titleB, 'es', { numeric: true });
    });
  });
};

const CursoDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return ['temas', 'quizzes', 'foro'].includes(tab) ? tab : 'temas';
  });

  // Estado para colapsar/expandir temas
  const [expandedTemas, setExpandedTemas] = useState({});

  // Modales Estado
  const [isTemaModalOpen, setIsTemaModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isDesafioModalOpen, setIsDesafioModalOpen] = useState(false);

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

  const [submitting, setSubmitting] = useState(false);

  // Secure Viewer State
  const [activeViewerMaterial, setActiveViewerMaterial] = useState(null);
  const [viewerBlobUrl, setViewerBlobUrl] = useState('');
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState('');

  const canManage = user?.rol === 'Administrador' || user?.rol === 'Profesor';

  const [reloadKey, setReloadKey] = useState(0);
  const fetchCurso = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let isMounted = true;

    const loadCursoData = async () => {
      setLoading(true);
      try {
        const data = await cursosService.getCurso(id);
        if (!isMounted) return;

        sortCursoTemasEItems(data.temas);

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
        if (isMounted) setLoading(false);
      }
    };

    loadCursoData();

    return () => {
      isMounted = false;
    };
  }, [id, reloadKey]);

  const toggleTema = (idTema) => {
    setExpandedTemas(prev => ({
      ...prev,
      [idTema]: !prev[idTema]
    }));
  };

  // --- Handlers Tema ---
  const handleOpenTemaModal = (tema = null) => {
    if (tema) {
      setTemaEditId(tema.idTema);
      setTemaNombre(tema.nombre);
      setTemaDescripcion(tema.descripcion || '');
    } else {
      setTemaEditId(null);
      setTemaNombre('');
      setTemaDescripcion('');
    }
    setIsTemaModalOpen(true);
  };

  const handleSaveTema = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (temaEditId) {
        await cursosService.updateTema(temaEditId, { nombre: temaNombre, descripcion: temaDescripcion });
        setSuccess('Tema actualizado exitosamente.');
      } else {
        await cursosService.createTema(id, { nombre: temaNombre, descripcion: temaDescripcion });
        setSuccess('Tema creado exitosamente.');
      }
      setIsTemaModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar el tema.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTema = async (idTema) => {
    if (!window.confirm('¿Estás seguro de eliminar este tema y todo su contenido?')) return;
    try {
      await cursosService.deleteTema(idTema);
      setSuccess('Tema eliminado exitosamente.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el tema.');
    }
  };

  // --- Handlers Material ---
  const handleOpenMaterialModal = (idTema) => {
    setActiveTemaId(idTema);
    setMaterialNombre('');
    setMaterialTipo('documento');
    setMaterialFile(null);
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!materialFile) {
      setError('Debes seleccionar un archivo para el material.');
      return;
    }
    setSubmitting(true);
    setError('');

    const backendTipo = materialTipo === 'video' ? 'video' : 'PDF';

    const formData = new FormData();
    formData.append('titulo', materialNombre);
    formData.append('nombre', materialNombre);
    formData.append('tipo', backendTipo);
    formData.append('archivo', materialFile);

    try {
      await (cursosService.createMaterial || cursosService.uploadMaterial)(activeTemaId, formData);
      setSuccess('Material cargado exitosamente.');
      setIsMaterialModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null;
      setError(backendErr || err.response?.data?.message || 'Error al subir el material.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (item) => {
    const idMaterial = typeof item === 'object' ? (item?.idMaterial || item?.itemable_id || item?.itemable?.idMaterial || item?.resource?.idMaterial) : item;
    if (!idMaterial) {
      setError('ID de material no encontrado para eliminar.');
      return;
    }

    if (!window.confirm('¿Deseas eliminar este material?')) return;
    try {
      await cursosService.deleteMaterial(idMaterial);
      setSuccess('Material eliminado exitosamente.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el material.');
    }
  };

  // --- Handlers Secure Viewer ---
  const handleOpenSecureViewer = async (item) => {
    const idMaterial = item?.idMaterial || item?.itemable_id || item?.itemable?.idMaterial || item?.resource?.idMaterial;
    if (!idMaterial) {
      setViewerError('ID de material no encontrado.');
      return;
    }
    setActiveViewerMaterial(item.itemable || item.resource || item);
    setViewerLoading(true);
    setViewerError('');
    setViewerBlobUrl('');

    try {
      const token = authService.getToken() || storage.get('token') || storage.get('auth_token');
      const response = await fetch(`${API_URL}/materiales/${idMaterial}/stream`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json, */*',
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo cargar el recurso protegido.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setViewerBlobUrl(objectUrl);
    } catch (err) {
      console.error(err);
      setViewerError(err.message || 'Error al visualizar el archivo.');
    } finally {
      setViewerLoading(false);
    }
  };

  const handleCloseSecureViewer = () => {
    if (viewerBlobUrl) {
      URL.revokeObjectURL(viewerBlobUrl);
    }
    setActiveViewerMaterial(null);
    setViewerBlobUrl('');
    setViewerError('');
  };

  const handleDownloadMaterial = async (item) => {
    const idMaterial = item?.idMaterial || item?.itemable_id || item?.itemable?.idMaterial || item?.resource?.idMaterial;
    if (!idMaterial) {
      alert('ID de material no encontrado.');
      return;
    }
    try {
      const token = authService.getToken() || storage.get('token') || storage.get('auth_token');
      const response = await fetch(`${API_URL}/materiales/${idMaterial}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json, */*'
        }
      });
      if (!response.ok) throw new Error('Error al descargar el archivo.');
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = item.titulo || item.nombre_archivo_original || item.nombre || 'material';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert('No se pudo descargar el material.');
    }
  };

  // --- Handlers Desafío ---
  const handleOpenDesafioModal = (idTema) => {
    setActiveTemaId(idTema);
    setDesafioTitulo('');
    setDesafioDescripcion('');
    setDesafioDificultad('Facil');
    setDesafioLenguaje('python');
    setDesafioPlantillaCodigo('# Escribe tu solución aquí\ndef solucion():\n    pass\n');
    setDesafioTestCases([
      { id: generateTestCaseId(), input: '', expected_output: '', is_public: true }
    ]);
    setIsDesafioModalOpen(true);
  };

  const handleAddTestCase = () => {
    setDesafioTestCases(prev => [
      ...prev,
      { id: generateTestCaseId(), input: '', expected_output: '', is_public: true }
    ]);
  };

  const handleRemoveTestCase = (tcId) => {
    if (desafioTestCases.length <= 1) return;
    setDesafioTestCases(prev => prev.filter(tc => tc.id !== tcId));
  };

  const handleTestCaseChange = (tcId, field, value) => {
    setDesafioTestCases(prev => prev.map(tc => {
      if (tc.id === tcId) {
        return { ...tc, [field]: value };
      }
      return tc;
    }));
  };

  const handleSaveDesafio = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formattedTestCases = desafioTestCases.map(tc => ({
      input: tc.input,
      expected_output: tc.expected_output,
      is_public: Boolean(tc.is_public)
    }));

    const payload = {
      titulo: desafioTitulo,
      descripcion: desafioDescripcion,
      dificultad: desafioDificultad,
      lenguaje_permitido: desafioLenguaje,
      plantilla_codigo: desafioPlantillaCodigo,
      test_cases: formattedTestCases
    };

    try {
      await desafiosService.createDesafio(activeTemaId, payload);
      setSuccess('Desafío práctico creado exitosamente.');
      setIsDesafioModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al crear el desafío.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDesafio = async (idDesafio) => {
    if (!window.confirm('¿Estás seguro de eliminar este desafío?')) return;
    try {
      await desafiosService.deleteDesafio(idDesafio);
      setSuccess('Desafío eliminado exitosamente.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el desafío.');
    }
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
            className="px-6 py-2 bg-[#2c5364] text-white rounded-xl font-bold text-sm"
          >
            Volver a la Lista de Cursos
          </button>
        </div>
      </DashboardContainer>
    );
  }

  const progreso = curso.progreso || { porcentaje: 0, itemsCompletados: 0, totalItems: 0, xpGanado: 0, xpTotal: 0 };

  const renderActiveTabContent = () => {
    if (activeTab === 'foro') {
      return <ForoSeccion idCurso={id} user={user} temas={curso.temas} />;
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
                      tema.items?.map((item) => {
                        const isDesafio = item.itemable_type?.includes('Desafio') || Boolean(item.dificultad);
                        const isMaterial = item.itemable_type?.includes('Material') || Boolean(item.tipo_archivo);

                        return (
                          <div key={item.idItem || item.idMaterial || item.idDesafio} className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-between items-center gap-4 hover:border-slate-300 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl text-xs font-black ${
                                isDesafio ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-[#2c5364]'
                              }`}>
                                {isDesafio ? <Code size={18} /> : <FileText size={18} />}
                              </div>

                              <div>
                                <h4 className="font-extrabold text-xs text-slate-900">
                                  {item.titulo || item.itemable?.titulo || item.nombre}
                                </h4>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  {isDesafio ? `Desafío (${item.dificultad || item.itemable?.dificultad || 'Práctico'})` : `Material (${item.tipo || 'Lectura'})`}
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
                                  onClick={() => navigate(`/desafios/${item.idDesafio || item.itemable_id}`)}
                                  className="px-3 py-1.5 bg-[#2c5364] hover:bg-[#203a43] text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <Play size={14} fill="currentColor" />
                                  <span>Resolver Desafío</span>
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
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
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
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-[#2c5364] text-xs font-black uppercase tracking-wider">
                {curso.lenguaje || 'General'}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{curso.titulo}</h1>
              <p className="text-slate-600 text-xs font-medium max-w-2xl">{curso.descripcion}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                curso.esPrivado ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {curso.esPrivado ? 'Curso Privado' : 'Curso Público'}
              </span>
            </div>
          </div>

          {/* Componente Modular de Barra de Progreso */}
          {user?.rol === 'Estudiante' && (
            <CourseProgressBar progreso={progreso} />
          )}
        </div>

        {/* Navegación por pestañas (Temas vs Quizzes vs Foro) */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('temas')}
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'temas'
                ? 'border-[#2c5364] text-[#2c5364]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
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
                : 'border-transparent text-slate-500 hover:text-slate-900'
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
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare size={18} />
            <span>Foro de Preguntas & Q&A</span>
          </button>
        </div>

        {/* Renderizado Condicional por Pestaña */}
        {renderActiveTabContent()}

      </div>

      {/* --- MODAL FORMS --- */}

      {/* Modal Tema */}
      {isTemaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {temaEditId ? 'Editar Tema' : 'Nuevo Tema o Módulo'}
              </h3>
              <button type="button" onClick={() => setIsTemaModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTema} className="space-y-4">
              <div>
                <label htmlFor="tema-form-nombre" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Nombre del Tema</label>
                <input 
                  id="tema-form-nombre"
                  type="text"
                  required
                  placeholder="Ej. Introducción a Funciones"
                  value={temaNombre}
                  onChange={(e) => setTemaNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs"
                />
              </div>

              <div>
                <label htmlFor="tema-form-descripcion" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Descripción</label>
                <textarea 
                  id="tema-form-descripcion"
                  rows="3"
                  placeholder="Breve explicación de los objetivos del tema..."
                  value={temaDescripcion}
                  onChange={(e) => setTemaDescripcion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsTemaModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold rounded-xl shadow-xs">
                  {submitting ? 'Guardando...' : 'Guardar Tema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Material */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Cargar Material de Aprendizaje</h3>
              <button type="button" onClick={() => setIsMaterialModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <div>
                <label htmlFor="mat-form-nombre" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Nombre del Material</label>
                <input 
                  id="mat-form-nombre"
                  type="text"
                  required
                  placeholder="Ej. Guía Teórica de Condicionales PDF"
                  value={materialNombre}
                  onChange={(e) => setMaterialNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs"
                />
              </div>

              <div>
                <label htmlFor="mat-form-tipo" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Tipo de Recurso</label>
                <select 
                  id="mat-form-tipo"
                  value={materialTipo}
                  onChange={(e) => setMaterialTipo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs"
                >
                  <option value="documento">Documento / Guía (PDF)</option>
                  <option value="video">Video Explicativo (MP4)</option>
                  <option value="presentacion">Presentación / Diapositivas</option>
                  <option value="codigo">Código de Ejemplo (.py)</option>
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

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsMaterialModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold rounded-xl shadow-xs">
                  {submitting ? 'Subiendo...' : 'Cargar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Desafío Práctico */}
      {isDesafioModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full my-8 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Crear Desafío Práctico de Código</h3>
              <button type="button" onClick={() => setIsDesafioModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="des-form-dificultad" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Dificultad</label>
                  <select 
                    id="des-form-dificultad"
                    value={desafioDificultad}
                    onChange={(e) => setDesafioDificultad(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs resize-none bg-slate-50"
                />
              </div>

              {/* Casos de Prueba */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900 uppercase">Casos de Prueba ({desafioTestCases.length})</span>
                  <button 
                    type="button" 
                    onClick={handleAddTestCase}
                    className="text-xs font-bold text-[#2c5364] hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Añadir Caso
                  </button>
                </div>

                {desafioTestCases.map((tc, idx) => (
                  <div key={tc.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-700">Caso #{idx + 1}</span>
                      {desafioTestCases.length > 1 && (
                        <button type="button" onClick={() => handleRemoveTestCase(tc.id)} className="text-slate-400 hover:text-red-600">
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
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono"
                      />
                      <input 
                        type="text"
                        required
                        placeholder="Salida Esperada (Expected Output)..."
                        value={tc.expected_output}
                        onChange={(e) => handleTestCaseChange(tc.id, 'expected_output', e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsDesafioModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold rounded-xl shadow-xs">
                  {submitting ? 'Creando...' : 'Crear Desafío'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Secure Viewer */}
      {activeViewerMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-sm truncate">{activeViewerMaterial.nombre}</h3>
              <button type="button" onClick={handleCloseSecureViewer} className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 flex items-center justify-center relative">
              {viewerLoading && (
                <div className="space-y-3 text-center">
                  <Loader2 size={36} className="animate-spin text-[#2c5364] mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Cargando visualización segura...</p>
                </div>
              )}

              {viewerError && (
                <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center space-y-2">
                  <AlertCircle size={32} className="mx-auto" />
                  <p className="text-xs font-bold">{viewerError}</p>
                </div>
              )}

              {!viewerLoading && !viewerError && viewerBlobUrl && (
                <iframe 
                  src={viewerBlobUrl} 
                  title={activeViewerMaterial.nombre}
                  className="w-full h-full border-none"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </DashboardContainer>
  );
};

export default CursoDetallePage;
