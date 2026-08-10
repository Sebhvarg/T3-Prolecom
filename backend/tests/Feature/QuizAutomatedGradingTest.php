<?php

namespace Tests\Feature;

use App\Models\Curso;
use App\Models\Quiz;
use App\Models\QuizOpcion;
use App\Models\QuizPregunta;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAutomatedGradingTest extends TestCase
{
    use RefreshDatabase;

    protected $profesor;

    protected $estudiante1;

    protected $estudiante2;

    protected $curso;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedBasicTestData();

        $profesorRol = Rol::find(3);
        $estudianteRol = Rol::find(6);

        $this->profesor = User::factory()->create();
        $this->profesor->roles()->attach($profesorRol->idRol);

        $this->estudiante1 = User::factory()->create();
        $this->estudiante1->roles()->attach($estudianteRol->idRol);

        $this->estudiante2 = User::factory()->create();
        $this->estudiante2->roles()->attach($estudianteRol->idRol);

        $this->curso = Curso::create([
            'titulo' => 'Curso de Demostración Quizzes',
            'descripcion' => 'Evaluaciones Automatizadas',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $this->profesor->idUsuario,
        ]);

        $this->curso->estudiantes()->attach($this->estudiante1->idUsuario);
        $this->curso->estudiantes()->attach($this->estudiante2->idUsuario);
    }

    private function crearQuizDePrueba(array $opcionesQuiz = []): Quiz
    {
        $quiz = Quiz::create(array_merge([
            'titulo' => 'Quiz de Prueba Algoritmos',
            'descripcion' => 'Evaluación de Opción Múltiple',
            'idCurso' => $this->curso->idCurso,
            'idCreador' => $this->profesor->idUsuario,
            'limite_tiempo_minutos' => 15,
            'calificacion_maxima' => 10.00,
            'mostrar_retroalimentacion' => true,
            'asignar_a_todos' => true,
        ], $opcionesQuiz));

        // Pregunta 1 (5 puntos)
        $p1 = QuizPregunta::create([
            'idQuiz' => $quiz->idQuiz,
            'enunciado' => '¿Cuál es la complejidad temporal de la búsqueda binaria?',
            'tipo' => 'opcion_multiple',
            'puntos' => 5.00,
            'orden' => 1,
        ]);

        QuizOpcion::create(['idPreguntaQuiz' => $p1->idPreguntaQuiz, 'texto_opcion' => 'O(n)', 'es_correcta' => false]);
        QuizOpcion::create(['idPreguntaQuiz' => $p1->idPreguntaQuiz, 'texto_opcion' => 'O(log n)', 'es_correcta' => true]);
        QuizOpcion::create(['idPreguntaQuiz' => $p1->idPreguntaQuiz, 'texto_opcion' => 'O(n^2)', 'es_correcta' => false]);

        // Pregunta 2 (5 puntos)
        $p2 = QuizPregunta::create([
            'idQuiz' => $quiz->idQuiz,
            'enunciado' => '¿Python es un lenguaje interpretado?',
            'tipo' => 'verdadero_falso',
            'puntos' => 5.00,
            'orden' => 2,
        ]);

        QuizOpcion::create(['idPreguntaQuiz' => $p2->idPreguntaQuiz, 'texto_opcion' => 'Verdadero', 'es_correcta' => true]);
        QuizOpcion::create(['idPreguntaQuiz' => $p2->idPreguntaQuiz, 'texto_opcion' => 'Falso', 'es_correcta' => false]);

        return $quiz->load('preguntas.opciones');
    }

    public function test_automated_grading_calculates_100_percent_when_all_answers_correct(): void
    {
        $quiz = $this->crearQuizDePrueba();

        $p1 = $quiz->preguntas[0];
        $opc1Correcta = $p1->opciones->firstWhere('es_correcta', true);

        $p2 = $quiz->preguntas[1];
        $opc2Correcta = $p2->opciones->firstWhere('es_correcta', true);

        $response = $this->actingAs($this->estudiante1)
            ->postJson("/api/quizzes/{$quiz->idQuiz}/intentos", [
                'respuestas' => [
                    ['idPreguntaQuiz' => $p1->idPreguntaQuiz, 'idOpcionSeleccionada' => $opc1Correcta->idOpcionQuiz],
                    ['idPreguntaQuiz' => $p2->idPreguntaQuiz, 'idOpcionSeleccionada' => $opc2Correcta->idOpcionQuiz],
                ],
                'tiempo_segundos' => 120,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('intento.puntaje_obtenido', 10)
            ->assertJsonPath('intento.porcentaje', 100)
            ->assertJsonPath('intento.aprobado', true);

        $this->assertDatabaseHas('quiz_intentos', [
            'idQuiz' => $quiz->idQuiz,
            'idEstudiante' => $this->estudiante1->idUsuario,
            'puntaje_obtenido' => 10.00,
            'aprobado' => true,
        ]);
    }

    public function test_automated_grading_calculates_partial_score_correctly(): void
    {
        $quiz = $this->crearQuizDePrueba();

        $p1 = $quiz->preguntas[0];
        $opc1Correcta = $p1->opciones->firstWhere('es_correcta', true);

        $p2 = $quiz->preguntas[1];
        $opc2Incorrecta = $p2->opciones->firstWhere('es_correcta', false);

        $response = $this->actingAs($this->estudiante1)
            ->postJson("/api/quizzes/{$quiz->idQuiz}/intentos", [
                'respuestas' => [
                    ['idPreguntaQuiz' => $p1->idPreguntaQuiz, 'idOpcionSeleccionada' => $opc1Correcta->idOpcionQuiz],
                    ['idPreguntaQuiz' => $p2->idPreguntaQuiz, 'idOpcionSeleccionada' => $opc2Incorrecta->idOpcionQuiz],
                ],
                'tiempo_segundos' => 180,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('intento.puntaje_obtenido', 5)
            ->assertJsonPath('intento.porcentaje', 50)
            ->assertJsonPath('intento.aprobado', false);
    }

    public function test_automated_grading_calculates_0_percent_when_all_answers_incorrect(): void
    {
        $quiz = $this->crearQuizDePrueba();

        $p1 = $quiz->preguntas[0];
        $opc1Incorrecta = $p1->opciones->firstWhere('es_correcta', false);

        $p2 = $quiz->preguntas[1];
        $opc2Incorrecta = $p2->opciones->firstWhere('es_correcta', false);

        $response = $this->actingAs($this->estudiante1)
            ->postJson("/api/quizzes/{$quiz->idQuiz}/intentos", [
                'respuestas' => [
                    ['idPreguntaQuiz' => $p1->idPreguntaQuiz, 'idOpcionSeleccionada' => $opc1Incorrecta->idOpcionQuiz],
                    ['idPreguntaQuiz' => $p2->idPreguntaQuiz, 'idOpcionSeleccionada' => $opc2Incorrecta->idOpcionQuiz],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('intento.puntaje_obtenido', 0)
            ->assertJsonPath('intento.porcentaje', 0)
            ->assertJsonPath('intento.aprobado', false);
    }

    public function test_professor_can_create_quiz_assigned_to_specific_students(): void
    {
        $payload = [
            'titulo' => 'Quiz Exclusivo de Recuperación',
            'descripcion' => 'Solo para estudiantes seleccionados',
            'limite_tiempo_minutos' => 30,
            'calificacion_maxima' => 10.00,
            'mostrar_retroalimentacion' => true,
            'asignar_a_todos' => false,
            'estudiantes' => [$this->estudiante1->idUsuario],
            'preguntas' => [
                [
                    'enunciado' => '¿Qué es una variable?',
                    'tipo' => 'opcion_multiple',
                    'puntos' => 10,
                    'opciones' => [
                        ['texto_opcion' => 'Espacio de memoria reservado', 'es_correcta' => true],
                        ['texto_opcion' => 'Un tipo de bucle', 'es_correcta' => false],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->profesor)
            ->postJson("/api/cursos/{$this->curso->idCurso}/quizzes", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('titulo', 'Quiz Exclusivo de Recuperación')
            ->assertJsonPath('asignar_a_todos', false);

        $this->assertDatabaseHas('quiz_asignaciones', [
            'idEstudiante' => $this->estudiante1->idUsuario,
        ]);
    }
}
