import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { cursosService } from '../../api/cursosService';
import { MessageSquare, Bookmark, BookOpen, Clock, Users } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyCursos = async () => {
      setLoading(true);
      try {
        const data = await cursosService.getCursos({ filtro: 'mis_cursos' });
        setCursos(data || []);
      } catch (err) {
        console.error('Error al cargar mis cursos:', err);
        setError('No se pudieron cargar tus cursos.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyCursos();
  }, []);

  const getLanguageLogo = (lp) => {
    const lang = lp?.toLowerCase() || '';
    if (lang.includes('python')) {
      return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg';
    }
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
    return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chrome/chrome-original.svg';
  };

  const actividades = [
    {
      id: 1,
      tipo: 'Foro',
      titulo: 'Respondieron tu pregunta',
      curso: 'Fundamentos de Python',
      fecha: '4 de noviembre del 2025',
      icon: <MessageSquare size={20} className="text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      id: 2,
      tipo: 'Desafío',
      titulo: 'Nuevo desafío disponible: "Funciones"',
      curso: 'Fundamentos de Python',
      fecha: '4 de noviembre del 2025',
      icon: <Bookmark size={20} className="text-orange-600" />,
      color: 'bg-orange-100'
    }
  ];

  return (
    <DashboardContainer title="Pagina Principal" user={user}>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">¡Bienvenido, {user?.nombreCompleto || user?.usuario || 'Estudiante'}!</h2>
        
        <section className="mb-10">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BookOpen size={20} />
            Mis Cursos
          </h3>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5364]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          ) : cursos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xs text-center flex flex-col items-center justify-center">
              <BookOpen size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium mb-4">Aún no estás inscrito en ningún curso.</p>
              <button
                onClick={() => navigate('/cursos')}
                className="bg-[#2c5364] hover:bg-[#203a43] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs"
              >
                Explorar Cursos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cursos.map(curso => (
                <div
                  key={curso.idCurso}
                  onClick={() => navigate(`/cursos/${curso.idCurso}`)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex hover:shadow-md transition-all group cursor-pointer hover:-translate-y-0.5 transform duration-200"
                >
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#2c5364] transition-colors">{curso.titulo}</h4>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">{curso.descripcion}</p>
                      <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                        <p className="font-semibold text-gray-700">Profesor: <span className="font-bold text-gray-900">{curso.creador?.nombreCompleto || 'Desconocido'}</span></p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full w-fit uppercase tracking-wider">{curso.tipo}</span>
                  </div>
                  <div className="w-32 bg-gray-50 flex flex-col items-center justify-center border-l border-gray-50 gap-2 group-hover:bg-gray-100 transition-colors">
                    <img src={getLanguageLogo(curso.lp)} alt={curso.lp} className="w-12 h-12 drop-shadow-xs" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{curso.lp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={20} />
            Actividades Por Hacer
          </h3>
          <div className="space-y-4">
            {actividades.map(act => (
              <div key={act.id} className="bg-white rounded-lg border border-gray-100 shadow-sm flex overflow-hidden hover:border-gray-200 transition-colors">
                <div className={`w-1.5 ${act.color}`}></div>
                <div className="flex-1 p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-gray-800"><strong>{act.tipo}:</strong> {act.titulo}</p>
                    <p className="text-sm text-gray-500 font-medium">{act.curso}</p>
                    <p className="text-xs text-gray-400 italic">{act.fecha}</p>
                  </div>
                  <div className={`p-3 rounded-full ${act.color} bg-opacity-50`}>
                    {act.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardContainer>
  );
};

export default StudentDashboard;
