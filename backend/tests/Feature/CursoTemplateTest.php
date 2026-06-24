<?php

namespace Tests\Feature;

use App\Models\Curso;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CursoTemplateTest extends TestCase
{
    use RefreshDatabase;

    private const TIPO_PUBLICO = 'público';

    private const API_CURSOS_ROUTE = '/api/cursos';

    protected $profesorRol;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic roles and states
        DB::table('estadosCuenta')->insertOrIgnore([
            'idEstado' => 1,
            'estado' => 'Activo',
        ]);

        DB::table('roles')->insertOrIgnore([
            ['idRol' => 1, 'rol' => 'Administrador'],
            ['idRol' => 3, 'rol' => 'Profesor'],
            ['idRol' => 6, 'rol' => 'Estudiante'],
        ]);

        $this->profesorRol = Rol::find(3);
    }

    public function test_creating_python_course_automatically_loads_themes_template()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        Sanctum::actingAs($professor);

        $response = $this->postJson(self::API_CURSOS_ROUTE, [
            'titulo' => 'Curso Master de Python',
            'descripcion' => 'Aprende Python a nivel experto con plantillas automáticas',
            'lp' => 'Python',
            'tipo' => self::TIPO_PUBLICO,
        ]);

        $response->assertStatus(201);

        // Verificamos que el curso se creó
        $curso = Curso::where('titulo', 'Curso Master de Python')->first();
        $this->assertNotNull($curso);

        // Verificamos que se crearon exactamente 8 temas
        $this->assertEquals(8, $curso->temas()->count());

        // Verificamos los nombres de algunos temas esperados
        $temasEsperados = [
            'Introducción a la programación',
            'Variables y tipos de datos (strings y listas)',
            'Funciones',
            'Estructuras de control',
            'Colecciones',
            'Arreglos n-dimensionales',
            'Archivos: entrada y salida',
            'Procesamiento de datos',
        ];

        foreach ($temasEsperados as $tema) {
            $this->assertDatabaseHas('temas', [
                'idCurso' => $curso->idCurso,
                'nombre' => $tema,
            ]);
        }
    }

    public function test_creating_non_python_course_does_not_load_template()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        Sanctum::actingAs($professor);

        $response = $this->postJson(self::API_CURSOS_ROUTE, [
            'titulo' => 'Curso de JavaScript',
            'descripcion' => 'Aprende JS moderno',
            'lp' => 'JavaScript',
            'tipo' => self::TIPO_PUBLICO,
        ]);

        $response->assertStatus(201);

        $curso = Curso::where('titulo', 'Curso de JavaScript')->first();
        $this->assertNotNull($curso);

        // Verificamos que no se crearon temas por defecto para JavaScript
        $this->assertEquals(0, $curso->temas()->count());
    }
}
