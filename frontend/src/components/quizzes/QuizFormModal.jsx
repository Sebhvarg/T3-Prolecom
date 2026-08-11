import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { quizzesService } from '../../api/quizzesService';
import { cursosService } from '../../api/cursosService';
import { 
  X, Plus, Trash2, HelpCircle, CheckCircle2, 
  Users, Clock, Award, Save, AlertCircle, Loader2, RotateCcw
} from 'lucide-react';

let qIdCounter = 0;
const genTempId = () => {
  qIdCounter += 1;
  return `temp-id-${qIdCounter}`;
};

const createDefaultQuestion = () => ({
  id: genTempId(),
  enunciado: '',
  tipo: 'opcion_multiple',
  puntos: 5,
  explicacion: '',
  opciones: [
    { id: genTempId(), texto_opcion: '', es_correcta: true },
    { id: genTempId(), texto_opcion: '', es_correcta: false },
  ]
});

const getInitialForm = (quizToEdit) => {
  if (quizToEdit) {
    return {
      titulo: quizToEdit.titulo || '',
      descripcion: quizToEdit.descripcion || '',
      idTema: quizToEdit.idTema || '',
      limite_tiempo_minutos: quizToEdit.limite_tiempo_minutos || 0,
      intentos_maximos: quizToEdit.intentos_maximos ?? 0,
      mostrar_retroalimentacion: quizToEdit.mostrar_retroalimentacion ?? true,
      asignar_a_todos: quizToEdit.asignar_a_todos ?? true,
      estudiantesSeleccionados: quizToEdit.asignaciones ? quizToEdit.asignaciones.map(a => a.idEstudiante) : [],
      preguntas: quizToEdit.preguntas && quizToEdit.preguntas.length > 0 ? quizToEdit.preguntas.map(p => ({
        id: p.idPreguntaQuiz || genTempId(),
        enunciado: p.enunciado || '',
        tipo: p.tipo || 'opcion_multiple',
        puntos: p.puntos ? Number.parseFloat(p.puntos) : 5,
        explicacion: p.explicacion || '',
        opciones: p.opciones && p.opciones.length > 0 ? p.opciones.map(o => ({
          id: o.idOpcionQuiz || genTempId(),
          texto_opcion: o.texto_opcion || '',
          es_correcta: Boolean(o.es_correcta),
        })) : [
          { id: genTempId(), texto_opcion: '', es_correcta: true },
          { id: genTempId(), texto_opcion: '', es_correcta: false },
        ]
      })) : [createDefaultQuestion()]
    };
  }
  return {
    titulo: '',
    descripcion: '',
    idTema: '',
    limite_tiempo_minutos: 0,
    intentos_maximos: 0,
    mostrar_retroalimentacion: true,
    asignar_a_todos: true,
    estudiantesSeleccionados: [],
    preguntas: [createDefaultQuestion()]
  };
};

