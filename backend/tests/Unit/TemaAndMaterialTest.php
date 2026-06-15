<?php

namespace Tests\Unit;

use App\Models\Curso;
use App\Models\User;
use App\Models\Rol;
use App\Models\Tema;
use App\Models\MaterialAprendizaje;
use App\Models\ItemTema;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class TemaAndMaterialTest extends TestCase
{
    use RefreshDatabase;

    protected $profesorRol;
    protected $estudianteRol;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('estadosCuenta')->insertOrIgnore([
            'idEstado' => 1,
            'estado' => 'Activo'
        ]);

        DB::table('roles')->insertOrIgnore([
            ['idRol' => 3, 'rol' => 'Profesor'],
            ['idRol' => 6, 'rol' => 'Estudiante']
        ]);

        $this->profesorRol = Rol::find(3);
        $this->estudianteRol = Rol::find(6);
    }

    public function test_tema_belongs_to_curso()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $curso = Curso::create([
            'titulo' => 'Curso de Django',
            'descripcion' => 'Backend con Django',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario
        ]);

        $tema = Tema::create([
            'nombre' => 'Módulo 1: Introducción',
            'descripcion' => 'Conceptos básicos',
            'idCurso' => $curso->idCurso
        ]);

        $this->assertInstanceOf(Curso::class, $tema->curso);
        $this->assertEquals($curso->idCurso, $tema->curso->idCurso);
    }

    public function test_material_belongs_to_creator()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $material = MaterialAprendizaje::create([
            'titulo' => 'Guía de estudio',
            'descripcion' => 'PDF complementario',
            'tipo' => 'PDF',
            'enlaceArchivo' => 'materials/guide.pdf',
            'idUsuarioCreador' => $professor->idUsuario
        ]);

        $this->assertInstanceOf(User::class, $material->creador);
        $this->assertEquals($professor->idUsuario, $material->creador->idUsuario);
    }

    public function test_tema_has_polymorphic_items()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $curso = Curso::create([
            'titulo' => 'Curso de Django',
            'descripcion' => 'Backend con Django',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario
        ]);

        $tema = Tema::create([
            'nombre' => 'Módulo 1',
            'descripcion' => 'Test',
            'idCurso' => $curso->idCurso
        ]);

        $material = MaterialAprendizaje::create([
            'titulo' => 'Video Clase 1',
            'tipo' => 'video',
            'enlaceArchivo' => 'materials/video1.mp4',
            'idUsuarioCreador' => $professor->idUsuario
        ]);

        $itemTema = ItemTema::create([
            'idTema' => $tema->idTema,
            'itemable_type' => MaterialAprendizaje::class,
            'itemable_id' => $material->idMaterial,
            'orden' => 1
        ]);

        $this->assertCount(1, $tema->items);
        $this->assertInstanceOf(ItemTema::class, $tema->items[0]);
        $this->assertEquals($material->idMaterial, $tema->items[0]->itemable_id);
        $this->assertInstanceOf(MaterialAprendizaje::class, $tema->items[0]->itemable);
        $this->assertEquals('Video Clase 1', $tema->items[0]->itemable->titulo);
    }
}
