<?php

namespace Tests\Feature;

use App\Models\Curso;
use App\Models\Desafio;
use App\Models\Rol;
use App\Models\Tema;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DesafioCreationTest extends TestCase
{
    use RefreshDatabase;

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
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => 'Tema 1: Pruebas Unitarias',
            'descripcion' => 'Aprende testing',
            'idCurso' => $course->idCurso,
        ]);

        Sanctum::actingAs($professor);

        $payload = [
            'titulo' => 'Reto 1: Validar Email',
            'descripcionProblema' => 'Escribe una función que valide un email.',
            'dificultad' => 'Medium',
            'testCases' => [
                [
                    'input' => 'test@test.com',
                    'expected_output' => 'true',
                    'is_hidden' => false,
                ],
                [
                    'input' => 'invalid-email',
                    'expected_output' => 'false',
                    'is_hidden' => true,
                ]
            ],
            'puntos' => 20,
            'starter_code' => 'function validate(email) {}',
        ];

        $response = $this->postJson("/api/temas/{$tema->idTema}/desafios", $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('message', 'Desafío creado y publicado exitosamente.');

        $this->assertDatabaseHas('desafios', [
            'titulo' => 'Reto 1: Validar Email',
            'dificultad' => 'Medium',
            'puntos' => 20,
            'estado' => 'publicado',
            'idCreador' => $professor->idUsuario,
            'idCurso' => $course->idCurso,
        ]);

        // Verificar el ítem en items_tema
        $desafioId = $response->json('desafio.idDesafio');
        $this->assertDatabaseHas('items_tema', [
            'idTema' => $tema->idTema,
            'itemable_type' => Desafio::class,
            'itemable_id' => $desafioId,
        ]);
    }

    public function test_student_cannot_create_desafio()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de Estudiante',
            'descripcion' => 'No permitido',
            'lp' => 'PHP',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => 'Tema Especial',
            'idCurso' => $course->idCurso,
        ]);

        Sanctum::actingAs($student);

        $payload = [
            'titulo' => 'Reto de Estudiante',
            'descripcionProblema' => 'Intento ilegal.',
            'dificultad' => 'Easy',
            'testCases' => [
                [
                    'input' => '',
                    'expected_output' => 'error',
                    'is_hidden' => false,
                ]
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
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => 'Módulo de Errores',
            'idCurso' => $course->idCurso,
        ]);

        Sanctum::actingAs($professor);

        // Envía payload incompleto (sin titulo, testCases vacíos)
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
            'tipo' => 'público',
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

        \App\Models\Solucion::create([
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
            ]
        ]);

        $this->assertEquals(30, $student->fresh()->xp);
        $this->assertDatabaseMissing('soluciones', [
            'idEstudiante' => $student->idUsuario,
            'idDesafio' => $desafio->idDesafio,
        ]);
    }
}