const QuizFormModal = ({ isOpen, onClose, idCurso, quizToEdit, temas, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estudiantesCurso, setEstudiantesCurso] = useState([]);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);

  const [form, setForm] = useState(() => getInitialForm(quizToEdit));

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const loadEstudiantes = async () => {
      setLoadingEstudiantes(true);
      try {
        const data = await cursosService.getEstudiantes(idCurso);
        if (isMounted) setEstudiantesCurso(data || []);
      } catch {
        if (isMounted) setEstudiantesCurso([]);
      } finally {
        if (isMounted) setLoadingEstudiantes(false);
      }
    };

    loadEstudiantes();

    return () => {
      isMounted = false;
    };
  }, [isOpen, idCurso]);

  if (!isOpen) return null;

  const puntajeTotalCalculado = form.preguntas.reduce((acc, p) => acc + (Number.parseFloat(p.puntos) || 0), 0);

  const handleAddPregunta = () => {
    setForm(prev => ({
      ...prev,
      preguntas: [
        ...prev.preguntas,
        createDefaultQuestion()
      ]
    }));
  };

  const handleRemovePregunta = (pId) => {
    if (form.preguntas.length <= 1) return;
    setForm(prev => ({
      ...prev,
      preguntas: prev.preguntas.filter(p => p.id !== pId)
    }));
  };

  const handlePreguntaChange = (pId, field, value) => {
    setForm(prev => ({
      ...prev,
      preguntas: prev.preguntas.map(p => {
        if (p.id !== pId) return p;
        if (field === 'tipo' && value === 'verdadero_falso') {
          return {
            ...p,
            tipo: value,
            opciones: [
              { id: genTempId(), texto_opcion: 'Verdadero', es_correcta: true },
              { id: genTempId(), texto_opcion: 'Falso', es_correcta: false },
            ]
          };
        }
        return { ...p, [field]: value };
      })
    }));
  };

  const handleAddOpcion = (pId) => {
    setForm(prev => ({
      ...prev,
      preguntas: prev.preguntas.map(p => {
        if (p.id !== pId) return p;
        return {
          ...p,
          opciones: [...p.opciones, { id: genTempId(), texto_opcion: '', es_correcta: false }]
        };
      })
    }));
  };

  const handleRemoveOpcion = (pId, oId) => {
    setForm(prev => ({
      ...prev,
      preguntas: prev.preguntas.map(p => {
        if (p.id !== pId) return p;
        if (p.opciones.length <= 2) return p;
        return {
          ...p,
          opciones: p.opciones.filter(o => o.id !== oId)
        };
      })
    }));
  };

  const handleOpcionChange = (pId, oId, field, value) => {
    setForm(prev => ({
      ...prev,
      preguntas: prev.preguntas.map(p => {
        if (p.id !== pId) return p;
        const newOpciones = p.opciones.map(o => {
          if (field === 'es_correcta' && value) {
            return { ...o, es_correcta: o.id === oId };
          }
          if (o.id === oId) {
            return { ...o, [field]: value };
          }
          return o;
        });
        return { ...p, opciones: newOpciones };
      })
    }));
  };

  const toggleEstudianteSeleccionado = (idEstudiante) => {
    setForm(prev => {
      const exists = prev.estudiantesSeleccionados.includes(idEstudiante);
      return {
        ...prev,
        estudiantesSeleccionados: exists
          ? prev.estudiantesSeleccionados.filter(id => id !== idEstudiante)
          : [...prev.estudiantesSeleccionados, idEstudiante]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    for (let i = 0; i < form.preguntas.length; i += 1) {
      const p = form.preguntas[i];
      if (!p.enunciado.trim()) {
        setError(`La pregunta #${i + 1} debe tener un enunciado.`);
        return;
      }
      const tieneCorrecta = p.opciones.some(o => o.es_correcta);
      if (!tieneCorrecta) {
        setError(`La pregunta #${i + 1} debe tener al menos una respuesta marcada como correcta.`);
        return;
      }
      for (let j = 0; j < p.opciones.length; j += 1) {
        if (!p.opciones[j].texto_opcion.trim()) {
          setError(`La opción #${j + 1} de la pregunta #${i + 1} no puede estar vacía.`);
          return;
        }
      }
    }

    if (!form.asignar_a_todos && form.estudiantesSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un estudiante si el quiz no está asignado a todos.');
      return;
    }

    setLoading(true);

    const payload = {
      titulo: form.titulo,
      descripcion: form.descripcion,
      idTema: form.idTema || null,
      limite_tiempo_minutos: Number.parseInt(form.limite_tiempo_minutos, 10) || 0,
      intentos_maximos: Number.parseInt(form.intentos_maximos, 10) || 0,
      calificacion_maxima: puntajeTotalCalculado,
      mostrar_retroalimentacion: form.mostrar_retroalimentacion,
      asignar_a_todos: form.asignar_a_todos,
      estudiantes: form.estudiantesSeleccionados,
      preguntas: form.preguntas.map(p => ({
        enunciado: p.enunciado,
        tipo: p.tipo,
        puntos: Number.parseFloat(p.puntos) || 1,
        explicacion: p.explicacion,
        opciones: p.opciones.map(o => ({
          texto_opcion: o.texto_opcion,
          es_correcta: Boolean(o.es_correcta)
        }))
      }))
    };

    try {
      if (quizToEdit) {
        await quizzesService.updateQuiz(quizToEdit.idQuiz, payload);
      } else {
        await quizzesService.createQuiz(idCurso, payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar el cuestionario.');
    } finally {
      setLoading(false);
    }
  };

  const renderEstudiantesListContent = () => {
    if (loadingEstudiantes) {
      return <Loader2 size={20} className="animate-spin text-[#2c5364] mx-auto" />;
    }

    if (estudiantesCurso.length === 0) {
      return <p className="text-xs text-slate-500 italic">No hay estudiantes inscritos en este curso.</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
        {estudiantesCurso.map(est => {
          const selected = form.estudiantesSeleccionados.includes(est.idUsuario);
          return (
            <label 
              key={est.idUsuario} 
              htmlFor={`est-select-${est.idUsuario}`}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                selected ? 'bg-[#2c5364]/10 border-[#2c5364] text-[#2c5364]' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <input 
                id={`est-select-${est.idUsuario}`}
                type="checkbox"
                checked={selected}
                onChange={() => toggleEstudianteSeleccionado(est.idUsuario)}
                className="rounded text-[#2c5364] focus:ring-[#2c5364]"
              />
              <span className="truncate">{est.nombreCompleto} ({est.correo})</span>
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed top-16 left-0 md:left-64 right-0 bottom-0 bg-slate-50 z-40 flex flex-col overflow-hidden animate-fade-in border-l border-slate-200">
      
      {/* Header Superior Principal */}
      <div className="p-5 md:px-8 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#2c5364]/10 text-[#2c5364] rounded-2xl">
            <HelpCircle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {quizToEdit ? 'Editar Cuestionario (Quiz)' : 'Crear Nuevo Cuestionario (Quiz)'}
            </h2>
            <p className="text-xs text-slate-600 font-medium">Configura las preguntas y el sistema de evaluación automatizada</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="quiz-editor-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#2c5364] hover:bg-[#203a43] text-white text-xs font-bold rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{quizToEdit ? 'Guardar Cambios' : 'Publicar Cuestionario'}</span>
          </button>
        </div>
      </div>

      {/* Notificación de Error */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-xs font-bold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ÁREA DE FORMULARIO DE PANTALLA COMPLETA */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <form id="quiz-editor-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          
          {/* Tarjeta 1: Información General */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              1. Información General del Cuestionario
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="quiz-form-titulo" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Título del Cuestionario</label>
                <input 
                  id="quiz-form-titulo"
                  type="text"
                  required
                  placeholder="Ej. Quiz 1: Estructuras de Control y Condicionales"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#2c5364] focus:ring-2 focus:ring-[#2c5364]/20 text-slate-900 font-semibold placeholder-slate-400 text-sm bg-white"
                />
              </div>

              <div>
                <label htmlFor="quiz-form-descripcion" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Instrucciones o Descripción (Opcional)</label>
                <textarea 
                  id="quiz-form-descripcion"
                  rows="2"
                  placeholder="Instrucciones breves para los estudiantes..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#2c5364] focus:ring-2 focus:ring-[#2c5364]/20 text-slate-900 font-medium placeholder-slate-400 text-sm bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Vincular a Tema */}
                <div>
                  <label htmlFor="quiz-form-idTema" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Tema Asociado (Opcional)</label>
                  <select
                    id="quiz-form-idTema"
                    value={form.idTema}
                    onChange={(e) => setForm({ ...form, idTema: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#2c5364] focus:ring-2 focus:ring-[#2c5364]/20 text-slate-900 font-bold text-sm bg-white"
                  >
                    <option value="">Sin tema (Quiz General)</option>
                    {temas?.map(t => (
                      <option key={t.idTema} value={t.idTema}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Intentos Permitidos */}
                <div>
                  <label htmlFor="quiz-form-intentosMaximos" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">
                    <RotateCcw size={14} className="inline mr-1 text-[#2c5364]" />
                    Intentos Permitidos
                  </label>
                  <select
                    id="quiz-form-intentosMaximos"
                    value={form.intentos_maximos}
                    onChange={(e) => setForm({ ...form, intentos_maximos: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#2c5364] focus:ring-2 focus:ring-[#2c5364]/20 text-slate-900 font-bold text-sm bg-white"
                  >
                    <option value={0}>Ilimitados (0)</option>
                    <option value={1}>1 Intento</option>
                    <option value={2}>2 Intentos</option>
                    <option value={3}>3 Intentos</option>
                    <option value={5}>5 Intentos</option>
                  </select>
                </div>

                {/* Límite de Tiempo */}
                <div>
                  <label htmlFor="quiz-form-limiteTiempo" className="block text-xs font-extrabold text-slate-900 uppercase mb-1">
                    <Clock size={14} className="inline mr-1 text-[#2c5364]" />
                    Límite (Minutos)
                  </label>
                  <input 
                    id="quiz-form-limiteTiempo"
                    type="number"
                    min="0"
                    max="180"
                    placeholder="0 = Sin límite"
                    value={form.limite_tiempo_minutos}
                    onChange={(e) => setForm({ ...form, limite_tiempo_minutos: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#2c5364] focus:ring-2 focus:ring-[#2c5364]/20 text-slate-900 font-bold text-sm bg-white"
                  />
                </div>

                {/* Puntuación Total Sumada */}
                <div>
                  <span className="block text-xs font-extrabold text-slate-900 uppercase mb-1">
                    <Award size={14} className="inline mr-1 text-[#2c5364]" />
                    Puntaje Total
                  </span>
                  <div className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-black text-sm flex items-center justify-between">
                    <span>{puntajeTotalCalculado} pts</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">(Suma)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="retro-toggle"
                  checked={form.mostrar_retroalimentacion}
                  onChange={(e) => setForm({ ...form, mostrar_retroalimentacion: e.target.checked })}
                  className="rounded text-[#2c5364] focus:ring-[#2c5364] w-4 h-4"
                />
                <label htmlFor="retro-toggle" className="text-xs text-slate-800 font-extrabold cursor-pointer">
                  Mostrar retroalimentación con respuestas correctas al finalizar el quiz
                </label>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Asignación de Estudiantes */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users size={18} className="text-[#2c5364]" />
                2. Asignación a Estudiantes
              </span>
              <div className="flex items-center gap-5">
                <label htmlFor="asignacion-todos" className="flex items-center gap-2 text-xs text-slate-900 font-extrabold cursor-pointer">
                  <input 
                    id="asignacion-todos"
                    type="radio" 
                    name="asignacion" 
                    checked={form.asignar_a_todos} 
                    onChange={() => setForm({ ...form, asignar_a_todos: true })}
                    className="text-[#2c5364] focus:ring-[#2c5364]"
                  />
                  <span>Todos los estudiantes</span>
                </label>
                <label htmlFor="asignacion-especificos" className="flex items-center gap-2 text-xs text-slate-900 font-extrabold cursor-pointer">
                  <input 
                    id="asignacion-especificos"
                    type="radio" 
                    name="asignacion" 
                    checked={!form.asignar_a_todos} 
                    onChange={() => setForm({ ...form, asignar_a_todos: false })}
                    className="text-[#2c5364] focus:ring-[#2c5364]"
                  />
                  <span>Estudiantes específicos</span>
                </label>
              </div>
            </div>

            {!form.asignar_a_todos && (
              <div className="pt-2">
                {renderEstudiantesListContent()}
              </div>
            )}
          </div>

          {/* Tarjeta 3: Constructor de Preguntas */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                3. Preguntas del Cuestionario ({form.preguntas.length})
              </h3>
              <button 
                type="button" 
                onClick={handleAddPregunta}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2c5364]/10 hover:bg-[#2c5364]/20 text-[#2c5364] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={16} /> Agregar Pregunta
              </button>
            </div>

            {form.preguntas.map((p, idxP) => (
              <div key={p.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-white bg-[#2c5364] px-3 py-1 rounded-lg">
                    Pregunta #{idxP + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    <select
                      value={p.tipo}
                      onChange={(e) => handlePreguntaChange(p.id, 'tipo', e.target.value)}
                      className="text-xs font-bold border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-slate-900"
                    >
                      <option value="opcion_multiple">Opción Múltiple</option>
                      <option value="verdadero_falso">Verdadero / Falso</option>
                    </select>

                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2 py-1">
                      <span className="text-xs text-slate-700 font-extrabold">Puntos:</span>
                      <input 
                        type="number"
                        min="1"
                        step="1"
                        value={p.puntos}
                        onChange={(e) => handlePreguntaChange(p.id, 'puntos', e.target.value)}
                        className="w-14 text-xs font-black text-slate-900 text-center outline-none"
                      />
                    </div>

                    {form.preguntas.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => handleRemovePregunta(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Pregunta"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <textarea 
                    rows="2"
                    placeholder="Escribe el enunciado de la pregunta..."
                    value={p.enunciado}
                    onChange={(e) => handlePreguntaChange(p.id, 'enunciado', e.target.value)}
                    className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-300 focus:border-[#2c5364] text-slate-900 placeholder-slate-400 bg-white"
                  />
                </div>

                {/* Explicación de Retroalimentación */}
                <div>
                  <input 
                    type="text"
                    placeholder="Explicación pedagógica para el estudiante al revisar (opcional)"
                    value={p.explicacion}
                    onChange={(e) => handlePreguntaChange(p.id, 'explicacion', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-800 bg-white placeholder-slate-400"
                  />
                </div>

                {/* Opciones */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-extrabold text-slate-700 uppercase">Opciones (Marca la opción correcta)</span>
                    {p.tipo === 'opcion_multiple' && (
                      <button 
                        type="button" 
                        onClick={() => handleAddOpcion(p.id)}
                        className="text-xs font-bold text-[#2c5364] hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} /> Añadir opción
                      </button>
                    )}
                  </div>

                  {p.opciones.map((o) => (
                    <div key={o.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpcionChange(p.id, o.id, 'es_correcta', true)}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          o.es_correcta ? 'bg-emerald-600 border-emerald-600 text-white font-bold' : 'bg-white border-slate-300 text-slate-400 hover:bg-slate-100'
                        }`}
                        title={o.es_correcta ? 'Respuesta Correcta' : 'Marcar como Correcta'}
                      >
                        <CheckCircle2 size={18} />
                      </button>

                      <input 
                        type="text"
                        placeholder="Texto de la opción..."
                        disabled={p.tipo === 'verdadero_falso'}
                        value={o.texto_opcion}
                        onChange={(e) => handleOpcionChange(p.id, o.id, 'texto_opcion', e.target.value)}
                        className={`flex-1 px-3.5 py-2 text-xs rounded-xl border font-bold ${
                          o.es_correcta ? 'border-emerald-500 bg-emerald-50 text-slate-900' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                        }`}
                      />

                      {p.tipo === 'opcion_multiple' && p.opciones.length > 2 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveOpcion(p.id, o.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </form>
      </div>
    </div>
  );
};

QuizFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  idCurso: PropTypes.string.isRequired,
  quizToEdit: PropTypes.object,
  temas: PropTypes.array,
  onSuccess: PropTypes.func.isRequired,
};

export default QuizFormModal;
