import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Bookmark, BookOpen, Clock, Users } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();

  const cursos = [
    {
      id: 1,
      titulo: 'Fundamentos de Python',
      estudiantes: 40,
      duracion: '12 semanas',
      profesor: 'Dra. María García',
      estado: 'Activo',
      color: 'bg-red-50',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg'
    }
  ];

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
            Cursos disponibles
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {cursos.map(curso => (
              <div key={curso.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex hover:shadow-md transition-all group">
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-3">{curso.titulo}</h4>
                    <div className="space-y-2 text-sm text-gray-500 mb-6">
                      <p className="flex items-center gap-2"><Users size={16} /> {curso.estudiantes} Estudiantes</p>
                      <p className="flex items-center gap-2"><Clock size={16} /> {curso.duracion}</p>
                      <p><strong>Profesor:</strong> {curso.profesor}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full w-fit uppercase tracking-wider">{curso.estado}</span>
                </div>
                <div className="w-40 bg-gray-50 flex flex-col items-center justify-center border-l border-gray-50 gap-4 group-hover:bg-gray-100 transition-colors">
                  <img src={curso.logo} alt={curso.titulo} className="w-16 h-16 drop-shadow-sm" />
                  <div className="text-gray-300 font-mono text-xl font-bold">{'</>'}</div>
                </div>
              </div>
            ))}
          </div>
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
