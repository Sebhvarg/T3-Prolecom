<?php

namespace Tests\Unit;

use App\Models\Curso;
use App\Models\Desafio;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DesafioTest extends TestCase
{
    use RefreshDatabase;

    private const TITULO_CURSO = 'Curso de Python';

    private const DESCRIPCION_CURSO = 'Aprende Python';

    private const TIPO_PUBLICO = 'público';

    protected $profesorRol;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('estadosCuenta')->insertOrIgnore([
            'idEstado' => 1,
            'estado' => 'Activo',
        ]);

        DB::table('roles')->insertOrIgnore([
            ['idRol' => 3, 'rol' => 'Profesor'],
        ]);

        $this->profesorRol = Rol::find(3);
    }

    public function test_desafio_belongs_to_creator()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $curso = Curso::create([
            'titulo' => self::TITULO_CURSO,
            'descripcion' => self::DESCRIPCION_CURSO,
            'lp' => 'Python',
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $desafio = Desafio::create([
            'titulo' => 'Suma de Dos Números',
            'descripcionProblema' => 'Suma A y B.',
            'dificultad' => 'Easy',
            'testCases' => [
                ['input' => '1 2', 'expected_output' => '3', 'is_hidden' => false],
            ],
            'salidaEsperada' => 'OK',
            'estado' => 'publicado',
            'idCreador' => $professor->idUsuario,
            'idCurso' => $curso->idCurso,
            'puntos' => 10,
            'starter_code' => 'def suma(a, b): pass',
        ]);

        $this->assertInstanceOf(User::class, $desafio->creador);
        $this->assertEquals($professor->idUsuario, $desafio->creador->idUsuario);
    }

    public function test_desafio_belongs_to_curso()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $curso = Curso::create([
            'titulo' => self::TITULO_CURSO,
            'descripcion' => self::DESCRIPCION_CURSO,
            'lp' => 'Python',
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $desafio = Desafio::create([
            'titulo' => 'Resta de Dos Números',
            'descripcionProblema' => 'Resta A y B.',
            'dificultad' => 'Easy',
            'testCases' => [
                ['input' => '5 2', 'expected_output' => '3', 'is_hidden' => false],
            ],
            'salidaEsperada' => 'OK',
            'estado' => 'publicado',
            'idCreador' => $professor->idUsuario,
            'idCurso' => $curso->idCurso,
            'puntos' => 10,
            'starter_code' => 'def resta(a, b): pass',
        ]);

        $this->assertInstanceOf(Curso::class, $desafio->curso);
        $this->assertEquals($curso->idCurso, $desafio->curso->idCurso);
    }

    public function test_desafio_has_test_cases_cast()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $curso = Curso::create([
            'titulo' => self::TITULO_CURSO,
            'descripcion' => self::DESCRIPCION_CURSO,
            'lp' => 'Python',
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $testCasesArray = [
            ['input' => '10', 'expected_output' => '20', 'is_hidden' => false],
            ['input' => '30', 'expected_output' => '60', 'is_hidden' => true],
        ];

        $desafio = Desafio::create([
            'titulo' => 'Multiplicar por Dos',
            'descripcionProblema' => 'Multiplica por 2.',
            'dificultad' => 'Easy',
            'testCases' => $testCasesArray,
            'salidaEsperada' => 'OK',
            'estado' => 'publicado',
            'idCreador' => $professor->idUsuario,
            'idCurso' => $curso->idCurso,
            'puntos' => 10,
            'starter_code' => 'def double(x): pass',
        ]);

        $this->assertIsArray($desafio->testCases);
        $this->assertEquals($testCasesArray, $desafio->testCases);
    }
}
