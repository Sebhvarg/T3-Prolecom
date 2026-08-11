import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { quizzesService } from '../../api/quizzesService';
import QuizFormModal from './QuizFormModal';
import QuizResolverModal from './QuizResolverModal';
import { 
  HelpCircle, Plus, Play, CheckCircle2, Clock, 
  Trash2, Pencil, AlertCircle, Loader2, Award, Users, BookOpen, Check, RotateCcw
} from 'lucide-react';

const QuizSeccion = ({ idCurso, user, temas, onQuizCompleted }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState(null);

  const [isResolverModalOpen, setIsResolverModalOpen] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState(null);

  const canManage = user?.rol === 'Administrador' || user?.rol === 'Profesor';

  const reloadQuizzes = () => {
    setReloadKey(k => k + 1);
    if (onQuizCompleted) onQuizCompleted();
  };

  useEffect(() => {
    let isMounted = true;

    const loadQuizzesData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await quizzesService.getQuizzesByCurso(idCurso);
        if (isMounted) setQuizzes(data || []);
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('No se pudieron cargar los cuestionarios del curso.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadQuizzesData();

    return () => {
      isMounted = false;
    };
  }, [idCurso, reloadKey]);

  const handleOpenCreateModal = () => {
    setQuizToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = async (quiz, e) => {
    if (e) e.stopPropagation();
    try {
      const fullQuiz = await quizzesService.getQuiz(quiz.idQuiz);
      setQuizToEdit(fullQuiz);
      setIsFormModalOpen(true);
    } catch {
      setQuizToEdit(quiz);
      setIsFormModalOpen(true);
    }
  };

  const handleDeleteQuiz = async (quizId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar este cuestionario? Se eliminarán todas las preguntas e intentos.')) return;
    try {
      await quizzesService.deleteQuiz(quizId);
      setSuccess('Cuestionario eliminado exitosamente.');
      reloadQuizzes();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el cuestionario.');
    }
  };

  const handleReiniciarIntentosProfesor = async (quizId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('¿Deseas reiniciar todos los intentos de este quiz para permitir que los estudiantes lo vuelvan a realizar?')) return;
    try {
      await quizzesService.reiniciarIntentos(quizId);
      setSuccess('Intentos del cuestionario reiniciados exitosamente.');
      reloadQuizzes();
    } catch (err) {
      console.error(err);
      setError('Error al reiniciar los intentos.');
    }
  };

  const handleStartResolver = (quiz) => {
    if (quiz.intentos_maximos > 0 && quiz.intentos_realizados >= quiz.intentos_maximos) {
      alert('Has agotado el límite de intentos permitidos para este cuestionario.');
      return;
    }
    setActiveQuizId(quiz.idQuiz);
    setIsResolverModalOpen(true);
  };

  if (loading && quizzes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-[#2c5364]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Sección */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cuestionarios y Evaluaciones</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Responde evaluaciones con autocalificación e indicaciones inmediatas
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white px-4 py-2.5 rounded-xl font-bold shadow-sm transition-all hover:shadow-md cursor-pointer text-xs"
          >
            <Plus size={18} />
            <span>Nuevo Cuestionario</span>
          </button>
        )}
      </div>

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

      {/* Lista de Quizzes */}
      {quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <HelpCircle className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-extrabold text-slate-900">No hay cuestionarios disponibles</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto font-medium">Este curso aún no tiene quizzes asignados por el profesor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {quizzes.map((quiz) => {
            const ultimoIntento = quiz.ultimo_intento;
            const haCompletado = Boolean(ultimoIntento);
            const intentosMaximos = quiz.intentos_maximos || 0;
            const intentosRealizados = quiz.intentos_realizados || (haCompletado ? 1 : 0);
            const sinIntentos = intentosMaximos > 0 && intentosRealizados >= intentosMaximos;

            const getButtonClassName = () => {
              if (sinIntentos) return 'bg-slate-200 text-slate-500 cursor-not-allowed';
              if (haCompletado) return 'bg-slate-200 hover:bg-slate-300 text-slate-900';
              return 'bg-[#2c5364] hover:bg-[#203a43] text-white';
            };

            const getButtonLabel = () => {
              if (sinIntentos) return 'Intentos Agotados';
              if (haCompletado) return 'Volver a Intentar';
              return 'Resolver Quiz';
            };

            return (
              <div 
                key={quiz.idQuiz}
                className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs hover:shadow-md ${
                  haCompletado 
                    ? 'bg-slate-50/80 border-slate-300' 
                    : 'bg-white border-slate-200 hover:border-[#2c5364]/40'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3.5 rounded-2xl shrink-0 mt-0.5 bg-slate-100 text-slate-700">
                    <HelpCircle size={22} />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base md:text-lg leading-snug">{quiz.titulo}</h3>
                      
                      {quiz.tema && (
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 border border-slate-200">
                          <BookOpen size={12} className="text-[#2c5364]" />
                          <span>{quiz.tema.nombre}</span>
                        </span>
                      )}

                      {!quiz.asignar_a_todos && (
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-extrabold flex items-center gap-1">
                          <Users size={12} />
                          <span>Asignación Especial</span>
                        </span>
                      )}
                    </div>

                    {quiz.descripcion && (
                      <p className="text-slate-600 text-xs line-clamp-2 font-medium leading-relaxed">{quiz.descripcion}</p>
                    )}

                    {/* Chips de Detalles */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 font-bold">
                      {quiz.limite_tiempo_minutos > 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock size={14} className="text-[#2c5364]" />
                          <span>{quiz.limite_tiempo_minutos} min</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock size={14} />
                          <span>Sin límite de tiempo</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <RotateCcw size={14} className="text-[#2c5364]" />
                        <span>
                          {intentosMaximos > 0 
                            ? `Intentos: ${intentosRealizados} / ${intentosMaximos}` 
                            : 'Intentos Ilimitados'}
                        </span>
                      </span>

                      <span className="flex items-center gap-1">
                        <Award size={14} className="text-[#2c5364]" />
                        <span>Nota Máx: {quiz.calificacion_maxima} pts</span>
                      </span>

                      {haCompletado && (
                        <span className="inline-flex items-center gap-1 font-black px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-900 border border-slate-300">
                          <Check size={14} className="text-emerald-600" />
                          <span>Última Nota: {ultimoIntento.puntaje_obtenido} / {ultimoIntento.puntaje_maximo} ({ultimoIntento.porcentaje}%)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    disabled={sinIntentos}
                    onClick={() => handleStartResolver(quiz)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 ${getButtonClassName()}`}
                  >
                    <Play size={14} fill="currentColor" />
                    <span>{getButtonLabel()}</span>
                  </button>

                  {canManage && (
                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={(e) => handleReiniciarIntentosProfesor(quiz.idQuiz, e)}
                        className="p-2 text-slate-700 hover:text-[#2c5364] hover:bg-white rounded-lg transition-all cursor-pointer"
                        title="Conceder/Reiniciar Intentos para Estudiantes"
                      >
                        <RotateCcw size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(quiz, e)}
                        className="p-2 text-slate-700 hover:text-[#2c5364] hover:bg-white rounded-lg transition-all cursor-pointer"
                        title="Editar Cuestionario"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteQuiz(quiz.idQuiz, e)}
                        className="p-2 text-slate-700 hover:text-red-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                        title="Eliminar Cuestionario"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Formulario Quiz */}
      <QuizFormModal 
        key={quizToEdit ? quizToEdit.idQuiz : 'new-quiz'}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        idCurso={idCurso}
        quizToEdit={quizToEdit}
        temas={temas}
        onSuccess={reloadQuizzes}
      />

      {/* Modal Resolver Quiz */}
      <QuizResolverModal 
        isOpen={isResolverModalOpen}
        onClose={() => setIsResolverModalOpen(false)}
        quizId={activeQuizId}
        onQuizCompleted={reloadQuizzes}
      />
    </div>
  );
};

QuizSeccion.propTypes = {
  idCurso: PropTypes.string.isRequired,
  user: PropTypes.object,
  temas: PropTypes.array,
  onQuizCompleted: PropTypes.func,
};

export default QuizSeccion;
