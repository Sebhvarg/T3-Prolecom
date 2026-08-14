import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { quizzesService } from '../../api/quizzesService';
import { useAuth } from '../../context/AuthContext';
import { 
  X, Clock, AlertCircle, Loader2, 
  HelpCircle, ChevronRight, ChevronLeft, Sparkles, Check, X as XIcon
} from 'lucide-react';

const QuizResolverModal = ({ isOpen, onClose, quizId, onQuizCompleted }) => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState(null);

  const [currentPreguntaIndex, setCurrentPreguntaIndex] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);

  // Estado de Resultado (Intento Calificado)
  const [resultadoIntento, setResultadoIntento] = useState(null);

  const mainContainerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !quizId) return;
    let isMounted = true;

    const loadQuizData = async () => {
      setLoading(true);
      setError('');
      setResultadoIntento(null);
      setRespuestas({});
      setCurrentPreguntaIndex(0);
      setSegundosTranscurridos(0);

      try {
        const data = await quizzesService.getQuiz(quizId);
        if (isMounted) setQuiz(data);
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError(err.response?.data?.message || 'No se pudo cargar la información del cuestionario.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadQuizData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, quizId]);

  useEffect(() => {
    let interval = null;
    if (isOpen && quiz && !resultadoIntento) {
      interval = setInterval(() => {
        setSegundosTranscurridos(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, quiz, resultadoIntento]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    if (resultadoIntento && onQuizCompleted) {
      onQuizCompleted();
    }
    onClose();
  };

  const handleSelectOpcion = (idPregunta, idOpcion) => {
    if (resultadoIntento) return;
    setRespuestas(prev => ({
      ...prev,
      [idPregunta]: idOpcion
    }));
  };

  const handleEnviarQuiz = async () => {
    if (!quiz) return;

    const preguntasSinResponder = quiz.preguntas.filter(p => !respuestas[p.idPreguntaQuiz]);
    if (preguntasSinResponder.length > 0) {
      if (!window.confirm(`Tienes ${preguntasSinResponder.length} pregunta(s) sin responder. ¿Deseas enviar el quiz de todos modos?`)) {
        return;
      }
    }

    setSubmitting(true);
    setError('');

    const formattedRespuestas = quiz.preguntas.map(p => ({
      idPreguntaQuiz: p.idPreguntaQuiz,
      idOpcionSeleccionada: respuestas[p.idPreguntaQuiz] || null
    }));

    try {
      const res = await quizzesService.enviarIntento(quizId, {
        respuestas: formattedRespuestas,
        tiempo_segundos: segundosTranscurridos
      });
      
      setResultadoIntento(res.intento);
      if (res.user && updateUser) {
        updateUser({ xp: res.user.xp });
      }

      setTimeout(() => {
        if (mainContainerRef.current) {
          mainContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al enviar e interactuar con el evaluador.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="fixed top-16 left-0 md:left-64 right-0 bottom-0 bg-slate-50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl border border-slate-200">
          <Loader2 size={40} className="animate-spin text-[#2c5364] mx-auto" />
          <p className="font-extrabold text-slate-900 text-sm">Cargando cuestionario...</p>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const totalPreguntas = quiz.preguntas?.length || 0;
  const preguntaActual = quiz.preguntas?.[currentPreguntaIndex];

  const sinIntentosPermitidos = !resultadoIntento && (quiz.puede_intentar === false || (quiz.intentos_maximos > 0 && (quiz.intentos_realizados ?? quiz.mis_intentos?.length) >= quiz.intentos_maximos));

  return (
    <div className="fixed top-16 left-0 md:left-64 right-0 bottom-0 bg-slate-50 z-40 flex flex-col overflow-hidden animate-fade-in border-l border-slate-200">
      
      {/* Header Superior Principal */}
      <div className="p-5 md:px-8 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#2c5364]/10 text-[#2c5364] rounded-2xl">
            <HelpCircle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{quiz.titulo}</h2>
            <p className="text-xs text-slate-600 font-semibold">
              {quiz.intentos_maximos > 0 
                ? `Límite de Intentos: ${quiz.intentos_realizados ?? quiz.mis_intentos?.length ?? 0} / ${quiz.intentos_maximos}`
                : 'Intentos Ilimitados'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {quiz.limite_tiempo_minutos > 0 && !resultadoIntento && !sinIntentosPermitidos && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 text-xs font-black font-mono">
              <Clock size={16} className="text-[#2c5364]" />
              <span>{formatTiempo(segundosTranscurridos)}</span>
            </div>
          )}

          <button 
            type="button" 
            onClick={handleCloseModal} 
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Notificaciones de Error */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-xs font-bold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ÁREA DE TRABAJO PRINCIPAL */}
      <div ref={mainContainerRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* CASO A: SIN INTENTOS PERMITIDOS */}
          {sinIntentosPermitidos ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5 animate-fade-in">
              <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200 inline-block">
                <AlertCircle size={36} className="mx-auto text-amber-600 mb-2" />
                <h3 className="text-lg font-black text-amber-950">Has alcanzado el límite máximo de intentos</h3>
                <p className="text-xs font-semibold text-amber-800 mt-1">
                  Has realizado {quiz.intentos_realizados ?? quiz.mis_intentos?.length ?? 0} de {quiz.intentos_maximos} intento(s) permitidos para este cuestionario.
                </p>
              </div>

              {quiz.mis_intentos && quiz.mis_intentos.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase">Tus Intentos Previos</h4>
                  {quiz.mis_intentos.map((int, idx) => (
                    <div key={int.idIntentoQuiz || idx} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs font-bold">
                      <span>Intento #{quiz.mis_intentos.length - idx}</span>
                      <span>Nota: {int.puntaje_obtenido} / {int.puntaje_maximo} ({int.porcentaje}%)</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : resultadoIntento ? (
            <div className="space-y-6 animate-fade-in">
              {/* Tarjeta Limpia de Resumen de Calificación */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
                <div className="flex items-center justify-center gap-8 border-b border-slate-100 pb-5">
                  <div className="text-center">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Nota Final</span>
                    <span className="text-4xl md:text-5xl font-black text-[#2c5364]">
                      {resultadoIntento.puntaje_obtenido} <span className="text-2xl text-slate-400">/ {resultadoIntento.puntaje_maximo}</span>
                    </span>
                  </div>

                  <div className="h-12 w-px bg-slate-200" />

                  <div className="text-center">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Porcentaje</span>
                    <span className="text-4xl md:text-5xl font-black text-slate-900">
                      {resultadoIntento.porcentaje}%
                    </span>
                  </div>

                  <div className="h-12 w-px bg-slate-200" />

                  <div className="text-center">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">XP Ganado</span>
                    <span className="text-4xl md:text-5xl font-black text-amber-500 flex items-center justify-center gap-1">
                      <Sparkles size={32} className="fill-amber-400 text-amber-500" />
                      +{resultadoIntento.xp_ganado ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desglose de Preguntas y Explicaciones */}
              {quiz.mostrar_retroalimentacion && resultadoIntento.respuestas && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                    Desglose de Respuestas
                  </h3>

                  {resultadoIntento.respuestas.map((r, idx) => {
                    const pregunta = r.pregunta;
                    if (!pregunta) return null;

                    return (
                      <div 
                        key={r.idRespuestaIntento || idx}
                        className={`p-5 rounded-2xl border space-y-3 ${
                          r.es_correcta
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : 'bg-red-50/50 border-red-300'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className={`p-1.5 rounded-lg text-xs font-black shrink-0 ${
                              r.es_correcta ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              #{idx + 1}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900">{pregunta.enunciado}</h4>
                          </div>

                          <span className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 ${
                            r.es_correcta ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                          }`}>
                            {r.es_correcta ? `+${r.puntaje_ganado} pts` : '0 pts'}
                          </span>
                        </div>

                        {/* Opciones */}
                        <div className="space-y-2 pt-1">
                          {pregunta.opciones?.map(opc => {
                            const esSeleccionada = r.idOpcionSeleccionada === opc.idOpcionQuiz;
                            const esLaCorrecta = Boolean(opc.es_correcta);

                            let badgeStyle = 'bg-white border-slate-200 text-slate-900 font-semibold';
                            if (esLaCorrecta) {
                              badgeStyle = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-black';
                            } else if (esSeleccionada && !esLaCorrecta) {
                              badgeStyle = 'bg-red-100 border-red-400 text-red-950 font-bold line-through';
                            }

                            return (
                              <div key={opc.idOpcionQuiz} className={`p-3 rounded-xl border text-xs flex items-center justify-between ${badgeStyle}`}>
                                <span>{opc.texto_opcion}</span>
                                <div className="flex items-center gap-2">
                                  {esSeleccionada && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-200 text-slate-900">
                                      Tu Respuesta
                                    </span>
                                  )}
                                  {esLaCorrecta && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                                      <Check size={12} /> Correcta
                                    </span>
                                  )}
                                  {esSeleccionada && !esLaCorrecta && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-red-600 text-white">
                                      <XIcon size={12} /> Incorrecta
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Retroalimentación del Profesor */}
                        {pregunta.explicacion && (
                          <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium leading-relaxed">
                            <span className="font-extrabold text-[#2c5364] block mb-0.5">💡 Retroalimentación:</span>
                            {pregunta.explicacion}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-8 py-3 rounded-xl font-extrabold bg-[#2c5364] hover:bg-[#203a43] text-white text-sm shadow-md transition-colors cursor-pointer"
                >
                  Finalizar y Cerrar
                </button>
              </div>
            </div>
          ) : (

            /* CASO B: RESOLVIENDO EL QUIZ */
            <div className="space-y-6">
              {/* Barra de Avance */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-xs font-black text-slate-700">
                  <span>Pregunta {currentPreguntaIndex + 1} de {totalPreguntas}</span>
                  <span>{Math.round(((currentPreguntaIndex + 1) / totalPreguntas) * 100)}% Avance</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="bg-[#2c5364] h-full transition-all duration-300"
                    style={{ width: `${((currentPreguntaIndex + 1) / totalPreguntas) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tarjeta de Pregunta */}
              {preguntaActual && (
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-4">
                    <h3 className="text-base md:text-lg font-black text-slate-900 leading-snug">
                      {preguntaActual.enunciado}
                    </h3>
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-[#2c5364] border border-slate-200 text-xs font-black shrink-0">
                      {preguntaActual.puntos} {preguntaActual.puntos === 1 ? 'punto' : 'puntos'}
                    </span>
                  </div>

                  {/* Opciones de Respuesta */}
                  <div className="space-y-3">
                    {preguntaActual.opciones?.map((opc) => {
                      const isSelected = respuestas[preguntaActual.idPreguntaQuiz] === opc.idOpcionQuiz;
                      return (
                        <button
                          key={opc.idOpcionQuiz}
                          type="button"
                          onClick={() => handleSelectOpcion(preguntaActual.idPreguntaQuiz, opc.idOpcionQuiz)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                            isSelected 
                              ? 'bg-[#2c5364]/10 border-[#2c5364] text-slate-900 font-extrabold shadow-sm ring-2 ring-[#2c5364]/30' 
                              : 'bg-white border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 hover:border-slate-400'
                          }`}
                        >
                          <span className="text-sm">{opc.texto_opcion}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#2c5364] border-[#2c5364] text-white' : 'border-slate-400'
                          }`}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navegación */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  disabled={currentPreguntaIndex === 0}
                  onClick={() => setCurrentPreguntaIndex(prev => prev - 1)}
                  className="px-5 py-2.5 rounded-xl font-extrabold bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>

                {currentPreguntaIndex < totalPreguntas - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentPreguntaIndex(prev => prev + 1)}
                    className="px-6 py-2.5 rounded-xl font-extrabold bg-[#2c5364] hover:bg-[#203a43] text-white text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleEnviarQuiz}
                    className="px-6 py-2.5 rounded-xl font-extrabold bg-[#2c5364] hover:bg-[#203a43] text-white text-xs flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>Finalizar y Entregar</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

QuizResolverModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  quizId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onQuizCompleted: PropTypes.func,
};

export default QuizResolverModal;
