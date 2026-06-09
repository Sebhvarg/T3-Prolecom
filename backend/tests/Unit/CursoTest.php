<?php

namespace Tests\Unit;

use App\Models\Curso;
use App\Models\User;
use App\Models\Rol;
use App\Models\EstadoCuenta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CursoTest extends TestCase
{
    use RefreshDatabase;

    protected $profesorRol;
    protected $estudianteRol;
    protected $activoEstado;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed states and roles using DB table to bypass mass assignment
        \Illuminate\Support\Facades\DB::table('estadosCuenta')->insertOrIgnore([
            'idEstado' => 1,
            'estado' => 'Activo'
        ]);

        \Illuminate\Support\Facades\DB::table('roles')->insertOrIgnore([
            ['idRol' => 3, 'rol' => 'Profesor'],
            ['idRol' => 6, 'rol' => 'Estudiante']
        ]);

        $this->profesorRol = Rol::find(3);
        $this->estudianteRol = Rol::find(6);
    }

    public function test_curso_belongs_to_creator()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $curso = Curso::create([
            'titulo' => 'Curso de Python',
            'descripcion' => 'Aprende Python',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario
        ]);

        $this->assertInstanceOf(User::class, $curso->creador);
        $this->assertEquals($professor->idUsuario, $curso->creador->idUsuario);
    }

    public function test_curso_can_have_enrolled_students()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $student1 = User::factory()->create();
        $student1->roles()->attach($this->estudianteRol->idRol);

        $student2 = User::factory()->create();
        $student2->roles()->attach($this->estudianteRol->idRol);

        $curso = Curso::create([
            'titulo' => 'Curso de Python',
            'descripcion' => 'Aprende Python',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario
        ]);

        $curso->estudiantes()->attach([$student1->idUsuario, $student2->idUsuario]);

        $this->assertCount(2, $curso->estudiantes);
        $this->assertEquals($student1->idUsuario, $curso->estudiantes[0]->idUsuario);
    }
}
