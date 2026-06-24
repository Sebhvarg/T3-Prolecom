import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { cursosService } from '../../api/cursosService';
import { desafiosService } from '../../api/desafiosService';
import { storage } from '../../utils/crypto';
import { 
  ArrowLeft, Plus, Trash2, FileText, Video, Play, Download, Eye, 
  X, AlertCircle, Loader2, CheckCircle2, ChevronDown, ChevronUp, Code 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://172.19.139.35:8000/api';

let testCaseIdCounter = 0;
const generateTestCaseId = () => {
  testCaseIdCounter += 1;
  return `tc-id-${testCaseIdCounter}`;
};

const CursoDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedTemas, setExpandedTemas] = useState({});

  // Modales
  const [isTemaModalOpen, setIsTemaModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [activeTemaId, setActiveTemaId] = useState(null);

  // Desafio Modal States
  const [isDesafioModalOpen, setIsDesafioModalOpen] = useState(false);
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

  const fetchCurso = async () => {
    setLoading(true);
    try {
      const data = await cursosService.getCurso(id);
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
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await cursosService.getCurso(id);
        if (!active) return;
        setCurso(data);
        
        // Auto-expandir todos los temas al iniciar
        const expandMap = {};
        data.temas?.forEach(t => {
          expandMap[t.idTema] = true;
        });
        setExpandedTemas(expandMap);
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError('No se pudo cargar la información del curso.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const toggleTema = (temaId) => {
    setExpandedTemas(prev => ({
      ...prev,
      [temaId]: !prev[temaId]
    }));
  };

  // --- TEMAS (MÓDULOS) LOGIC ---
  const handleOpenTemaModal = () => {
    setTemaForm({ nombre: '', descripcion: '' });
    setIsTemaModalOpen(true);
  };

  const handleTemaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setActionLoading(true);
    try {
      await cursosService.createTema(id, temaForm);
      setSuccess('Tema creado exitosamente.');
      setIsTemaModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al crear el tema.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTema = async (temaId, e) => {
    e.stopPropagation(); // Evitar colapso de acordeón
    if (!globalThis.confirm('¿Estás seguro de eliminar este tema y todos sus materiales de aprendizaje?')) return;
    setError('');
    try {
      await cursosService.deleteTema(temaId);
      setSuccess('Tema eliminado correctamente.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al eliminar el tema.');
    }
  };

  // --- MATERIALES LOGIC ---
  const handleOpenMaterialModal = (temaId) => {
    setActiveTemaId(temaId);
    setMaterialForm({ titulo: '', descripcion: '', tipo: 'PDF' });
    setSelectedFile(null);
    setIsMaterialModalOpen(true);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Debes seleccionar un archivo para subir.');
      return;
    }
    const maxSizeBytes = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > maxSizeBytes) {
      setError('El archivo excede el tamaño máximo permitido por el servidor (100MB).');
      return;
    }

    setError('');
    setActionLoading(true);

    const formData = new FormData();
    formData.append('titulo', materialForm.titulo);
    formData.append('descripcion', materialForm.descripcion || '');
    formData.append('tipo', materialForm.tipo);
    formData.append('archivo', selectedFile);

    try {
      await cursosService.createMaterial(activeTemaId, formData);
      setSuccess('Material subido exitosamente.');
      setIsMaterialModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al subir el material.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- DESAFIOS LOGIC ---
  const handleOpenDesafioModal = (temaId) => {
    setActiveTemaId(temaId);
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

  const handleAddTestCase = () => {
    setDesafioForm(prev => ({
      ...prev,
      testCases: [...prev.testCases, { id: generateTestCaseId(), input: '', expected_output: '', is_hidden: false }]
    }));
  };

  const handleRemoveTestCase = (index) => {
    setDesafioForm(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setDesafioForm(prev => {
      const updated = [...prev.testCases];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, testCases: updated };
    });
  };

  const handleDesafioSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setActionLoading(true);
    try {
      const cleanedDesafioForm = {
        ...desafioForm,
        testCases: desafioForm.testCases.map((tc) => {
          const copy = { ...tc };
          delete copy.id;
          return copy;
        })
      };
      await desafiosService.createDesafio(activeTemaId, cleanedDesafioForm);
      setSuccess('Desafío creado exitosamente.');
      setIsDesafioModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al crear el desafío.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!globalThis.confirm('¿Estás seguro de eliminar este material de aprendizaje de forma permanente?')) return;
    setError('');
    try {
      await cursosService.deleteMaterial(materialId);
      setSuccess('Material eliminado correctamente.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al eliminar el material.');
    }
  };

  const handleDeleteDesafio = async (desafioId) => {
    if (!globalThis.confirm('¿Estás seguro de eliminar este desafío de forma permanente?')) return;
    setError('');
    try {
      await desafiosService.deleteDesafio(desafioId);
      setSuccess('Desafío eliminado correctamente.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al eliminar el desafío.');
    }
  };

  // --- SECURE VIEWER LOGIC ---
  const handleViewSecure = async (material) => {
    setActiveViewerMaterial(material);
    setViewerLoading(true);
    setViewerError('');
    
    // Revocar el url anterior si existía
    if (viewerBlobUrl) {
      URL.revokeObjectURL(viewerBlobUrl);
      setViewerBlobUrl('');
    }

    try {
      const token = storage.get('token');
      const response = await fetch(`${API_URL}/materiales/${material.idMaterial}/stream`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('No estás autorizado para ver este recurso.');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setViewerBlobUrl(blobUrl);
    } catch (err) {
      console.error(err);
      setViewerError(err.message || 'Error al cargar el visor seguro.');
    } finally {
      setViewerLoading(false);
    }
  };

  const handleCloseViewer = () => {
    if (viewerBlobUrl) {
      URL.revokeObjectURL(viewerBlobUrl);
      setViewerBlobUrl('');
    }
    setActiveViewerMaterial(null);
  };

  const handleDownloadSecure = async (material) => {
    try {
      const token = storage.get('token');
      const response = await fetch(`${API_URL}/materiales/${material.idMaterial}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        alert('Error al descargar el archivo.');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Intentar obtener el nombre del header Content-Disposition
      const disposition = response.headers.get('Content-Disposition');
      let filename = material.titulo;
      if (disposition && disposition.includes('filename=')) {
        const matches = /filename="?([^"]+)"?/.exec(disposition);
        if (matches?.[1]) filename = matches[1];
      } else {
        filename += material.tipo === 'PDF' ? '.pdf' : '.mp4';
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error en la descarga del archivo.');
    }
  };

  if (loading) {
    return (
      <DashboardContainer title="Detalle del Curso" user={user}>
        <div className="flex flex-col justify-center items-center h-96 gap-4">
          <Loader2 className="animate-spin h-12 w-12 text-[#2c5364]" />
          <p className="text-gray-500 font-semibold">Cargando el contenido del curso...</p>
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
            onClick={() => navigate('/cursos')}
            className="mt-6 inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white px-5 py-2.5 rounded-xl font-semibold shadow"
          >
            <ArrowLeft size={18} />
            <span>Volver a Cursos</span>
          </button>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer title={`Curso: ${curso.titulo}`} user={user}>
      {/* Botón Volver */}
      <button
        onClick={() => navigate('/cursos')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-semibold"
      >
        <ArrowLeft size={18} />
        <span>Volver a Cursos</span>
      </button>

      {/* Cabecera del Curso */}
      <div className="bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] rounded-3xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
          <FileText size={240} />
        </div>
        <div className="relative z-10">
          <div className="flex gap-3 mb-4">
            <span className="px-3.5 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider">
              {curso.lp}
            </span>
            <span className="px-3.5 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider">
              {curso.tipo}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{curso.titulo}</h1>
          <p className="text-white/80 mt-3 max-w-2xl text-sm md:text-base leading-relaxed">{curso.descripcion}</p>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-white/70">
            <div>
              Profesor: <span className="font-bold text-white">{curso.creador?.nombreCompleto || 'Desconocido'}</span>
            </div>
            <div>
              Temas: <span className="font-bold text-white">{curso.temas?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} className="shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Secciones de Contenido */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Temas del Curso</h2>
        {canManage && (
          <button
            onClick={handleOpenTemaModal}
            className="flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all hover:shadow-md"
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
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
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
                        onClick={() => handleOpenMaterialModal(tema.idTema)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        <Plus size={14} />
                        <span>Subir Material</span>
                      </button>
                      <button
                        onClick={() => handleOpenDesafioModal(tema.idTema)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        <Plus size={14} />
                        <span>Crear Desafío</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteTema(tema.idTema, e)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Tema"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleTema(tema.idTema)}
                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={expandedTemas[tema.idTema] ? "Colapsar tema" : "Expandir tema"}
                  >
                    {expandedTemas[tema.idTema] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {expandedTemas[tema.idTema] && (
                <div className="border-t border-gray-50 bg-gray-50/10 p-5 space-y-3">
                  {tema.items?.length === 0 ? (
                    <p className="text-gray-400 text-sm italic py-2">No hay contenidos cargados en este tema.</p>
                  ) : (
                    tema.items?.map((item) => {
                      const resource = item.itemable;
                      if (!resource) return null;

                      const isMaterial = item.itemable_type.includes('MaterialAprendizaje');
                      const isDesafio = item.itemable_type.includes('Desafio');

                      if (isMaterial) {
                        return renderMaterialItem(
                          item,
                          resource,
                          canManage,
                          handleViewSecure,
                          handleDownloadSecure,
                          handleDeleteMaterial
                        );
                      }

                      if (isDesafio) {
                        return renderDesafioItem(item, resource, id, navigate, canManage, handleDeleteDesafio);
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

      {/* --- MODAL CREAR TEMA --- */}
      {isTemaModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setIsTemaModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Crear Nuevo Tema</h3>
            <p className="text-gray-500 text-sm mb-6">Organiza el contenido del curso creando unidades o secciones.</p>
            <form onSubmit={handleTemaSubmit} className="space-y-4">
              <div>
                <label htmlFor="tema-nombre" className="block text-sm font-bold text-gray-700 mb-1.5">Nombre del Tema</label>
                <input 
                  id="tema-nombre"
                  type="text" 
                  required
                  placeholder="Ej: Fundamentos de bucles, OOP en Python..."
                  value={temaForm.nombre}
                  onChange={(e) => setTemaForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                />
              </div>
              <div>
                <label htmlFor="tema-descripcion" className="block text-sm font-bold text-gray-700 mb-1.5">Descripción (Opcional)</label>
                <textarea 
                  id="tema-descripcion"
                  placeholder="Detalla qué conceptos se cubren en esta sección..."
                  value={temaForm.descripcion}
                  onChange={(e) => setTemaForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsTemaModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2c5364] hover:bg-[#203a43] text-white rounded-xl text-sm font-semibold shadow flex items-center gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Publicar Tema</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL SUBIR MATERIAL --- */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setIsMaterialModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Subir Material de Aprendizaje</h3>
            <p className="text-gray-500 text-sm mb-6">Añade guías en formato PDF o grabaciones de clase.</p>
            <form onSubmit={handleMaterialSubmit} className="space-y-4">
              <div>
                <label htmlFor="material-titulo" className="block text-sm font-bold text-gray-700 mb-1.5">Título</label>
                <input 
                  id="material-titulo"
                  type="text" 
                  required
                  placeholder="Ej: Apuntes de Condicionales, Video Clase 1..."
                  value={materialForm.titulo}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                />
              </div>
              <div>
                <label htmlFor="material-descripcion" className="block text-sm font-bold text-gray-700 mb-1.5">Descripción (Opcional)</label>
                <input 
                  id="material-descripcion"
                  type="text"
                  placeholder="Ej: Lectura complementaria de 15 páginas..."
                  value={materialForm.descripcion}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                />
              </div>
              <div>
                <label htmlFor="material-tipo" className="block text-sm font-bold text-gray-700 mb-1.5">Tipo de Recurso</label>
                <select
                  id="material-tipo"
                  value={materialForm.tipo}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                >
                  <option value="PDF">Documento PDF</option>
                  <option value="video">Grabación / Clase en Video</option>
                </select>
              </div>
              <div>
                <label htmlFor="material-archivo" className="block text-sm font-bold text-gray-700 mb-1.5">Seleccionar Archivo (Máx 30MB)</label>
                <input 
                  id="material-archivo"
                  type="file" 
                  required
                  accept={materialForm.tipo === 'PDF' ? 'application/pdf' : 'video/*'}
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2c5364] hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2c5364] hover:bg-[#203a43] text-white rounded-xl text-sm font-semibold shadow flex items-center gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Subir Recurso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CREAR DESAFÍO --- */}
      {isDesafioModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative my-8">
            <button 
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
                  <label htmlFor="desafio-titulo" className="block text-sm font-bold text-gray-700 mb-1.5">Título del Desafío</label>
                  <input 
                    id="desafio-titulo"
                    type="text" 
                    required
                    placeholder="Ej: Suma de dos números..."
                    value={desafioForm.titulo}
                    onChange={(e) => setDesafioForm(prev => ({ ...prev, titulo: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                  />
                </div>
                <div>
                  <label htmlFor="desafio-dificultad" className="block text-sm font-bold text-gray-700 mb-1.5">Dificultad</label>
                  <select
                    id="desafio-dificultad"
                    value={desafioForm.dificultad}
                    onChange={(e) => setDesafioForm(prev => ({ ...prev, dificultad: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                  >
                    <option value="Easy">Fácil</option>
                    <option value="Medium">Medio</option>
                    <option value="Hard">Difícil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="desafio-puntos" className="block text-sm font-bold text-gray-700 mb-1.5">Puntos de XP</label>
                  <input 
                    id="desafio-puntos"
                    type="number" 
                    min="1"
                    required
                    value={desafioForm.puntos}
                    onChange={(e) => setDesafioForm(prev => ({ ...prev, puntos: Number.parseInt(e.target.value, 10) || 10 }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="desafio-starter-code" className="block text-sm font-bold text-gray-700 mb-1.5">Código Base (Starter Code)</label>
                <textarea 
                  id="desafio-starter-code"
                  placeholder="def solucion():&#10;    # escribe tu código aquí"
                  value={desafioForm.starter_code}
                  onChange={(e) => setDesafioForm(prev => ({ ...prev, starter_code: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] h-36 font-mono text-sm bg-gray-50/50 resize-y"
                />
              </div>

              <div>
                <label htmlFor="desafio-descripcion" className="block text-sm font-bold text-gray-700 mb-1.5">Enunciado del Problema</label>
                <textarea 
                  id="desafio-descripcion"
                  required
                  placeholder="Escribe la descripción del problema en Markdown o texto claro..."
                  value={desafioForm.descripcionProblema}
                  onChange={(e) => setDesafioForm(prev => ({ ...prev, descripcionProblema: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] h-20 resize-none text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Casos de Prueba (Mínimo 1)</span>
                  <button
                    type="button"
                    onClick={handleAddTestCase}
                    className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    + Agregar Caso
                  </button>
                </div>
                
                <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
                  {desafioForm.testCases.map((tc, index) => (
                    <div key={tc.id || `tc-case-${index}`} className="flex gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-150 relative">
                      <div className="flex-1">
                        <input 
                          type="text"
                          placeholder="Input (ej: 5)"
                          value={tc.input}
                          onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1 text-xs mb-1.5"
                        />
                        <input 
                          type="text"
                          required
                          placeholder="Salida esperada (ej: 10)"
                          value={tc.expected_output}
                          onChange={(e) => handleTestCaseChange(index, 'expected_output', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1 text-xs"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <label htmlFor={`tc-hidden-${index}`} className="text-[10px] font-bold text-gray-500 uppercase select-none">Oculto</label>
                        <input 
                          id={`tc-hidden-${index}`}
                          type="checkbox"
                          checked={tc.is_hidden}
                          onChange={(e) => handleTestCaseChange(index, 'is_hidden', e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </div>
                      {desafioForm.testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDesafioModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2c5364] hover:bg-[#203a43] text-white rounded-xl text-sm font-semibold shadow flex items-center gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Publicar Desafío</span>
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
                  onClick={() => handleDownloadSecure(activeViewerMaterial)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold rounded-lg transition-colors"
                  title="Descargar para almacenamiento sin conexión"
                >
                  <Download size={12} />
                  <span>Descargar</span>
                </button>
                <button 
                  onClick={handleCloseViewer}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contenedor del Visor */}
            <div className="flex-1 bg-gray-900 flex justify-center items-center p-2">
              {viewerLoading && (
                <div className="flex flex-col justify-center items-center text-white/80 gap-3">
                  <Loader2 className="animate-spin h-10 w-10 text-white" />
                  <p className="text-sm font-semibold">Descargando recurso a través de canal seguro...</p>
                </div>
              )}

              {viewerError && (
                <div className="text-center max-w-md p-6 bg-white rounded-2xl border border-red-100">
                  <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
                  <h4 className="font-bold text-gray-900">Error del Visor</h4>
                  <p className="text-gray-500 text-sm mt-1">{viewerError}</p>
                </div>
              )}

              {viewerBlobUrl && (
                <>
                  {activeViewerMaterial.tipo === 'PDF' ? (
                    <iframe 
                      src={`${viewerBlobUrl}#toolbar=0`} // #toolbar=0 previene descargar desde el control de pdf nativo
                      className="w-full h-full rounded-2xl bg-white border-0" 
                      title={activeViewerMaterial.titulo} 
                    />
                  ) : (
                    <video 
                      src={viewerBlobUrl} 
                      controls 
                      className="w-full max-h-full rounded-2xl shadow-lg"
                      autoPlay
                      controlsList="nodownload" // previene el botón de descarga nativo del navegador
                    >
                      <track kind="captions" />
                    </video>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
  );
};

const renderMaterialItem = (item, resource, canManage, handleViewSecure, handleDownloadSecure, handleDeleteMaterial) => {
  return (
    <div key={item.idItemTema} className="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-xl shadow-xs hover:shadow-md transition-shadow w-full">
      <div className="flex items-center gap-4.5">
        <div className={`p-2.5 rounded-xl ${
          resource.tipo === 'PDF' ? 'bg-red-50 text-red-700' : 'bg-purple-50 text-purple-700'
        }`}>
          {resource.tipo === 'PDF' ? <FileText size={20} /> : <Video size={20} />}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm md:text-base leading-snug">{resource.titulo}</h4>
          {resource.descripcion && <p className="text-gray-500 text-xs mt-0.5">{resource.descripcion}</p>}
          <div className="flex items-center gap-3 mt-1.5 text-xxs text-gray-400 font-semibold uppercase tracking-wider">
            <span>Subido por {resource.creador?.nombreCompleto || 'Profesor'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleViewSecure(resource)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors"
        >
          {resource.tipo === 'video' ? <Play size={14} /> : <Eye size={14} />}
          <span>{resource.tipo === 'video' ? 'Reproducir' : 'Ver'}</span>
        </button>
        
        <button
          onClick={() => handleDownloadSecure(resource)}
          className="p-1.5 border border-gray-100 hover:border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          title="Descargar"
        >
          <Download size={14} />
        </button>

        {canManage && (
          <button
            onClick={() => handleDeleteMaterial(resource.idMaterial)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar Material"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

const renderDesafioItem = (item, resource, id, navigate, canManage, handleDeleteDesafio) => {
  const getDificultadBadgeClass = (dificultad) => {
    if (dificultad === 'Easy') return 'bg-green-50 text-green-700';
    if (dificultad === 'Medium') return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-700';
  };

  return (
    <div key={item.idItemTema} className="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-xl shadow-xs hover:shadow-md transition-shadow w-full">
      <div className="flex items-center gap-4.5">
        <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
          <Code size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 text-sm md:text-base leading-snug">{resource.titulo}</h4>
            <span className={`px-2 py-0.5 text-xxs font-bold rounded-md uppercase tracking-wider ${getDificultadBadgeClass(resource.dificultad)}`}>
              {resource.dificultad}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{resource.descripcionProblema}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xxs text-gray-400 font-semibold uppercase tracking-wider">
            <span>Desafío de programación • Creado por {resource.creador?.nombreCompleto || 'Profesor'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(`/cursos/${id}/desafios/${resource.idDesafio}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          <Play size={14} />
          <span>Resolver</span>
        </button>

        {canManage && (
          <button
            onClick={() => handleDeleteDesafio(resource.idDesafio)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar Desafío"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CursoDetallePage;
