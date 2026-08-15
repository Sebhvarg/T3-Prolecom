import { useState, useEffect } from 'react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { adminService } from '../../api/adminService';
import ModalVisorReportePDF from '../../components/reportes/ModalVisorReportePDF';
import { downloadCsvReport } from '../../utils/downloadCsvReport';
import SearchableSelect from '../../components/common/SearchableSelect';
import { FileText, Filter, BookOpen, Users, GraduationCap, Printer, FileSpreadsheet } from 'lucide-react';

const ReportesPage = () => {
  const { user } = useAuth();

  const [tipoReporte, setTipoReporte] = useState('cursos'); // 'cursos' | 'estudiantes' | 'ayudantes'
  const [cursosList, setCursosList] = useState([]);
  const [estudiantesList, setEstudiantesList] = useState([]);
  const [profesoresList, setProfesoresList] = useState([]);
  const [ayudantesList, setAyudantesList] = useState([]);

  // Filtros seleccionados con Combobox Búsqueda Integrada
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [selectedProfesorId, setSelectedProfesorId] = useState('');
  const [selectedEstudianteId, setSelectedEstudianteId] = useState('');
  const [selectedAyudanteId, setSelectedAyudanteId] = useState('');

  // Estado del reporte generado
  const [reporteData, setReporteData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [tituloReporte, setTituloReporte] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Cargar listas de opciones para los desplegables desde la BD
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [cursosRes, usersRes, ayudantesRes] = await Promise.all([
          authService.apiFetch('/cursos').catch(() => ({ data: [] })),
          adminService.getUsers().catch(() => ({ users: [] })),
          authService.apiFetch('/reportes/ayudantes').catch(() => ({ data: [] })),
        ]);

        const rawCursos = Array.isArray(cursosRes) ? cursosRes : (cursosRes?.data || []);
        setCursosList(rawCursos);

        const allUsers = usersRes?.users || [];
        const profes = allUsers.filter(u => u.roles?.some(r => ['Profesor', 'profesor'].includes(r.rol)) || u.rol === 'Profesor');
        const ests = allUsers.filter(u => u.roles?.some(r => ['Estudiante', 'estudiante'].includes(r.rol)) || u.rol === 'Estudiante');

        const rawAyudantes = Array.isArray(ayudantesRes?.data) ? ayudantesRes.data : [];
        const fallbackAyudantes = allUsers.filter(u => u.roles?.some(r => ['Ayudante', 'ayudante'].includes(r.rol)) || u.rol === 'Ayudante');
        
        const finalAyudantes = rawAyudantes.length > 0 ? rawAyudantes : fallbackAyudantes;

        setProfesoresList(profes);
        setEstudiantesList(ests);
        setAyudantesList(finalAyudantes);
      } catch (err) {
        console.error('Error cargando listas de filtros para reportes:', err);
      }
    };

    fetchOptions();
  }, []);

const processCursosReport = (rawData, { selectedCursoId, selectedProfesorId, cursosList, profesoresList }) => {
  let filtered = [...rawData];
  let criterio = 'Todos los registros';

  if (selectedCursoId) {
    const selectedC = cursosList.find(c => String(c.idCurso) === String(selectedCursoId));
    filtered = filtered.filter(c => String(c.idCurso) === String(selectedCursoId));
    criterio = `Curso: ${selectedC ? selectedC.titulo : selectedCursoId}`;
  }

  if (selectedProfesorId) {
    const selectedP = profesoresList.find(p => String(p.idUsuario) === String(selectedProfesorId));
    const profeNombre = selectedP ? selectedP.nombreCompleto : selectedProfesorId;
    filtered = filtered.filter(c => c.profesor?.toLowerCase().includes((selectedP?.nombreCompleto || '').toLowerCase()));
    
    if (selectedCursoId) {
      criterio += ` | Profesor: ${profeNombre}`;
    } else {
      criterio = `Profesor: ${profeNombre}`;
    }
  }

  return {
    titulo: 'Reporte Oficial de Cursos',
    cols: ['ID', 'Título del Curso', 'Lenguaje', 'Tipo', 'Profesor Creador', 'Alumnos', 'Desafíos', 'Quizzes', 'Ayudantes', 'Fecha'],
    criterio,
    filteredData: filtered,
  };
};

