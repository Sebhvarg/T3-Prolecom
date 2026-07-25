<?php

namespace Tests\Feature;

use App\Models\Curso;
use App\Models\Desafio;
use App\Models\Rol;
use App\Models\Solucion;
use App\Models\Tema;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DesafioCreationTest extends TestCase
{
    use RefreshDatabase;

    private const TIPO_PUBLICO = 'público';

    protected $profesorRol;

    protected $estudianteRol;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('estadosCuenta')->insertOrIgnore([
            'idEstado' => 1,
            'estado' => 'Activo',
        ]);

        DB::table('roles')->insertOrIgnore([
            ['idRol' => 3, 'rol' => 'Profesor'],
            ['idRol' => 6, 'rol' => 'Estudiante'],
        ]);

        DB::table('lenguajes_programacion')->insertOrIgnore([
            'idLenguaje' => 1,
            'nombre' => 'Python',
            'slug' => 'python',
            'icono' => 'python.svg',
            'judge0_id' => 71,
            'activo' => 1,
        ]);

        $this->profesorRol = Rol::find(3);
        $this->estudianteRol = Rol::find(6);
    }

    public function test_professor_can_create_desafio_under_tema()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de Pruebas',
            'descripcion' => 'Desafíos en PHP',
            'lp' => 'PHP',
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => 'Tema 1: Pruebas Unitarias',
            'descripcion' => 'Aprende testing',
            'idCurso' => $course->idCurso,
        ]);

        Sanctum::actingAs($professor);

        $payload = [
            'titulo' => 'Suma de Dos Números',
            'descripcionProblema' => 'Escribe una función que sume dos números.',
            'dificultad' => 'Easy',
            'testCases' => [
                [
                    'input' => '2 3',
                    'expected_output' => '5',
                    'is_hidden' => false,
                ],
                [
                    'input' => '10 -5',
                    'expected_output' => '5',
                    'is_hidden' => true,
                ],
            ],
            'puntos' => 15,
            'starter_code' => "def suma(a, b):\n    return a + b",
        ];

        $response = $this->postJson("/api/temas/{$tema->idTema}/desafios", $payload);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'desafio' => [
                'idDesafio',
                'titulo',
                'descripcionProblema',
                'dificultad',
                'testCases',
                'puntos',
                'starter_code',
                'idCreador',
            ],
        ]);

        $this->assertDatabaseHas('desafios', [
            'titulo' => 'Suma de Dos Números',
            'dificultad' => 'Easy',
            'puntos' => 15,
            'idCreador' => $professor->idUsuario,
        ]);

        $desafioId = $response->json('desafio.idDesafio');
        $this->assertDatabaseHas('items_tema', [
            'idTema' => $tema->idTema,
            'itemable_id' => $desafioId,
            'itemable_type' => Desafio::class,
        ]);
    }

    public function test_student_cannot_create_desafio()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso Restringido',
            'descripcion' => 'Solo profesor puede crear desafíos',
            'lp' => 'PHP',
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $student->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => 'Módulo 1',
            'idCurso' => $course->idCurso,
        ]);

        Sanctum::actingAs($student);

        $payload = [
            'titulo' => 'Desafío no autorizado',
            'descripcionProblema' => 'Intento ilegal.',
            'dificultad' => 'Easy',
            'testCases' => [
                [
                    'input' => '',
                    'expected_output' => 'error',
                    'is_hidden' => false,
                ],
            ],
            'puntos' => 10,
        ];

        $response = $this->postJson("/api/temas/{$tema->idTema}/desafios", $payload);

        $response->assertStatus(403);
    }

    public function test_desafio_creation_fails_without_required_fields()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de Validaciones',
            'descripcion' => 'Validando inputs',
            'lp' => 'PHP',
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => 'Módulo de Errores',
            'idCurso' => $course->idCurso,
        ]);

        Sanctum::actingAs($professor);

        $payload = [
            'descripcionProblema' => 'Faltan campos obligatorios.',
            'dificultad' => 'Easy',
        ];

        $response = $this->postJson("/api/temas/{$tema->idTema}/desafios", $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['titulo', 'testCases']);
    }

    public function test_student_can_reset_completed_desafio_and_deduct_xp()
    {
        $student = User::factory()->create(['xp' => 50]);
        $student->roles()->attach($this->estudianteRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de Reset',
            'descripcion' => 'Testing Reset',
            'lp' => 'Python',
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $student->idUsuario,
        ]);

        $desafio = Desafio::create([
            'titulo' => 'Desafío Aprobado',
            'descripcionProblema' => 'Invertir cadena',
            'dificultad' => 'Easy',
            'testCases' => [],
            'salidaEsperada' => 'N/A',
            'puntos' => 20,
            'estado' => 'publicado',
            'idCurso' => $course->idCurso,
            'idCreador' => $student->idUsuario,
        ]);

        Solucion::create([
            'idDesafio' => $desafio->idDesafio,
            'idEstudiante' => $student->idUsuario,
            'idLenguaje' => 1,
            'codigoFuente' => 'print("hello")',
            'estado' => 'aprobado',
            'puntos_otorgados' => 20,
        ]);

        Sanctum::actingAs($student);

        $response = $this->postJson("/api/desafios/{$desafio->idDesafio}/reset");

        $response->assertStatus(200);
        $response->assertJson([
            'xp_deducidos' => 20,
            'user' => [
                'xp' => 30,
            ],
        ]);

        $this->assertEquals(30, $student->fresh()->xp);
        $this->assertDatabaseMissing('soluciones', [
            'idEstudiante' => $student->idUsuario,
            'idDesafio' => $desafio->idDesafio,
        ]);
    }
}
