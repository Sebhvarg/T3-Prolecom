import { useState, useEffect, useCallback } from 'react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { cursosService } from '../../api/cursosService';
import { BookOpen, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';

const CursosPage = () => {
  const { user } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    lp: '',
    tipo: 'público'
  });

  const canManage = user?.rol === 'Administrador' || user?.rol === 'Profesor';

  const fetchCursos = useCallback(async () => {
    try {
      const data = await cursosService.getCursos();
      setCursos(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los cursos.');
    } finally {
      setLoading(false);
    }
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
    if (!window.confirm('¿Estás seguro de que deseas eliminar este curso?')) return;
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c5364]"></div>
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No hay cursos disponibles</h3>
          <p className="text-gray-500 mt-1 max-w-sm mx-auto">Actualmente no se han creado cursos en la plataforma. ¡Comienza creando el primero!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cursos.map((curso) => (
            <div key={curso.idCurso} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group h-full">
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

                <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                  <span className="font-medium text-gray-600">
                    Profesor: <span className="font-bold text-gray-900">{curso.creador?.nombreCompleto || 'Desconocido'}</span>
                  </span>
                  
                  {canManage && (
                    <div className="flex gap-2">
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
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                <label className="text-sm font-semibold text-gray-700">Título del Curso</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Introducción a Python"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Descripción</label>
                <textarea
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
                  <label className="text-sm font-semibold text-gray-700">Lenguaje / LP</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Python, JS"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800"
                    value={formData.lp}
                    onChange={(e) => setFormData({ ...formData, lp: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Tipo de Curso</label>
                  <select
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
    </DashboardContainer>
  );
};

export default CursosPage;
