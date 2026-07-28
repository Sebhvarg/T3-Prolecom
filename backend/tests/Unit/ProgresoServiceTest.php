<?php

namespace Tests\Unit;

use App\Services\ProgresoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProgresoServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ProgresoService $service;

    protected int $idCurso = 1;

    protected int $idEstudiante = 10;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ProgresoService;
        $this->seedBasicData();
    }

    private function seedBasicData(): void
    {
        DB::table('estadosCuenta')->insertOrIgnore([
            ['idEstado' => 1, 'estado' => 'Activo'],
        ]);
        DB::table('roles')->insertOrIgnore([
            ['idRol' => 6, 'rol' => 'Estudiante'],
        ]);

        DB::table('usuarios')->insertOrIgnore([[
            'idUsuario' => $this->idEstudiante,
            'nombreCompleto' => 'Estudiante Test',
            'usuario' => 'estudiantetest',
            'email' => 'estudiantetest@test.com',
            'password' => bcrypt('password'),
            'fechaDeNacimiento' => '2000-01-01',
            'idEstado' => 1,
            'xp' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]]);

        DB::table('usuarios')->insertOrIgnore([[
            'idUsuario' => 99,
            'nombreCompleto' => 'Profesor Test',
            'usuario' => 'profesortest',
            'email' => 'profesortest@test.com',
            'password' => bcrypt('password'),
            'fechaDeNacimiento' => '1985-01-01',
            'idEstado' => 1,
            'xp' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]]);

        DB::table('cursos')->insertOrIgnore([[
            'idCurso' => $this->idCurso,
            'titulo' => 'Curso Test',
            'descripcion' => 'Descripción test',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => 99,
            'created_at' => now(),
            'updated_at' => now(),
        ]]);

        DB::table('inscripciones_cursos')->insertOrIgnore([[
            'idUsuarioEstudiante' => $this->idEstudiante,
            'idCurso' => $this->idCurso,
            'fechaInscripcion' => now(),
        ]]);

        DB::table('temas')->insertOrIgnore([[
            'idTema' => 1,
            'nombre' => 'Tema Test',
            'descripcion' => 'Descripción tema test',
            'idCurso' => $this->idCurso,
            'created_at' => now(),
            'updated_at' => now(),
        ]]);
    }

    #[Test]
    public function retorna_cero_cuando_no_hay_desafios_en_el_curso(): void
    {
        $resultado = $this->service->calcularProgresoDesafios($this->idCurso, $this->idEstudiante);

        $this->assertEquals(0, $resultado['total']);
        $this->assertEquals(0, $resultado['completados']);
        $this->assertEquals(0.0, $resultado['porcentaje']);
    }

    #[Test]
    public function retorna_cero_cuando_estudiante_no_ha_resuelto_ningun_desafio(): void
    {
        $this->insertarDesafios(3);

        $resultado = $this->service->calcularProgresoDesafios($this->idCurso, $this->idEstudiante);

        $this->assertEquals(3, $resultado['total']);
        $this->assertEquals(0, $resultado['completados']);
        $this->assertEquals(0.0, $resultado['porcentaje']);
    }

    #[Test]
    public function calcula_correctamente_cuando_estudiante_completo_mitad_de_desafios(): void
    {
        $desafioIds = $this->insertarDesafios(4);
        $this->insertarSolucionAprobada($desafioIds[0]);
        $this->insertarSolucionAprobada($desafioIds[1]);

        $resultado = $this->service->calcularProgresoDesafios($this->idCurso, $this->idEstudiante);

        $this->assertEquals(4, $resultado['total']);
        $this->assertEquals(2, $resultado['completados']);
        $this->assertEquals(50.0, $resultado['porcentaje']);
    }

    #[Test]
    public function calcula_cien_por_ciento_cuando_todos_los_desafios_estan_aprobados(): void
    {
        $desafioIds = $this->insertarDesafios(3);
        foreach ($desafioIds as $id) {
            $this->insertarSolucionAprobada($id);
        }

        $resultado = $this->service->calcularProgresoDesafios($this->idCurso, $this->idEstudiante);

        $this->assertEquals(100.0, $resultado['porcentaje']);
    }

    #[Test]
    public function multiples_soluciones_del_mismo_desafio_cuentan_como_uno(): void
    {
        $desafioIds = $this->insertarDesafios(2);
        for ($i = 0; $i < 3; $i++) {
            DB::table('soluciones')->insert([
                'codigoFuente' => 'print("test")',
                'estado' => 'aprobado',
                'idEstudiante' => $this->idEstudiante,
                'idDesafio' => $desafioIds[0],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $resultado = $this->service->calcularProgresoDesafios($this->idCurso, $this->idEstudiante);

        $this->assertEquals(2, $resultado['total']);
        $this->assertEquals(1, $resultado['completados']);
        $this->assertEquals(50.0, $resultado['porcentaje']);
    }

    #[Test]
    public function desafios_pendientes_no_publicados_no_cuentan_en_el_total(): void
    {
        $this->insertarDesafios(2);
        DB::table('desafios')->insert([
            'titulo' => 'Desafío Pendiente',
            'descripcionProblema' => 'Problema pendiente',
            'dificultad' => 'Easy',
            'testCases' => json_encode([]),
            'salidaEsperada' => 'OK',
            'estado' => 'pendiente',
            'idCreador' => 99,
            'idCurso' => $this->idCurso,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $resultado = $this->service->calcularProgresoDesafios($this->idCurso, $this->idEstudiante);

        $this->assertEquals(2, $resultado['total']);
    }

    #[Test]
    public function retorna_cero_cuando_no_hay_materiales_en_el_curso(): void
    {
        $resultado = $this->service->calcularProgresoMateriales($this->idCurso, $this->idEstudiante);

        $this->assertEquals(0, $resultado['total']);
        $this->assertEquals(0, $resultado['vistos']);
        $this->assertEquals(0.0, $resultado['porcentaje']);
    }

    #[Test]
    public function calcula_correctamente_materiales_vistos(): void
    {
        $materialIds = $this->insertarMateriales(4);
        $this->marcarMaterialVisto($materialIds[0]);

        $resultado = $this->service->calcularProgresoMateriales($this->idCurso, $this->idEstudiante);

        $this->assertEquals(4, $resultado['total']);
        $this->assertEquals(1, $resultado['vistos']);
        $this->assertEquals(25.0, $resultado['porcentaje']);
    }

    #[Test]
    public function progreso_total_es_cero_sin_actividad(): void
    {
        $resultado = $this->service->calcularProgreso($this->idCurso, $this->idEstudiante);

        $this->assertEquals(0.0, $resultado['progreso_total']);
    }

    #[Test]
    public function progreso_total_pondera_correctamente_desafios_y_materiales(): void
    {
        $desafioIds = $this->insertarDesafios(2);
        $materialIds = $this->insertarMateriales(2);

        foreach ($desafioIds as $id) {
            $this->insertarSolucionAprobada($id);
        }
        $this->marcarMaterialVisto($materialIds[0]);

        $resultado = $this->service->calcularProgreso($this->idCurso, $this->idEstudiante);

        $this->assertEquals(80.0, $resultado['progreso_total']);
    }

    #[Test]
    public function progreso_total_es_cien_cuando_todo_esta_completado(): void
    {
        $desafioIds = $this->insertarDesafios(2);
        $materialIds = $this->insertarMateriales(2);

        foreach ($desafioIds as $id) {
            $this->insertarSolucionAprobada($id);
        }
        foreach ($materialIds as $id) {
            $this->marcarMaterialVisto($id);
        }

        $resultado = $this->service->calcularProgreso($this->idCurso, $this->idEstudiante);

        $this->assertEquals(100.0, $resultado['progreso_total']);
    }

    #[Test]
    public function estructura_de_respuesta_es_correcta(): void
    {
        $resultado = $this->service->calcularProgreso($this->idCurso, $this->idEstudiante);

        $this->assertArrayHasKey('idCurso', $resultado);
        $this->assertArrayHasKey('idEstudiante', $resultado);
        $this->assertArrayHasKey('progreso_total', $resultado);
        $this->assertArrayHasKey('desafios', $resultado);
        $this->assertArrayHasKey('materiales', $resultado);
        $this->assertArrayHasKey('completados', $resultado['desafios']);
        $this->assertArrayHasKey('total', $resultado['desafios']);
        $this->assertArrayHasKey('porcentaje', $resultado['desafios']);
        $this->assertArrayHasKey('vistos', $resultado['materiales']);
        $this->assertArrayHasKey('total', $resultado['materiales']);
        $this->assertArrayHasKey('porcentaje', $resultado['materiales']);
    }

    private function insertarDesafios(int $cantidad): array
    {
        $ids = [];
        for ($i = 1; $i <= $cantidad; $i++) {
            $ids[] = DB::table('desafios')->insertGetId([
                'titulo' => "Desafío {$i}",
                'descripcionProblema' => "Problema {$i}",
                'dificultad' => 'Easy',
                'testCases' => json_encode([]),
                'salidaEsperada' => 'OK',
                'estado' => 'publicado',
                'idCreador' => 99,
                'idCurso' => $this->idCurso,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $ids;
    }

    private function insertarSolucionAprobada(int $idDesafio): void
    {
        DB::table('soluciones')->insert([
            'codigoFuente' => 'print("OK")',
            'estado' => 'aprobado',
            'idEstudiante' => $this->idEstudiante,
            'idDesafio' => $idDesafio,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertarMateriales(int $cantidad): array
    {
        $ids = [];
        for ($i = 1; $i <= $cantidad; $i++) {
            $idMaterial = DB::table('materiales_aprendizaje')->insertGetId([
                'titulo' => "Material {$i}",
                'descripcion' => "Descripción {$i}",
                'tipo' => 'PDF',
                'enlaceArchivo' => "material_{$i}.pdf",
                'idUsuarioCreador' => 99,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('items_tema')->insert([
                'idTema' => 1,
                'itemable_type' => 'App\\Models\\MaterialAprendizaje',
                'itemable_id' => $idMaterial,
                'orden' => $i,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $ids[] = $idMaterial;
        }

        return $ids;
    }

    private function marcarMaterialVisto(int $idMaterial): void
    {
        DB::table('materiales_vistos')->insertOrIgnore([
            'idEstudiante' => $this->idEstudiante,
            'idMaterial' => $idMaterial,
            'visto_en' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
