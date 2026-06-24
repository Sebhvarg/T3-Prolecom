import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { cursosService } from '../../api/cursosService';
import { BookOpen, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, Users, UserPlus, Filter } from 'lucide-react';

const CursosPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states for Create/Edit Curso
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    lp: '',
    tipo: 'público'
  });

  // Matriculación y Filtros states
  const [activeTab, setActiveTab] = useState('todos'); // 'todos', 'mis_cursos', 'disponibles'
  const [filterLp, setFilterLp] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [lps, setLps] = useState([]);
  
  // Alumnos Modal states
  const [isAlumnosModalOpen, setIsAlumnosModalOpen] = useState(false);
  const [selectedCursoForAlumnos, setSelectedCursoForAlumnos] = useState(null);
  const [alumnosMatriculados, setAlumnosMatriculados] = useState([]);
  const [estudiantesSistema, setEstudiantesSistema] = useState([]);
  const [selectedEstudianteId, setSelectedEstudianteId] = useState('');
  const [alumnosLoading, setAlumnosLoading] = useState(false);

  const canManage = user?.rol === 'Administrador' || user?.rol === 'Profesor';

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterLp) params.lp = filterLp;
      if (filterTipo) params.tipo = filterTipo;
      if (!canManage) {
        if (activeTab === 'mis_cursos') params.filtro = 'mis_cursos';
        else if (activeTab === 'disponibles') params.filtro = 'disponibles';
      }
      const data = await cursosService.getCursos(params);
      setCursos(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los cursos.');
    } finally {
      setLoading(false);
    }
  }, [filterLp, filterTipo, activeTab, canManage]);

  // Cargar todos los lenguajes una vez al inicio
  useEffect(() => {
    const loadAllLps = async () => {
      try {
        const data = await cursosService.getLenguajes();
        setLps(data || []);
      } catch (err) {
        console.error('Error al cargar lenguajes:', err);
      }
    };
    loadAllLps();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCursos();
  }, [fetchCursos]);

  const handleOpenCreateModal = () => {
    setEditingCurso(null);
    setFormData({ titulo: '', descripcion: '', lp: '', tipo: 'público' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (curso) => {
    setEditingCurso(curso);
    setFormData({
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      lp: curso.lp,
      tipo: curso.tipo
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
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
    }
  };

  const handleDelete = async (id) => {
    if (!globalThis.confirm('¿Estás seguro de que deseas eliminar este curso?')) return;
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

  const handleDesmatricular = async (idCurso) => {
    if (!globalThis.confirm('¿Estás seguro de que deseas darte de baja de este curso?')) return;
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
  };

  // Manual enrollment and view students (Professor/Admin)
  const refreshAlumnosList = useCallback(async (cursoId) => {
    setAlumnosLoading(true);
    try {
      const enrolled = await cursosService.getEstudiantesMatriculados(cursoId);
      setAlumnosMatriculados(enrolled);
    } catch (err) {
      console.error(err);
      setError('Error al actualizar la lista de alumnos.');
    } finally {
      setAlumnosLoading(false);
    }
  }, []);

  const handleOpenAlumnosModal = async (curso) => {
    setSelectedCursoForAlumnos(curso);
    setIsAlumnosModalOpen(true);
    setError('');
    setSuccess('');
    setSelectedEstudianteId('');
    
    refreshAlumnosList(curso.idCurso);
    
    try {
      const allStudents = await cursosService.getEstudiantesSistema();
      setEstudiantesSistema(allStudents);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMatricularManual = async (e) => {
    e.preventDefault();
    if (!selectedEstudianteId) return;
    setError('');
    setSuccess('');
    
    const student = estudiantesSistema.find(s => s.idUsuario.toString() === selectedEstudianteId.toString());
    if (!student) return;
    
    try {
      await cursosService.matricularManual(selectedCursoForAlumnos.idCurso, student.email);
      setSuccess(`Estudiante ${student.nombreCompleto} matriculado con éxito.`);
      setSelectedEstudianteId('');
      refreshAlumnosList(selectedCursoForAlumnos.idCurso);
      fetchCursos();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al matricular al estudiante.');
    }
  };

  const handleDesmatricularEstudianteManual = async (idEstudiante) => {
    if (!globalThis.confirm('¿Estás seguro de que deseas desmatricular a este estudiante de este curso?')) return;
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
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No hay cursos disponibles</h3>
          <p className="text-gray-500 mt-1 max-w-sm mx-auto">Actualmente no se han encontrado cursos en la plataforma con estos filtros.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          <p className="text-gray-500 mt-1">Explora, crea o edita la oferta académica de la comunidad</p>
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
              { id: 'todos', label: 'Todos los cursos' },
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
        </div>
      </div>

      {renderCursosList()}

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-zoom-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCurso ? 'Editar Curso' : 'Crear Nuevo Curso'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="titulo" className="text-sm font-semibold text-gray-700">Título del Curso</label>
                <input
                  id="titulo"
                  type="text"
                  required
                  placeholder="Ej. Introducción a Python"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="descripcion" className="text-sm font-semibold text-gray-700">Descripción</label>
                <textarea
                  id="descripcion"
                  required
                  rows={4}
                  placeholder="Detalles sobre lo que aprenderán los estudiantes..."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lp" className="text-sm font-semibold text-gray-700">Lenguaje / LP</label>
                  <select
                    id="lp"
                    required
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 bg-white"
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

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tipo" className="text-sm font-semibold text-gray-700">Tipo de Curso</label>
                  <select
                    id="tipo"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 bg-white"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  >
                    <option value="público">Público</option>
                    <option value="privado">Privado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#2c5364] hover:bg-[#203a43] text-white p-3 rounded-xl font-semibold transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                Alumnos Matriculados
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Curso: <span className="font-semibold text-gray-800">{selectedCursoForAlumnos.titulo}</span>
              </p>
            </div>

            {/* Form to Enroll Student Manually */}
            <form onSubmit={handleMatricularManual} className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <label htmlFor="select-estudiante" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Matricular alumno manualmente</label>
                <select
                  id="select-estudiante"
                  required
                  value={selectedEstudianteId}
                  onChange={(e) => setSelectedEstudianteId(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 bg-white text-sm"
                >
                  <option value="">Selecciona un estudiante...</option>
                  {estudiantesSistema
                    .filter(est => !alumnosMatriculados.some(e => e.idUsuario === est.idUsuario))
                    .map(est => (
                      <option key={est.idUsuario} value={est.idUsuario}>
                        {est.nombreCompleto} ({est.email})
                      </option>
                    ))
                  }
                </select>
              </div>
              <button
                type="submit"
                disabled={!selectedEstudianteId}
                className="w-full sm:w-auto bg-[#2c5364] hover:bg-[#203a43] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-semibold shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 whitespace-nowrap text-sm h-[46px]"
              >
                <UserPlus size={18} />
                <span>Matricular</span>
              </button>
            </form>

            {/* List of Enrolled Students */}
            <div className="flex-1 overflow-y-auto min-h-[200px] border border-gray-100 rounded-2xl">
              {(() => {
                if (alumnosLoading) {
                  return (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5364]"></div>
                    </div>
                  );
                }
                if (alumnosMatriculados.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400">
                      <p className="font-semibold text-gray-500">No hay alumnos matriculados</p>
                      <p className="text-xs mt-1">Utiliza el selector superior para inscribir al primero.</p>
                    </div>
                  );
                }
                return (
                <table className="w-full border-collapse text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-3">Nombre</th>
                      <th scope="col" className="px-6 py-3">Email</th>
                      <th scope="col" className="px-6 py-3">F. Inscripción</th>
                      <th scope="col" className="px-6 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alumnosMatriculados.map((alumno) => (
                      <tr key={alumno.idUsuario} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">{alumno.nombreCompleto}</td>
                        <td className="px-6 py-4">{alumno.email}</td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-400">
                          {alumno.pivot?.fechaInscripcion 
                            ? new Date(alumno.pivot.fechaInscripcion).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Fecha no registrada'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDesmatricularEstudianteManual(alumno.idUsuario)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAlumnosModalOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
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
  navigate
}) => {
  const hasAccess = canManage || curso.esta_matriculado;

  const handleCardClick = (e) => {
    // Evitar navegación si se hace clic en botones, enlaces o elementos interactivos dentro de la card
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    if (hasAccess) {
      navigate(`/cursos/${curso.idCurso}`);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group h-full ${
        hasAccess ? 'cursor-pointer hover:-translate-y-1 transform' : ''
      }`}
    >
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
              {curso.lp}
            </span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
              curso.tipo === 'público' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {curso.tipo}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#2c5364] transition-colors line-clamp-2">
            {curso.titulo}
          </h3>
          
          <p className="text-gray-500 mt-3 text-sm line-clamp-3 leading-relaxed">
            {curso.descripcion}
          </p>
        </div>

        {/* Footer section based on permissions/roles */}
        {canManage ? (
          <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
            <span className="font-medium text-gray-600">
              Profesor: <span className="font-bold text-gray-900">{curso.creador?.nombreCompleto || 'Desconocido'}</span>
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenAlumnosModal(curso)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors"
                title="Ver y Gestionar Alumnos"
              >
                <Users size={14} />
                <span>Alumnos</span>
              </button>
              <button
                onClick={() => handleOpenEditModal(curso)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Editar Curso"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(curso.idCurso)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar Curso"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <span className="font-medium text-gray-600">Profesor:{' '}<span className="font-bold text-gray-900">{curso.creador?.nombreCompleto || 'Desconocido'}</span></span>
            
            {(() => {
              if (curso.esta_matriculado) {
                return (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => navigate(`/cursos/${curso.idCurso}`)}
                      className="px-3 py-1.5 bg-[#2c5364] hover:bg-[#203a43] text-white font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <BookOpen size={14} />
                      Ver contenido
                    </button>
                    <button
                      onClick={() => handleDesmatricular(curso.idCurso)}
                      className="px-3 py-1.5 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-all"
                      title="Darse de baja de este curso"
                    >
                      Darse de baja
                    </button>
                  </div>
                );
              }
              if (curso.tipo === 'público') {
                return (
                  <button
                    onClick={() => handleInscribir(curso.idCurso)}
                    className="w-full sm:w-auto bg-[#2c5364] hover:bg-[#203a43] text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-all hover:shadow-md"
                  >
                    Matricularme
                  </button>
                );
              }
              return (
                <span className="px-3 py-1.5 bg-gray-50 text-gray-400 font-bold rounded-lg">
                  Solo invitación
                </span>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default CursosPage;
