import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { cursosService } from '../../api/cursosService';
import { BookOpen, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, Users, UserPlus, Filter, Loader2, LayoutGrid, List, GraduationCap, UserCheck, User } from 'lucide-react';
import PropTypes from 'prop-types';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const CursosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
  
  // Modal states for Create/Edit Curso
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCurso, setEditingCurso] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    lp: '',
    tipo: 'público',
    idCategoria: 1,
  });

  // Matriculación y Filtros states
  const [activeTab, setActiveTab] = useState('mis_cursos'); // 'mis_cursos', 'disponibles'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [filterLp, setFilterLp] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [lps, setLps] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // Alumnos & Ayudantes Modal states
  const [isAlumnosModalOpen, setIsAlumnosModalOpen] = useState(false);
  const [selectedCursoForAlumnos, setSelectedCursoForAlumnos] = useState(null);
  const [alumnosMatriculados, setAlumnosMatriculados] = useState([]);
  const [ayudantesMatriculados, setAyudantesMatriculados] = useState([]);
  const [estudiantesSistema, setEstudiantesSistema] = useState([]);
  const [ayudantesSistema, setAyudantesSistema] = useState([]);
  const [alumnosLoading, setAlumnosLoading] = useState(false);
  const [ayudantesLoading, setAyudantesLoading] = useState(false);
  const [searchAyudante, setSearchAyudante] = useState('');
  const [showAllUsersForTA, setShowAllUsersForTA] = useState(false);

  // Search and Sort states for Manual Enrollment (Point 4)
  const [searchAvailable, setSearchAvailable] = useState('');
  const [sortAvailable, setSortAvailable] = useState('asc');
  const [searchEnrolled, setSearchEnrolled] = useState('');
  const [sortEnrolled, setSortEnrolled] = useState('asc');
  const [modalActiveTab, setModalActiveTab] = useState('matriculados');

  const canManage = user?.rol === 'Administrador' || user?.rol === 'Profesor';

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterLp) params.lp = filterLp;
      if (filterTipo) params.tipo = filterTipo;
      if (filterCategoria) params.idCategoria = filterCategoria;
      if (!canManage) {
        if (activeTab === 'mis_cursos') params.filtro = 'mis_cursos';
        else if (activeTab === 'disponibles') params.filtro = 'disponibles';
      }
      const data = await cursosService.getCursos(params);
      setCursos(data.slice().sort((a, b) => a.titulo.localeCompare(b.titulo, 'es', { numeric: true })));
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los cursos.');
    } finally {
      setLoading(false);
    }
  }, [filterLp, filterTipo, filterCategoria, activeTab, canManage]);

  // Cargar lenguajes y categorías al inicio
  useEffect(() => {
    const loadAllCatalogs = async () => {
      try {
        const [lpsData, catsData] = await Promise.all([
          cursosService.getLenguajes(),
          cursosService.getCategorias(),
        ]);
        setLps((lpsData || []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true })));
        setCategorias(catsData || []);
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
      }
    };
    loadAllCatalogs();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCursos();
  }, [fetchCursos]);

  useEffect(() => {
    if (location.state?.openModal && canManage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsModalOpen(true);
    }
  }, [location.state, canManage]);

  const handleOpenCreateModal = () => {
    setEditingCurso(null);
    setFormData({ titulo: '', descripcion: '', lp: '', tipo: 'público', idCategoria: 1 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (curso) => {
    setEditingCurso(curso);
    setFormData({
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      lp: curso.lp,
      tipo: curso.tipo,
      idCategoria: curso.idCategoria || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSubmitting(true);
      if (editingCurso) {
        await cursosService.updateCurso(editingCurso.idCurso, formData);
        setSuccess('Curso actualizado correctamente.');
      } else {
        await cursosService.createCurso(formData);
        setSuccess('Curso creado correctamente.');
      }
      setIsModalOpen(false);
      fetchCursos();
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al guardar el curso.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Eliminar Curso',
      message: '¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmText: 'Sí, eliminar',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setError('');
        setSuccess('');
        try {
          await cursosService.deleteCurso(id);
          setSuccess('Curso eliminado correctamente.');
          fetchCursos();
        } catch (err) {
          console.error(err);
          setError('No se pudo eliminar el curso.');
        }
      },
    });
  };

  // Student self-enrollment/unenrollment
  const handleInscribir = async (idCurso) => {
    setError('');
    setSuccess('');
    try {
      await cursosService.inscribirCurso(idCurso);
      setSuccess('Te has matriculado en el curso con éxito.');
      fetchCursos();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al intentar matricularse.');
    }
  };

  const handleDesmatricular = (idCurso) => {
    setConfirmState({
      isOpen: true,
      title: 'Darse de baja del curso',
      message: '¿Estás seguro de que deseas darte de baja de este curso?',
      variant: 'warning',
      confirmText: 'Sí, darme de baja',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setError('');
        setSuccess('');
        try {
          await cursosService.desmatricularCurso(idCurso);
          setSuccess('Te has dado de baja del curso con éxito.');
          fetchCursos();
        } catch (err) {
          console.error(err);
          setError(err.message || 'Error al intentar darse de baja.');
        }
      },
    });
  };

  // Manual enrollment and view students/ayudantes (Professor/Admin)
  const refreshAlumnosList = useCallback(async (cursoId) => {
    setAlumnosLoading(true);
    try {
      const enrolled = await cursosService.getEstudiantesMatriculados(cursoId);
      setAlumnosMatriculados(enrolled.slice().sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es', { numeric: true })));
    } catch (err) {
      console.error(err);
      setError('Error al actualizar la lista de alumnos.');
    } finally {
      setAlumnosLoading(false);
    }
  }, []);

  const refreshAyudantesList = useCallback(async (cursoId) => {
    setAyudantesLoading(true);
    try {
      const ayus = await cursosService.getAyudantes(cursoId);
      setAyudantesMatriculados(ayus || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAyudantesLoading(false);
    }
  }, []);

  const handleOpenAlumnosModal = async (curso) => {
    setSelectedCursoForAlumnos(curso);
    setIsAlumnosModalOpen(true);
    setError('');
    setSuccess('');
    setSearchAvailable('');
    setSortAvailable('asc');
    setSearchEnrolled('');
    setSortEnrolled('asc');
    setSearchAyudante('');
    setModalActiveTab('matriculados');
    
    refreshAlumnosList(curso.idCurso);
    refreshAyudantesList(curso.idCurso);
    
    try {
      const [allStudents, allTAs] = await Promise.all([
        cursosService.getEstudiantesSistema(),
        cursosService.getAyudantesSistema().catch(() => []),
      ]);
      setEstudiantesSistema(allStudents || []);
      setAyudantesSistema(allTAs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAsignarAyudanteDirect = async (estudiante) => {
    if (!selectedCursoForAlumnos) return;
    setError('');
    setSuccess('');
    try {
      await cursosService.asignarAyudante(selectedCursoForAlumnos.idCurso, {
        idUsuarioAyudante: estudiante.idUsuario,
      });
      setSuccess(`¡${estudiante.nombreCompleto} ha sido asignado como Ayudante de Cátedra!`);
      refreshAyudantesList(selectedCursoForAlumnos.idCurso);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al asignar ayudante.');
    }
  };

  const handleDesasignarAyudanteDirect = (idAyudante) => {
    if (!selectedCursoForAlumnos) return;
    setConfirmState({
      isOpen: true,
      title: 'Remover Ayudante',
      message: '¿Estás seguro de que deseas remover a este ayudante del curso?',
      variant: 'danger',
      confirmText: 'Sí, remover',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setError('');
        setSuccess('');
        try {
          await cursosService.desasignarAyudante(selectedCursoForAlumnos.idCurso, idAyudante);
          setSuccess('Ayudante removido del curso exitosamente.');
          refreshAyudantesList(selectedCursoForAlumnos.idCurso);
        } catch (err) {
          console.error(err);
          setError(err.message || 'Error al remover ayudante.');
        }
      },
    });
  };

  const getFilteredAndSortedAvailable = () => {
    let list = estudiantesSistema.filter(
      (est) => !alumnosMatriculados.some((e) => e.idUsuario === est.idUsuario)
    );

    if (searchAvailable.trim() !== '') {
      const q = searchAvailable.toLowerCase();
      list = list.filter(
        (est) =>
          est.nombreCompleto.toLowerCase().includes(q) ||
          est.email.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const nameA = a.nombreCompleto || '';
      const nameB = b.nombreCompleto || '';
      return sortAvailable === 'asc'
        ? nameA.localeCompare(nameB, 'es', { numeric: true })
        : nameB.localeCompare(nameA, 'es', { numeric: true });
    });

    return list;
  };

  const getFilteredAndSortedEnrolled = () => {
    let list = [...alumnosMatriculados];

    if (searchEnrolled.trim() !== '') {
      const q = searchEnrolled.toLowerCase();
      list = list.filter(
        (est) =>
          est.nombreCompleto.toLowerCase().includes(q) ||
          est.email.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const nameA = a.nombreCompleto || '';
      const nameB = b.nombreCompleto || '';
      return sortEnrolled === 'asc'
        ? nameA.localeCompare(nameB, 'es', { numeric: true })
        : nameB.localeCompare(nameA, 'es', { numeric: true });
    });

    return list;
  };

  const handleMatricularDirect = async (student) => {
    setError('');
    setSuccess('');
    try {
      await cursosService.matricularManual(selectedCursoForAlumnos.idCurso, student.email);
      setSuccess(`Estudiante ${student.nombreCompleto} matriculado con éxito.`);
      refreshAlumnosList(selectedCursoForAlumnos.idCurso);
      fetchCursos();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al matricular al estudiante.');
    }
  };

  const handleDesmatricularEstudianteManual = (idEstudiante) => {
    if (!selectedCursoForAlumnos) return;
    setConfirmState({
      isOpen: true,
      title: 'Desmatricular Estudiante',
      message: '¿Estás seguro de que deseas desmatricular a este estudiante de este curso?',
      variant: 'danger',
      confirmText: 'Sí, desmatricular',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setError('');
        setSuccess('');
        try {
          await cursosService.desmatricularCurso(selectedCursoForAlumnos.idCurso, idEstudiante);
          setSuccess('Estudiante desmatriculado con éxito.');
          refreshAlumnosList(selectedCursoForAlumnos.idCurso);
          fetchCursos();
        } catch (err) {
          console.error(err);
          setError(err.message || 'Error al desmatricular al estudiante.');
        }
      },
    });
  };

  const renderCursosList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c5364]"></div>
        </div>
      );
    }
    if (cursos.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No hay cursos disponibles</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto text-xs font-medium">Actualmente no se han encontrado cursos en la plataforma con estos filtros.</p>
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="space-y-3 animate-fade-in">
          {cursos.map((curso) => (
            <CursoListItem
              key={curso.idCurso}
              curso={curso}
              canManage={canManage}
              handleOpenAlumnosModal={handleOpenAlumnosModal}
              handleOpenEditModal={handleOpenEditModal}
              handleDelete={handleDelete}
              handleDesmatricular={handleDesmatricular}
              handleInscribir={handleInscribir}
              navigate={navigate}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {cursos.map((curso) => (
          <CursoCard
            key={curso.idCurso}
            curso={curso}
            canManage={canManage}
            handleOpenAlumnosModal={handleOpenAlumnosModal}
            handleOpenEditModal={handleOpenEditModal}
            handleDelete={handleDelete}
            handleDesmatricular={handleDesmatricular}
            handleInscribir={handleInscribir}
            navigate={navigate}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardContainer title="Cursos" user={user}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Cursos</h2>
          <p className="text-gray-500 mt-1">Explora, los cursos de la comunidad</p>
        </div>
        
        {canManage && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={20} />
            <span>Nuevo Curso</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Barra de Filtros y Navegación de Pestañas */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs for Students */}
        {canManage ? (
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <Filter size={18} />
            <span>Filtros de administrador:</span>
          </div>
        ) : (
          <div className="flex gap-2">
            {[
              { id: 'mis_cursos', label: 'Mis Cursos' },
              { id: 'disponibles', label: 'Cursos Disponibles' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#2c5364] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Dropdowns for LP and Tipo */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl min-w-[140px]">
            <span className="text-xs text-gray-400 font-bold uppercase">Lenguaje:</span>
            <select
              value={filterLp}
              onChange={(e) => setFilterLp(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none w-full cursor-pointer"
            >
              <option value="">Todos</option>
              {lps.map((lp) => (
                <option key={lp.idLenguaje} value={lp.nombre}>
                  {lp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl min-w-[140px]">
            <span className="text-xs text-gray-400 font-bold uppercase">Tipo:</span>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none w-full cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="público">Público</option>
              <option value="privado">Privado</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl min-w-[160px]">
            <span className="text-xs text-gray-400 font-bold uppercase">Categoría:</span>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none w-full cursor-pointer"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat.idCategoria} value={cat.idCategoria}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Vista Grid / Lista */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-[#2c5364] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista en Cuadrícula (Grid)"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#2c5364] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista en Lista"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {renderCursosList()}

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCurso ? 'Editar Curso' : 'Crear Nuevo Curso'}
        icon={BookOpen}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="titulo" className="text-xs font-extrabold text-slate-700 uppercase">Título del Curso <span className="text-red-500">*</span></label>
            <input
              id="titulo"
              type="text"
              required
              placeholder="Ej. Introducción a Python"
              className="w-full p-2.5 border border-slate-300 focus:border-[#2c5364] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20 text-slate-900 font-semibold text-xs transition-all"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="descripcion" className="text-xs font-extrabold text-slate-700 uppercase">Descripción <span className="text-red-500">*</span></label>
            <textarea
              id="descripcion"
              required
              rows={4}
              placeholder="Detalles sobre lo que aprenderán los estudiantes..."
              className="w-full p-2.5 border border-slate-300 focus:border-[#2c5364] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20 text-slate-900 font-semibold text-xs resize-none transition-all"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="lp" className="text-xs font-extrabold text-slate-700 uppercase">Lenguaje / LP <span className="text-red-500">*</span></label>
              <select
                id="lp"
                required
                className="w-full p-2.5 border border-slate-300 focus:border-[#2c5364] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20 text-slate-900 font-bold text-xs bg-white cursor-pointer"
                value={formData.lp}
                onChange={(e) => setFormData({ ...formData, lp: e.target.value })}
              >
                <option value="">Selecciona un lenguaje</option>
                {lps.map((lp) => (
                  <option key={lp.idLenguaje} value={lp.nombre}>
                    {lp.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="tipo" className="text-xs font-extrabold text-slate-700 uppercase">Tipo de Curso <span className="text-red-500">*</span></label>
              <select
                id="tipo"
                className="w-full p-2.5 border border-slate-300 focus:border-[#2c5364] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20 text-slate-900 font-bold text-xs bg-white cursor-pointer"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              >
                <option value="público">Público</option>
                <option value="privado">Privado</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="categoria" className="text-xs font-extrabold text-slate-700 uppercase">Categoría del Curso</label>
            <select
              id="categoria"
              className="w-full p-2.5 border border-slate-300 focus:border-[#2c5364] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20 text-slate-900 font-bold text-xs bg-white cursor-pointer"
              value={formData.idCategoria}
              onChange={(e) => setFormData({ ...formData, idCategoria: Number(e.target.value) })}
            >
              {categorias.map((cat) => (
                <option key={cat.idCategoria} value={cat.idCategoria}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#2c5364] hover:bg-[#203a43] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>{submitting ? 'Guardando...' : 'Guardar Curso'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal for Ver Alumnos */}
      {isAlumnosModalOpen && selectedCursoForAlumnos && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 animate-zoom-in flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsAlumnosModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {selectedCursoForAlumnos.lp}
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                Gestión de Cátedra y Alumnos
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Curso: <span className="font-semibold text-gray-800">{selectedCursoForAlumnos.titulo}</span>
              </p>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalActiveTab('matriculados')}
                className={`py-2.5 px-4 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  modalActiveTab === 'matriculados'
                    ? 'border-[#2c5364] text-[#2c5364]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Users size={16} />
                <span>Alumnos ({alumnosMatriculados.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('matricular')}
                className={`py-2.5 px-4 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  modalActiveTab === 'matricular'
                    ? 'border-[#2c5364] text-[#2c5364]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <UserPlus size={16} />
                <span>Matricular Alumno</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('ayudantes')}
                className={`py-2.5 px-4 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  modalActiveTab === 'ayudantes'
                    ? 'border-[#2c5364] text-[#2c5364]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <GraduationCap size={16} />
                <span>Ayudantes ({ayudantesMatriculados.length})</span>
              </button>
            </div>

            {(() => {
              if (modalActiveTab === 'matriculados') {
                return (
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Search and Sort for Enrolled */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <input
                        type="text"
                        placeholder="Buscar estudiante matriculado..."
                        value={searchEnrolled}
                        onChange={(e) => setSearchEnrolled(e.target.value)}
                        className="flex-1 p-2.5 border border-gray-300 hover:border-gray-400 focus:border-[#2c5364] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20 text-gray-900 bg-white shadow-sm transition-all"
                      />
                      <select
                        value={sortEnrolled}
                        onChange={(e) => setSortEnrolled(e.target.value)}
                        className="p-2.5 border border-gray-300 hover:border-gray-400 focus:border-[#2c5364] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20 text-gray-900 bg-white cursor-pointer shadow-sm transition-all"
                      >
                        <option value="asc">Nombre: A - Z</option>
                        <option value="desc">Nombre: Z - A</option>
                      </select>
                    </div>

                    {/* List of Enrolled */}
                    <div className="flex-1 overflow-y-auto border border-gray-150 rounded-2xl max-h-[35vh]">
                      {(() => {
                        if (alumnosLoading) {
                          return (
                            <div className="flex justify-center items-center h-48">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5364]"></div>
                            </div>
                          );
                        }
                        const enrolledFiltered = getFilteredAndSortedEnrolled();
                        if (enrolledFiltered.length === 0) {
                          return (
                            <div className="text-center py-12 text-gray-400">
                              <p className="font-semibold text-gray-500">No hay alumnos matriculados</p>
                            </div>
                          );
                        }
                        return (
                          <table className="w-full border-collapse text-left text-sm text-gray-500">
                            <thead className="bg-[#0f2027] text-xs font-semibold text-white uppercase tracking-wider border-b border-[#1e3a47] sticky top-0 z-10">
                              <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {enrolledFiltered.map((alumno) => (
                                <tr key={alumno.idUsuario} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4 font-semibold text-gray-900">{alumno.nombreCompleto}</td>
                                  <td className="px-6 py-4">{alumno.email}</td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDesmatricularEstudianteManual(alumno.idUsuario)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Desmatricular Alumno"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                );
              }

              if (modalActiveTab === 'matricular') {
                return (
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Search and Sort for Available */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <input
                        type="text"
                        placeholder="Buscar estudiante en el sistema..."
                        value={searchAvailable}
                        onChange={(e) => setSearchAvailable(e.target.value)}
                        className="flex-1 p-2.5 border border-gray-300 hover:border-gray-400 focus:border-[#2c5364] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20 text-gray-900 bg-white shadow-sm transition-all"
                      />
                      <select
                        value={sortAvailable}
                        onChange={(e) => setSortAvailable(e.target.value)}
                        className="p-2.5 border border-gray-300 hover:border-gray-400 focus:border-[#2c5364] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20 text-gray-900 bg-white cursor-pointer shadow-sm transition-all"
                      >
                        <option value="asc">Nombre: A - Z</option>
                        <option value="desc">Nombre: Z - A</option>
                      </select>
                    </div>

                    {/* List of Available */}
                    <div className="flex-1 overflow-y-auto border border-gray-150 rounded-2xl max-h-[35vh]">
                      {(() => {
                        if (alumnosLoading) {
                          return (
                            <div className="flex justify-center items-center h-48">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5364]"></div>
                            </div>
                          );
                        }
                        const availableFiltered = getFilteredAndSortedAvailable();
                        if (availableFiltered.length === 0) {
                          return (
                            <div className="text-center py-12 text-gray-400">
                              <p className="font-semibold text-gray-500">No hay más estudiantes disponibles</p>
                            </div>
                          );
                        }
                        return (
                          <table className="w-full border-collapse text-left text-sm text-gray-500">
                            <thead className="bg-[#0f2027] text-xs font-semibold text-white uppercase tracking-wider border-b border-[#1e3a47] sticky top-0 z-10">
                              <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {availableFiltered.map((est) => (
                                <tr key={est.idUsuario} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4 font-semibold text-gray-900">{est.nombreCompleto}</td>
                                  <td className="px-6 py-4">{est.email}</td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleMatricularDirect(est)}
                                      className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg transition-all text-xs flex items-center gap-1.5 ml-auto shadow-sm cursor-pointer"
                                    >
                                      <UserPlus size={14} />
                                      <span>Matricular</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                );
              }

              /* TAB: AYUDANTES DE CÁTEDRA */
              return (
                <div className="flex flex-col flex-1 min-h-0 space-y-4">
                  {/* Lista de Ayudantes Asignados */}
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase mb-2">Ayudantes Asignados a la Cátedra ({ayudantesMatriculados.length})</h4>
                    {(() => {
                      if (ayudantesLoading) {
                        return (
                          <div className="flex justify-center items-center h-20">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2c5364]"></div>
                          </div>
                        );
                      }
                      if (ayudantesMatriculados.length === 0) {
                        return (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
                            No hay ayudantes de cátedra asignados a este curso por el momento.
                          </div>
                        );
                      }
                      return (
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#0f2027] text-white uppercase text-[10px] font-bold sticky top-0 z-10">
                              <tr>
                                <th className="px-4 py-2.5">Nombre</th>
                                <th className="px-4 py-2.5">Email</th>
                                <th className="px-4 py-2.5 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {ayudantesMatriculados.map((ayu) => (
                                <tr key={ayu.idUsuario} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                                    <span className="p-1 rounded bg-slate-100 text-slate-700"><GraduationCap size={14} /></span>
                                    {ayu.nombreCompleto}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{ayu.email}</td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDesasignarAyudanteDirect(ayu.idUsuario)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                                      title="Remover Ayudante"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Sección: Asignar Nuevo Ayudante */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase">Asignar Nuevo Ayudante de Cátedra</h4>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showAllUsersForTA}
                          onChange={(e) => setShowAllUsersForTA(e.target.checked)}
                          className="rounded text-[#2c5364] focus:ring-[#2c5364]"
                        />
                        <span>Ver todos los usuarios</span>
                      </label>
                    </div>
                    
                    <div className="mb-2">
                      <input
                        type="text"
                        placeholder="Buscar ayudante por nombre o correo..."
                        value={searchAyudante}
                        onChange={(e) => setSearchAyudante(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2c5364]/20"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {(() => {
                        const pool = showAllUsersForTA || ayudantesSistema.length === 0
                          ? estudiantesSistema
                          : ayudantesSistema;

                        const availableForTA = pool
                          .filter((u) => !ayudantesMatriculados.some((a) => a.idUsuario === u.idUsuario))
                          .filter((u) => !searchAyudante.trim() || u.nombreCompleto.toLowerCase().includes(searchAyudante.toLowerCase()) || u.email.toLowerCase().includes(searchAyudante.toLowerCase()));
                        
                        if (availableForTA.length === 0) {
                          return (
                            <div className="p-4 text-center text-slate-400 text-xs font-medium">
                              {showAllUsersForTA
                                ? 'No hay más usuarios disponibles en el sistema.'
                                : 'No hay más usuarios registrados con el rol de Ayudante.'}
                            </div>
                          );
                        }

                        return availableForTA.map((userToAssign) => (
                          <div key={userToAssign.idUsuario} className="p-3 hover:bg-slate-50 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-semibold text-slate-900 block">{userToAssign.nombreCompleto}</span>
                              <span className="text-slate-500 text-[11px]">{userToAssign.email}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAsignarAyudanteDirect(userToAssign)}
                              className="px-3 py-1.5 bg-[#2c5364] hover:bg-[#203a43] text-white font-bold rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <UserCheck size={13} />
                              <span>Asignar Ayudante</span>
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reusable Confirmation Modal */}
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

const getLanguageLogo = (lp) => {
  const lang = lp?.toLowerCase() || '';
  if (lang.includes('javascript') || lang.includes('js')) {
    return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg';
  }
  if (lang.includes('c++') || lang.includes('cpp')) {
    return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg';
  }
  if (lang.includes('java')) {
    return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg';
  }
  if (lang.includes('c#') || lang.includes('csharp')) {
    return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg';
  }
  return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg';
};

const EnrollmentActionButtons = ({ curso, handleDesmatricular, handleInscribir, navigate, isList }) => {
  if (curso.esta_matriculado) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(`/cursos/${curso.idCurso}`)}
          className={isList
            ? "px-3.5 py-1.5 bg-[#2c5364] hover:bg-[#203a43] text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs text-xs cursor-pointer"
            : "px-3 py-1.5 bg-[#2c5364] hover:bg-[#203a43] text-white font-bold rounded-xl flex items-center gap-1 transition-colors shadow-xs text-xs cursor-pointer"
          }
        >
          <BookOpen size={isList ? 14 : 13} />
          <span>Ver Contenido</span>
        </button>
        <button
          type="button"
          onClick={() => handleDesmatricular(curso.idCurso)}
          className={isList
            ? "px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 font-medium rounded-xl transition-colors text-xs cursor-pointer"
            : "px-2 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 font-medium rounded-xl transition-colors text-xs cursor-pointer"
          }
          title="Darse de baja de este curso"
        >
          Baja
        </button>
      </div>
    );
  }

  if (curso.tipo === 'público') {
    return (
      <button
        type="button"
        onClick={() => handleInscribir(curso.idCurso)}
        className={isList
          ? "bg-[#2c5364] hover:bg-[#203a43] text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
          : "bg-[#2c5364] hover:bg-[#203a43] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
        }
      >
        Matricularme
      </button>
    );
  }

  return (
    <span className={isList
      ? "px-3 py-1.5 bg-slate-100 text-slate-400 font-bold rounded-lg text-xs"
      : "px-2.5 py-1 bg-slate-100 text-slate-400 font-bold rounded-lg text-xs"
    }>
      Solo invitación
    </span>
  );
};

const CursoCard = ({
  curso,
  canManage,
  handleOpenAlumnosModal,
  handleOpenEditModal,
  handleDelete,
  handleDesmatricular,
  handleInscribir,
  navigate,
}) => {
  const canViewDetails = canManage || curso.esta_matriculado || curso.tipo === 'público';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs overflow-hidden flex flex-col h-full hover:shadow-md">
      <div className="p-5 flex-1 space-y-4">
        {/* Header con icono y badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img alt={curso.lp || 'Python'} className="w-10 h-10 drop-shadow-xs" src={getLanguageLogo(curso.lp)} />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-extrabold uppercase rounded-md border border-slate-200">
                  {curso.lp}
                </span>
                {curso.categoria && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200">
                    {curso.categoria.nombre}
                  </span>
                )}
              </div>
            </div>
          </div>

          {curso.esta_matriculado && (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-extrabold rounded-lg border border-emerald-200/80 shrink-0">
              ✓ Inscrito
            </span>
          )}
        </div>

        {/* Título y descripción */}
        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-1">
            {canViewDetails ? (
              <button
                type="button"
                data-testid="curso-titulo-link"
                onClick={() => navigate(`/cursos/${curso.idCurso}`)}
                className="text-left font-extrabold text-slate-900 hover:text-[#2c5364] focus:outline-none bg-transparent border-0 p-0 cursor-pointer transition-colors"
              >
                {curso.titulo}
              </button>
            ) : (
              curso.titulo
            )}
          </h3>
          {curso.descripcion && (
            <p className="text-slate-500 text-xs font-medium line-clamp-2 leading-relaxed">{curso.descripcion}</p>
          )}
        </div>
      </div>

      {/* Footer del card */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <User size={13} className="text-slate-400 shrink-0" />
          <span className="truncate max-w-[120px]" title={curso.creador?.nombreCompleto}>
            {curso.creador?.nombreCompleto || 'Docente'}
          </span>
        </div>

        {canManage ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenAlumnosModal(curso)}
              className="p-1.5 text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              title="Ver y Gestionar Alumnos"
            >
              <Users size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleOpenEditModal(curso)}
              className="p-1.5 text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              title="Editar Curso"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(curso.idCurso)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Eliminar Curso"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : (
          <EnrollmentActionButtons
            curso={curso}
            handleDesmatricular={handleDesmatricular}
            handleInscribir={handleInscribir}
            navigate={navigate}
            isList={false}
          />
        )}
      </div>
    </div>
  );
};

const CursoListItem = ({
  curso,
  canManage,
  handleOpenAlumnosModal,
  handleOpenEditModal,
  handleDelete,
  handleDesmatricular,
  handleInscribir,
  navigate
}) => {
  const canViewDetails = canManage || curso.esta_matriculado || curso.tipo === 'público';

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <img alt={curso.lp || 'Python'} className="w-10 h-10 shrink-0 drop-shadow-xs" src={getLanguageLogo(curso.lp)} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
              {canViewDetails ? (
                <button
                  type="button"
                  data-testid="curso-titulo-link"
                  onClick={() => navigate(`/cursos/${curso.idCurso}`)}
                  className="text-left font-extrabold text-slate-900 hover:text-[#2c5364] focus:outline-none bg-transparent border-0 p-0 cursor-pointer transition-colors"
                >
                  {curso.titulo}
                </button>
              ) : (
                curso.titulo
              )}
            </h3>

            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-extrabold uppercase rounded-md border border-slate-200">
              {curso.lp}
            </span>
            {curso.categoria && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200">
                {curso.categoria.nombre}
              </span>
            )}
            {curso.esta_matriculado && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold rounded-md border border-emerald-200">
                ✓ Inscrito
              </span>
            )}
          </div>
          {curso.descripcion && (
            <p className="text-slate-500 text-xs font-medium line-clamp-1">{curso.descripcion}</p>
          )}
          <span className="text-[11px] text-slate-400 font-medium block">
            Profesor: <span className="font-bold text-slate-700">{curso.creador?.nombreCompleto || 'Desconocido'}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        {canManage ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenAlumnosModal(curso)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer text-xs"
              title="Ver y Gestionar Alumnos"
            >
              <Users size={14} />
              <span>Alumnos</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenEditModal(curso)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Editar Curso"
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(curso.idCurso)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Eliminar Curso"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <EnrollmentActionButtons
            curso={curso}
            handleDesmatricular={handleDesmatricular}
            handleInscribir={handleInscribir}
            navigate={navigate}
            isList={true}
          />
        )}
      </div>
    </div>
  );
};

CursoCard.propTypes = {
  curso: PropTypes.shape({
    idCurso: PropTypes.number.isRequired,
    titulo: PropTypes.string.isRequired,
    descripcion: PropTypes.string,
    lp: PropTypes.string.isRequired,
    tipo: PropTypes.string.isRequired,
    esta_matriculado: PropTypes.bool,
    creador: PropTypes.shape({
      nombreCompleto: PropTypes.string,
    }),
  }).isRequired,
  canManage: PropTypes.bool.isRequired,
  handleOpenAlumnosModal: PropTypes.func.isRequired,
  handleOpenEditModal: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired,
  handleDesmatricular: PropTypes.func.isRequired,
  handleInscribir: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
};

CursoListItem.propTypes = CursoCard.propTypes;

export default CursosPage;