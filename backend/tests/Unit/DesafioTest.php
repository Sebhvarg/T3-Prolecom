<?php

namespace Tests\Unit;

use App\Models\Curso;
use App\Models\Desafio;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

        $this->seedBasicTestData();
        $this->profesorRol = Rol::find(3);
    }

    private function createMockCourse(User $professor): Curso
    {
        return Curso::create([
            'titulo' => self::TITULO_CURSO,
            'descripcion' => self::DESCRIPCION_CURSO,
            'lp' => 'Python',
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $professor->idUsuario,
        ]);
    }

    private function createMockDesafio(User $professor, Curso $curso, string $titulo, array $testCases = []): Desafio
    {
        return Desafio::create([
            'titulo' => $titulo,
            'descripcionProblema' => 'Problema de prueba.',
            'dificultad' => 'Easy',
            'testCases' => $testCases,
            'salidaEsperada' => 'OK',
            'estado' => 'publicado',
            'idCreador' => $professor->idUsuario,
            'idCurso' => $curso->idCurso,
            'puntos' => 10,
            'starter_code' => 'def run(): pass',
        ]);
    }

    public function test_desafio_belongs_to_creator()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $curso = $this->createMockCourse($professor);
        $desafio = $this->createMockDesafio($professor, $curso, 'Suma de Dos Números', [
            ['input' => '1 2', 'expected_output' => '3', 'is_hidden' => false],
        ]);

        $this->assertInstanceOf(User::class, $desafio->creador);
        $this->assertEquals($professor->idUsuario, $desafio->creador->idUsuario);
    }

    public function test_desafio_belongs_to_curso()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $curso = $this->createMockCourse($professor);
        $desafio = $this->createMockDesafio($professor, $curso, 'Resta de Dos Números', [
            ['input' => '5 2', 'expected_output' => '3', 'is_hidden' => false],
        ]);

        $this->assertInstanceOf(Curso::class, $desafio->curso);
        $this->assertEquals($curso->idCurso, $desafio->curso->idCurso);
    }

    public function test_desafio_has_test_cases_cast()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $curso = $this->createMockCourse($professor);
        $testCasesArray = [
            ['input' => '10', 'expected_output' => '20', 'is_hidden' => false],
            ['input' => '30', 'expected_output' => '60', 'is_hidden' => true],
        ];

        $desafio = $this->createMockDesafio($professor, $curso, 'Multiplicar por Dos', $testCasesArray);

        $this->assertIsArray($desafio->testCases);
        $this->assertEquals($testCasesArray, $desafio->testCases);
    }
}
