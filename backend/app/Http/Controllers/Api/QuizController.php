<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use App\Models\ItemTema;
use App\Models\Quiz;
use App\Models\QuizAsignacion;
use App\Models\QuizIntento;
use App\Models\QuizOpcion;
use App\Models\QuizPregunta;
use App\Models\QuizRespuestaIntento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class QuizController extends Controller
{
    /**
     * Listar todos los quizzes de un curso.
     */
    public function indexByCurso(Request $request, $idCurso)
    {
        $user = $request->user('sanctum') ?? auth()->user();
        Curso::findOrFail($idCurso);

        $query = Quiz::with(['creador:idUsuario,nombreCompleto', 'tema:idTema,nombre'])
            ->where('idCurso', $idCurso);

        $userRole = $user ? $user->roles->pluck('rol')->first() : null;
        if ($userRole === 'Estudiante') {
            $query->where(function ($q) use ($user) {
                $q->where('asignar_a_todos', true)
                    ->orWhereHas('asignaciones', function ($sub) use ($user) {
                        $sub->where('idEstudiante', $user->idUsuario);
                    });
            });
        }

        $quizzes = $query->orderBy('created_at', 'desc')->get();

        // Adjuntar el último intento del estudiante si corresponde
        if ($user) {
            foreach ($quizzes as $quiz) {
                $ultimoIntento = QuizIntento::where('idQuiz', $quiz->idQuiz)
                    ->where('idEstudiante', $user->idUsuario)
                    ->latest()
                    ->first();
                $quiz->ultimo_intento = $ultimoIntento;
            }
        }

        return response()->json($quizzes);
    }

    /**
     * Obtener el detalle de un Quiz con preguntas y opciones.
     */
    public function show(Request $request, $idQuiz)
    {
        $user = $request->user('sanctum') ?? auth()->user();
        $quiz = Quiz::with([
            'creador:idUsuario,nombreCompleto',
            'tema:idTema,nombre',
            'preguntas.opciones',
            'asignaciones.estudiante:idUsuario,nombreCompleto,correo',
        ])->findOrFail($idQuiz);

        $esProfesor = $user && ($user->rol === 'Profesor' || $user->rol === 'Administrador');

        // Si es estudiante y no es profesor, ocultar si las opciones son correctas antes de enviar
        if (! $esProfesor) {
            foreach ($quiz->preguntas as $pregunta) {
                if (! $quiz->mostrar_retroalimentacion) {
                    unset($pregunta->explicacion);
                }
                foreach ($pregunta->opciones as $opcion) {
                    unset($opcion->es_correcta);
                }
            }
        }

        // Adjuntar historial de intentos del estudiante
        if ($user) {
            $quiz->mis_intentos = QuizIntento::with('respuestas')
                ->where('idQuiz', $idQuiz)
                ->where('idEstudiante', $user->idUsuario)
                ->latest()
                ->get();
        }

        return response()->json($quiz);
    }

    /**
     * Crear un nuevo Quiz (Profesor/Admin).
     */
    public function store(Request $request, $idCurso)
    {
        $user = $request->user();
        Curso::findOrFail($idCurso);

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:150',
            'descripcion' => 'nullable|string',
            'idTema' => 'nullable|exists:temas,idTema',
            'limite_tiempo_minutos' => 'nullable|integer|min:0',
            'intentos_maximos' => 'nullable|integer|min:0',
            'calificacion_maxima' => 'nullable|numeric|min:1',
            'mostrar_retroalimentacion' => 'nullable|boolean',
            'asignar_a_todos' => 'nullable|boolean',
            'estudiantes' => 'nullable|array',
            'estudiantes.*' => 'exists:usuarios,idUsuario',
            'preguntas' => 'required|array|min:1',
            'preguntas.*.enunciado' => 'required|string',
            'preguntas.*.tipo' => 'nullable|string|in:opcion_multiple,verdadero_falso',
            'preguntas.*.puntos' => 'nullable|numeric|min:0.1',
            'preguntas.*.explicacion' => 'nullable|string',
            'preguntas.*.opciones' => 'required|array|min:2',
            'preguntas.*.opciones.*.texto_opcion' => 'required|string',
            'preguntas.*.opciones.*.es_correcta' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $calificacionMaxima = $this->calcularCalificacionMaxima($request->preguntas, $request->calificacion_maxima);

            $quiz = Quiz::create([
                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion,
                'idCurso' => $idCurso,
                'idTema' => $request->idTema,
                'idCreador' => $user->idUsuario,
                'limite_tiempo_minutos' => $request->limite_tiempo_minutos ?? 0,
                'intentos_maximos' => $request->intentos_maximos ?? 0,
                'calificacion_maxima' => $calificacionMaxima,
                'mostrar_retroalimentacion' => $request->boolean('mostrar_retroalimentacion', true),
                'estado' => 'publicado',
                'asignar_a_todos' => $request->boolean('asignar_a_todos', true),
            ]);

            // Registrar en items_tema si pertenece a un Tema
            if ($request->filled('idTema')) {
                $maxOrden = ItemTema::where('idTema', $request->idTema)->max('orden') ?? 0;
                ItemTema::create([
                    'idTema' => $request->idTema,
                    'itemable_type' => Quiz::class,
                    'itemable_id' => $quiz->idQuiz,
                    'orden' => $maxOrden + 1,
                ]);
            }

            $this->guardarPreguntasYOpciones($quiz->idQuiz, $request->preguntas);
            $this->guardarAsignaciones($quiz, $request->estudiantes);

            DB::commit();

            return response()->json(array_merge(['message' => 'Quiz creado exitosamente.'], $quiz->load('preguntas.opciones')->toArray()), 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Error al crear el quiz.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar un Quiz (Profesor/Admin).
     */
    public function update(Request $request, $idQuiz)
    {
        $quiz = Quiz::findOrFail($idQuiz);

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:150',
            'descripcion' => 'nullable|string',
            'idTema' => 'nullable|exists:temas,idTema',
            'limite_tiempo_minutos' => 'nullable|integer|min:0',
            'intentos_maximos' => 'nullable|integer|min:0',
            'calificacion_maxima' => 'nullable|numeric|min:1',
            'mostrar_retroalimentacion' => 'nullable|boolean',
            'asignar_a_todos' => 'nullable|boolean',
            'estudiantes' => 'nullable|array',
            'preguntas' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $calificacionMaxima = $this->calcularCalificacionMaxima($request->preguntas, $request->calificacion_maxima);
            $oldTemaId = $quiz->idTema;

            $quiz->update([
                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion,
                'idTema' => $request->idTema,
                'limite_tiempo_minutos' => $request->limite_tiempo_minutos ?? 0,
                'intentos_maximos' => $request->intentos_maximos ?? 0,
                'calificacion_maxima' => $calificacionMaxima,
                'mostrar_retroalimentacion' => $request->boolean('mostrar_retroalimentacion', true),
                'asignar_a_todos' => $request->boolean('asignar_a_todos', true),
            ]);

            // Actualizar itemTema si cambió el idTema
            if ($oldTemaId !== $request->idTema) {
                ItemTema::where('itemable_type', Quiz::class)->where('itemable_id', $quiz->idQuiz)->delete();
                if ($request->filled('idTema')) {
                    $maxOrden = ItemTema::where('idTema', $request->idTema)->max('orden') ?? 0;
                    ItemTema::create([
                        'idTema' => $request->idTema,
                        'itemable_type' => Quiz::class,
                        'itemable_id' => $quiz->idQuiz,
                        'orden' => $maxOrden + 1,
                    ]);
                }
            }

            $this->guardarPreguntasYOpciones($quiz->idQuiz, $request->preguntas);
            $this->guardarAsignaciones($quiz, $request->estudiantes);

            DB::commit();

            return response()->json(['message' => 'Quiz actualizado exitosamente.', 'quiz' => $quiz->load('preguntas.opciones')]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Error al actualizar el quiz.', 'error' => $e->getMessage()], 500);
        }
    }

    private function calcularCalificacionMaxima(array $preguntas, $fallback = 10.00): float
    {
        $sumPuntos = array_reduce($preguntas, function ($c, $p) {
            return $c + (float) ($p['puntos'] ?? 1.00);
        }, 0.00);

        return $sumPuntos > 0 ? $sumPuntos : (float) ($fallback ?? 10.00);
    }

    private function guardarPreguntasYOpciones(int $idQuiz, array $preguntas): void
    {
        QuizPregunta::where('idQuiz', $idQuiz)->delete();

        foreach ($preguntas as $idxP => $pData) {
            $pregunta = QuizPregunta::create([
                'idQuiz' => $idQuiz,
                'enunciado' => $pData['enunciado'],
                'tipo' => $pData['tipo'] ?? 'opcion_multiple',
                'puntos' => $pData['puntos'] ?? 1.00,
                'explicacion' => $pData['explicacion'] ?? null,
                'orden' => $idxP + 1,
            ]);

            foreach ($pData['opciones'] as $idxO => $oData) {
                QuizOpcion::create([
                    'idPreguntaQuiz' => $pregunta->idPreguntaQuiz,
                    'texto_opcion' => $oData['texto_opcion'],
                    'es_correcta' => $oData['es_correcta'],
                    'orden' => $idxO + 1,
                ]);
            }
        }
    }

    private function guardarAsignaciones(Quiz $quiz, ?array $estudiantes): void
    {
        QuizAsignacion::where('idQuiz', $quiz->idQuiz)->delete();

        if (! $quiz->asignar_a_todos && $estudiantes) {
            foreach ($estudiantes as $idEst) {
                QuizAsignacion::create([
                    'idQuiz' => $quiz->idQuiz,
                    'idEstudiante' => $idEst,
                ]);
            }
        }
    }

    /**
     * Eliminar un Quiz.
     */
    public function destroy($idQuiz)
    {
        $quiz = Quiz::findOrFail($idQuiz);
        ItemTema::where('itemable_type', Quiz::class)->where('itemable_id', $quiz->idQuiz)->delete();
        $quiz->delete();

        return response()->json(['message' => 'Quiz eliminado exitosamente.']);
    }

    /**
     * Calificación Automatizada (Automated Grading) inmediata de intento de Quiz.
     */
    public function enviarIntento(Request $request, $idQuiz)
    {
        $user = $request->user();
        $quiz = Quiz::with('preguntas.opciones')->findOrFail($idQuiz);

        $validationError = $this->validarIntentoQuiz($request, $quiz, $user);
        if ($validationError) {
            return $validationError;
        }

        DB::beginTransaction();
        try {
            $preguntasMap = $quiz->preguntas->keyBy('idPreguntaQuiz');
            $submittedMap = collect($request->respuestas)->keyBy('idPreguntaQuiz');

            $evaluacion = $this->procesarEvaluacionPreguntas($preguntasMap, $submittedMap);
            $puntajeObtenido = $evaluacion['puntajeObtenido'];
            $puntajeMaximo = $evaluacion['puntajeMaximo'];
            $respuestasData = $evaluacion['respuestasData'];

            $calificacionEscalada = 0.00;
            $porcentaje = 0.00;
            if ($puntajeMaximo > 0) {
                $calificacionEscalada = round(($puntajeObtenido / $puntajeMaximo) * $quiz->calificacion_maxima, 2);
                $porcentaje = round(($puntajeObtenido / $puntajeMaximo) * 100, 2);
            }

            $aprobado = ($porcentaje >= 60.00);

            $puntajeMaximoAnterior = QuizIntento::where('idQuiz', $quiz->idQuiz)
                ->where('idEstudiante', $user->idUsuario)
                ->max('puntaje_obtenido') ?? 0.00;

            $intento = QuizIntento::create([
                'idQuiz' => $quiz->idQuiz,
                'idEstudiante' => $user->idUsuario,
                'puntaje_obtenido' => $calificacionEscalada,
                'puntaje_maximo' => $quiz->calificacion_maxima,
                'porcentaje' => $porcentaje,
                'aprobado' => $aprobado,
                'tiempo_segundos' => $request->tiempo_segundos ?? null,
                'fecha_envio' => now(),
            ]);

            foreach ($respuestasData as $r) {
                QuizRespuestaIntento::create([
                    'idIntentoQuiz' => $intento->idIntentoQuiz,
                    'idPreguntaQuiz' => $r['idPreguntaQuiz'],
                    'idOpcionSeleccionada' => $r['idOpcionSeleccionada'],
                    'es_correcta' => $r['es_correcta'],
                    'puntaje_ganado' => $r['puntaje_ganado'],
                ]);
            }

            $mejoraPuntaje = max(0, $calificacionEscalada - $puntajeMaximoAnterior);
            $xpGanada = (int) round($mejoraPuntaje * 10);
            if ($xpGanada > 0) {
                $user->increment('xp', $xpGanada);
            }

            DB::commit();

            $intento->load([
                'respuestas.pregunta.opciones',
                'respuestas.opcionSeleccionada',
            ]);

            return response()->json([
                'message' => 'Quiz evaluado automáticamente con éxito.',
                'intento' => $intento,
                'xp_ganado' => $xpGanada,
                'user' => [
                    'idUsuario' => $user->idUsuario,
                    'xp' => $user->fresh()->xp,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Error al calificar el quiz.', 'error' => $e->getMessage()], 500);
        }
    }

    private function validarIntentoQuiz(Request $request, Quiz $quiz, $user)
    {
        $validator = Validator::make($request->all(), [
            'respuestas' => 'required|array',
            'respuestas.*.idPreguntaQuiz' => 'required|exists:quiz_preguntas,idPreguntaQuiz',
            'respuestas.*.idOpcionSeleccionada' => 'nullable|exists:quiz_opciones,idOpcionQuiz',
            'tiempo_segundos' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($quiz->intentos_maximos > 0) {
            $intentosPreviosCount = QuizIntento::where('idQuiz', $quiz->idQuiz)
                ->where('idEstudiante', $user->idUsuario)
                ->count();
            if ($intentosPreviosCount >= $quiz->intentos_maximos) {
                return response()->json([
                    'message' => 'Has alcanzado el número máximo de intentos permitidos para este cuestionario.',
                ], 403);
            }
        }

        return null;
    }

    private function procesarEvaluacionPreguntas($preguntasMap, $submittedMap): array
    {
        $puntajeObtenido = 0.00;
        $puntajeMaximo = 0.00;
        $respuestasData = [];

        foreach ($preguntasMap as $idPregunta => $pregunta) {
            $puntosPregunta = (float) $pregunta->puntos;
            $puntajeMaximo += $puntosPregunta;

            $submitted = $submittedMap->get($idPregunta);
            $idOpcionSel = $submitted['idOpcionSeleccionada'] ?? null;
            $esCorrecta = false;
            $puntajeGanado = 0.00;

            if ($idOpcionSel) {
                $opcion = QuizOpcion::find($idOpcionSel);
                if ($opcion && $opcion->idPreguntaQuiz === $idPregunta && $opcion->es_correcta) {
                    $esCorrecta = true;
                    $puntajeGanado = $puntosPregunta;
                }
            }

            $puntajeObtenido += $puntajeGanado;

            $respuestasData[] = [
                'idPreguntaQuiz' => $idPregunta,
                'idOpcionSeleccionada' => $idOpcionSel,
                'es_correcta' => $esCorrecta,
                'puntaje_ganado' => $puntajeGanado,
            ];
        }

        return [
            'puntajeObtenido' => $puntajeObtenido,
            'puntajeMaximo' => $puntajeMaximo,
            'respuestasData' => $respuestasData,
        ];
    }

    /**
     * Reiniciar intentos de un Quiz para un estudiante o todos (Profesor/Admin).
     */
    public function reiniciarIntentos(Request $request, $idQuiz)
    {
        Quiz::findOrFail($idQuiz);
        $idEstudiante = $request->idEstudiante;

        $query = QuizIntento::where('idQuiz', $idQuiz);
        if ($idEstudiante) {
            $query->where('idEstudiante', $idEstudiante);
        }
        $query->delete();

        return response()->json(['message' => 'Intentos reiniciados con éxito.']);
    }

    /**
     * Listar intentos de un Quiz.
     */
    public function listarIntentos(Request $request, $idQuiz)
    {
        $user = $request->user();
        Quiz::findOrFail($idQuiz);

        $esProfesor = ($user->rol === 'Profesor' || $user->rol === 'Administrador');

        $query = QuizIntento::with(['estudiante:idUsuario,nombreCompleto,correo', 'respuestas'])
            ->where('idQuiz', $idQuiz);

        if (! $esProfesor) {
            $query->where('idEstudiante', $user->idUsuario);
        }

        $intentos = $query->orderBy('fecha_envio', 'desc')->get();

        return response()->json($intentos);
    }
}
