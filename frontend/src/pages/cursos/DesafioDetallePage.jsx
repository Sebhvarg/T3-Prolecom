import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useAuth } from '../../context/AuthContext';
import { desafiosService } from '../../api/desafiosService';
import { cursosService } from '../../api/cursosService';
import { 
  ArrowLeft, Code, Play, CheckCircle2, AlertCircle, Loader2, Sparkles, Terminal, ShieldAlert 
} from 'lucide-react';

const DesafioDetallePage = () => {
  const { id: idCurso, idDesafio } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [desafio, setDesafio] = useState(null);
  const [lenguajes, setLenguajes] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  
  // Resultado de la evaluación
  const [resultado, setResultado] = useState(null);
  const pollIntervalRef = useRef(null);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [desafioData, lenguajesData] = await Promise.all([
          desafiosService.getDesafio(idDesafio),
          cursosService.getLenguajes()
        ]);
        
        setDesafio(desafioData);
        setLenguajes(lenguajesData);

        // Seleccionar por defecto el lenguaje del desafío
        if (lenguajesData.length > 0) {
          const matched = lenguajesData.find(l => l.nombre.toLowerCase().includes(desafioData.lp?.toLowerCase() || 'python')) 
                          || lenguajesData[0];
          setSelectedLanguage(matched);
          setCode(desafioData.starter_code || matched.starter_code || '# Escribe tu código aquí\n');
        }
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la información del desafío.');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Limpiar intervalo al desmontar
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [idDesafio]);

  const handleLanguageChange = (langId) => {
    const selected = lenguajes.find(l => l.idLenguaje === Number.parseInt(langId, 10));
    setSelectedLanguage(selected);
    // Cambiar código base si el usuario no ha editado mucho o si es el starter_code
    if (desafio?.starter_code) {
      setCode(desafio.starter_code);
    } else {
      setCode(selected.slug === 'python' ? '# Escribe tu código aquí\n' : '// Escribe tu código aquí\n');
    }
  };

  const startPolling = (idSolucion) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    let attemptsCount = 0;
    pollIntervalRef.current = setInterval(async () => {
      attemptsCount++;
      try {
        const intentos = await desafiosService.getIntentos(idDesafio);
        const latest = intentos.find(i => i.idSolucion === idSolucion || i.idSolucion === Number.parseInt(idSolucion, 10));
        
        if (latest && latest.estado !== 'pendiente') {
          clearInterval(pollIntervalRef.current);
          setEvaluating(false);
          setResultado(latest);
        }
      } catch (err) {
        console.error('Error al consultar estado:', err);
      }

      // Evitar bucles infinitos en caso de problemas con las colas
      if (attemptsCount > 30) {
        clearInterval(pollIntervalRef.current);
        setEvaluating(false);
        setError('La evaluación tardó demasiado. Por favor, revisa tus intentos más tarde.');
      }
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!selectedLanguage) return;
    
    setError('');
    setResultado(null);
    setEvaluating(true);

    try {
      const response = await desafiosService.enviarSolucion(idDesafio, code, selectedLanguage.idLenguaje);
      const idSolucion = response.solucion?.idSolucion;
      
      if (idSolucion) {
        startPolling(idSolucion);
      } else {
        throw new Error('No se recibió la confirmación del intento.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al enviar la solución.');
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <DashboardContainer title="Cargando Desafío" user={user}>
        <div className="flex flex-col justify-center items-center h-96 gap-4">
          <Loader2 className="animate-spin h-12 w-12 text-[#2c5364]" />
          <p className="text-gray-500 font-semibold">Cargando el entorno de programación...</p>
        </div>
      </DashboardContainer>
    );
  }

  if (error && !desafio) {
    return (
      <DashboardContainer title="Error" user={user}>
        <div className="text-center py-16">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Ocurrió un error</h3>
          <p className="text-gray-500 mt-2">{error}</p>
          <button
            onClick={() => navigate(`/cursos/${idCurso}`)}
            className="mt-6 inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white px-5 py-2.5 rounded-xl font-semibold shadow"
          >
            <ArrowLeft size={18} />
            <span>Volver al Curso</span>
          </button>
        </div>
      </DashboardContainer>
    );
  }

  // Obtener un caso de prueba para mostrar en la interfaz como ejemplo (el primero público)
  const ejemploPrueba = desafio?.testCases?.find(tc => !tc.is_hidden) || { input: 'N/A', expected_output: 'N/A' };

  const getDificultadBadgeClass = (dificultad) => {
    if (dificultad === 'Easy') return 'bg-green-100 text-green-700 border border-green-200';
    if (dificultad === 'Medium') return 'bg-amber-100 text-amber-700 border border-amber-200';
    return 'bg-red-100 text-red-700 border border-red-200';
  };

  return (
    <DashboardContainer title={`Desafío: ${desafio?.titulo}`} user={user}>
      {/* Botón Volver */}
      <button
        onClick={() => navigate(`/cursos/${idCurso}`)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-semibold"
      >
        <ArrowLeft size={18} />
        <span>Volver a Desafíos</span>
      </button>

      {/* Tarjeta del Reto */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                {desafio?.titulo}
              </h1>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {desafio?.puntos || 10} pts
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${getDificultadBadgeClass(desafio?.dificultad)}`}>
                {desafio?.dificultad}
              </span>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              {desafio?.descripcionProblema}
            </p>
          </div>
        </div>

        {/* Ejemplos de Entrada y Salida */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <h4 className="font-bold text-gray-700 text-sm mb-2 uppercase tracking-wide">Ejemplo de Entrada</h4>
            <pre className="bg-white border border-gray-200 rounded-xl p-3 text-xs font-mono text-gray-800 overflow-x-auto min-h-[50px]">
              {ejemploPrueba.input || 'Sin entrada'}
            </pre>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <h4 className="font-bold text-gray-700 text-sm mb-2 uppercase tracking-wide">Ejemplo de Salida</h4>
            <pre className="bg-white border border-gray-200 rounded-xl p-3 text-xs font-mono text-gray-800 overflow-x-auto min-h-[50px]">
              {ejemploPrueba.expected_output || ejemploPrueba.output || 'Sin salida'}
            </pre>
          </div>
        </div>

        {/* Panel del Editor de Código */}
        <div className="mt-8 border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
          {/* Header del Editor */}
          <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex flex-wrap justify-between items-center gap-3 select-none">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-[#2c5364]" />
              <span className="font-bold text-gray-700 text-sm">Editor de Código</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="language-select" className="text-xs font-bold text-gray-500 uppercase">Lenguaje:</label>
              <select
                id="language-select"
                value={selectedLanguage?.idLenguaje || ''}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-[#2c5364]"
              >
                {lenguajes.map(lang => (
                  <option key={lang.idLenguaje} value={lang.idLenguaje}>
                    {lang.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Área del Editor (Monaco Editor) */}
          <div className="h-96 w-full">
            <Editor
              height="100%"
              language={selectedLanguage?.nombre?.toLowerCase().includes('javascript') ? 'javascript' : 'python'}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-light"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: evaluating,
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleSubmit()}
            disabled={evaluating || !selectedLanguage}
            className="flex items-center gap-2 bg-[#0f2027] hover:bg-[#203a43] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed select-none"
          >
            {evaluating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            <span>Ejecutar Código</span>
          </button>
        </div>

        {/* Panel de Resultados */}
        {(evaluating || resultado || error) && (
          <div className="mt-8 border border-gray-100 rounded-3xl p-5 md:p-6 bg-gray-50/50">
            <h3 className="font-extrabold text-gray-800 text-base mb-4 flex items-center gap-2">
              <Terminal size={18} className="text-gray-500" />
              <span>Consola de Salida</span>
            </h3>

            {evaluating && (
              <div className="flex items-center gap-3 text-gray-600 font-semibold text-sm">
                <Loader2 size={20} className="animate-spin text-[#2c5364]" />
                <span>Ejecutando en el sandbox remoto... Evaluando casos de prueba públicos y ocultos...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{error}</div>
              </div>
            )}

            {resultado && (
              <div className="space-y-4">
                {/* Cabecera del Veredicto */}
                <div className="flex items-center gap-3.5">
                  {resultado.estado === 'aprobado' ? (
                    <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
                      <CheckCircle2 size={28} />
                    </div>
                  ) : (
                    <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
                      <ShieldAlert size={28} />
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-lg leading-tight">
                      {resultado.estado === 'aprobado' ? '¡Desafío Aprobado!' : 'Desafío Rechazado'}
                    </h4>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-0.5">
                      Casos superados: {resultado.casos_pasados} / {resultado.casos_totales}
                    </p>
                  </div>
                </div>

                {/* Detalles del resultado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-gray-600 bg-white border border-gray-100 rounded-2xl p-4">
                  <div>
                    Tiempo de ejecución: <span className="font-extrabold text-gray-900">{resultado.tiempo_ejecucion_ms ?? 0} ms</span>
                  </div>
                  <div>
                    Memoria consumida: <span className="font-extrabold text-gray-900">{resultado.memoria_ejecucion_kb ?? 0} KB</span>
                  </div>
                  {resultado.estado === 'aprobado' && (
                    <div className="md:col-span-2 text-green-600 flex items-center gap-1.5 mt-2 font-bold">
                      <Sparkles size={14} />
                      <span>Has ganado +{desafio?.puntos || 10} puntos de XP en tu perfil global.</span>
                    </div>
                  )}
                </div>

                {/* Stderr en caso de errores */}
                {resultado.stderr && (
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4">
                    <h5 className="font-bold text-red-700 text-xs mb-2 uppercase">Log de Errores:</h5>
                    <pre className="text-red-600 text-xs font-mono whitespace-pre-wrap font-medium">
                      {resultado.stderr}
                    </pre>
                  </div>
                )}

                {/* Stdout del código */}
                {resultado.stdout && (
                  <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4">
                    <h5 className="font-bold text-gray-700 text-xs mb-2 uppercase">Salida Estándar (Stdout):</h5>
                    <pre className="text-gray-800 text-xs font-mono whitespace-pre-wrap font-medium">
                      {resultado.stdout}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardContainer>
  );
};

export default DesafioDetallePage;