const processEstudiantesReport = (rawData, { selectedEstudianteId, estudiantesList }) => {
  let filtered = [...rawData];
  let criterio = 'Todos los registros';

  if (selectedEstudianteId) {
    const selectedE = estudiantesList.find(e => String(e.idUsuario) === String(selectedEstudianteId));
    filtered = filtered.filter(e => String(e.idUsuario) === String(selectedEstudianteId));
    criterio = `Alumno: ${selectedE ? selectedE.nombreCompleto : selectedEstudianteId}`;
  }

  return {
    titulo: 'Reporte de Estudiantes y Desempeño Académico',
    cols: ['ID', 'Nombre Completo', 'Usuario', 'Email', 'XP', 'Cursos Inscritos', 'Desafíos Aprobados', 'Quizzes', 'Estado', 'Fecha Registro'],
    criterio,
    filteredData: filtered,
  };
};

const processAyudantesReport = (rawData, { selectedAyudanteId, ayudantesList }) => {
  let filtered = [...rawData];
  let criterio = 'Todos los registros';

  if (selectedAyudanteId) {
    const selectedA = ayudantesList.find(a => String(a.idUsuario) === String(selectedAyudanteId));
    filtered = filtered.filter(a => String(a.idUsuario) === String(selectedAyudanteId));
    criterio = `Ayudante: ${selectedA ? selectedA.nombreCompleto : selectedAyudanteId}`;
  }

  return {
    titulo: 'Reporte de Ayudantes de Cátedra y Mentorías',
    cols: ['ID Ayudante', 'Nombre Completo', 'Usuario', 'Email', 'Cant. Cursos', 'Lista de Cursos', 'Respuestas Validadas', 'Aportes Foro', 'Fecha Registro'],
    criterio,
    filteredData: filtered,
  };
};

  const handleGenerarReporte = async () => {
    setLoading(true);
    try {
      const response = await authService.apiFetch(`/reportes/${tipoReporte}`);
      const rawData = response?.data || [];

      let reportResult = { titulo: '', cols: [], criterio: 'Todos los registros', filteredData: rawData };

      if (tipoReporte === 'cursos') {
        reportResult = processCursosReport(rawData, { selectedCursoId, selectedProfesorId, cursosList, profesoresList });
      } else if (tipoReporte === 'estudiantes') {
        reportResult = processEstudiantesReport(rawData, { selectedEstudianteId, estudiantesList });
      } else if (tipoReporte === 'ayudantes') {
        reportResult = processAyudantesReport(rawData, { selectedAyudanteId, ayudantesList });
      }

      setHeaders(reportResult.cols);
      setReporteData(reportResult.filteredData);
      setTituloReporte(reportResult.titulo);
      setFiltroTexto(reportResult.criterio);
      setIsPdfModalOpen(true);
    } catch (error) {
      console.error('Error generando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  // Descargar CSV directo
  const handleExportCsv = async () => {
    try {
      await downloadCsvReport(tipoReporte);
    } catch (error) {
      console.error('Error descargando CSV:', error);
    }
  };

  return (
    <DashboardContainer title="Centro de Reportes Académicos & Exportaciones" user={user}>
      <div className="space-y-6">
        {/* Banner Encabezado Sobrio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80 shrink-0">
              <FileText size={26} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Generador de Reportes en PDF & Excel
              </h1>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Genera, visualiza e imprime reportes oficiales certificados por la base de datos de Prolecom.
              </p>
            </div>
          </div>
        </div>

        {/* Panel de Selección de Tipo de Reporte */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Filter size={16} className="text-slate-700" /> 1. Selecciona el Tipo de Reporte
            </h2>
            <p className="text-xs text-slate-500 font-normal">Elige la entidad académica sobre la cual deseas generar el documento PDF.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => {
                setTipoReporte('cursos');
                setSelectedEstudianteId('');
                setSelectedAyudanteId('');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                tipoReporte === 'cursos'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${tipoReporte === 'cursos' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <BookOpen size={20} />
              </div>
              <div>
                <span className="block text-xs font-bold">Reporte de Cursos</span>
                <span className={`text-[11px] block mt-0.5 ${tipoReporte === 'cursos' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Avance, desafíos, quizzes y profesores.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoReporte('estudiantes');
                setSelectedCursoId('');
                setSelectedProfesorId('');
                setSelectedAyudanteId('');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                tipoReporte === 'estudiantes'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${tipoReporte === 'estudiantes' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <Users size={20} />
              </div>
              <div>
                <span className="block text-xs font-bold">Reporte de Estudiantes</span>
                <span className={`text-[11px] block mt-0.5 ${tipoReporte === 'estudiantes' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Rendimiento, XP acumulado y estado.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoReporte('ayudantes');
                setSelectedCursoId('');
                setSelectedProfesorId('');
                setSelectedEstudianteId('');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                tipoReporte === 'ayudantes'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${tipoReporte === 'ayudantes' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <GraduationCap size={20} />
              </div>
              <div>
                <span className="block text-xs font-bold">Reporte de Ayudantes</span>
                <span className={`text-[11px] block mt-0.5 ${tipoReporte === 'ayudantes' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Cátedras asignadas y mentorías.
                </span>
              </div>
            </button>
          </div>

          {/* 2. Filtros Específicos por Combobox Desplegables con Búsqueda Integrada */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Filter size={16} className="text-slate-700" /> 2. Filtrar por Curso, Profesor, Alumno o Ayudante Específico
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtros para Cursos */}
              {tipoReporte === 'cursos' && (
                <>
                  <SearchableSelect
                    label="Seleccionar Curso Específico:"
                    placeholder="-- Todos los Cursos --"
                    value={selectedCursoId}
                    onChange={setSelectedCursoId}
                    options={cursosList.map(c => ({ value: c.idCurso, label: c.titulo }))}
                  />

                  <SearchableSelect
                    label="Seleccionar Profesor Creador:"
                    placeholder="-- Todos los Profesores --"
                    value={selectedProfesorId}
                    onChange={setSelectedProfesorId}
                    options={profesoresList.map(p => ({ value: p.idUsuario, label: `${p.nombreCompleto} (${p.email})` }))}
                  />
                </>
              )}

              {/* Filtro para Estudiantes */}
              {tipoReporte === 'estudiantes' && (
                <SearchableSelect
                  label="Seleccionar Estudiante Específico:"
                  placeholder="-- Todos los Estudiantes --"
                  value={selectedEstudianteId}
                  onChange={setSelectedEstudianteId}
                  options={estudiantesList.map(e => ({ value: e.idUsuario, label: `${e.nombreCompleto} (@${e.usuario || 'estudiante'}) - ${e.email}` }))}
                />
              )}

              {/* Filtro para Ayudantes */}
              {tipoReporte === 'ayudantes' && (
                <SearchableSelect
                  label="Seleccionar Ayudante Específico:"
                  placeholder="-- Todos los Ayudantes --"
                  value={selectedAyudanteId}
                  onChange={setSelectedAyudanteId}
                  options={ayudantesList.map(a => ({ value: a.idUsuario, label: `${a.nombreCompleto} (${a.email})` }))}
                />
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-200/80 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet size={16} />
              <span>Descargar CSV / Excel</span>
            </button>

            <button
              type="button"
              onClick={handleGenerarReporte}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-2xs"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Printer size={16} />
              )}
              <span>Generar e Inspeccionar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Visor de Reporte PDF */}
      <ModalVisorReportePDF
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        tituloReporte={tituloReporte}
        filtroSeleccionado={filtroTexto}
        data={reporteData}
        headers={headers}
        onExportCsv={handleExportCsv}
      />
    </DashboardContainer>
  );
};

export default ReportesPage;
