<?php

namespace Tests\Feature;

use App\Models\Curso;
use App\Models\MaterialAprendizaje;
use App\Models\Tema;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MaterialAndAuditTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_professor_can_update_material_title_and_file()
    {
        Storage::fake('local');

        $profe = User::where('usuario', 'profesor')->first();

        $curso = Curso::create([
            'titulo' => 'Curso de Python Test',
            'descripcion' => 'Aprende Python',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $profe->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => 'Tema Test 1',
            'titulo' => 'Tema Test 1',
            'descripcion' => 'Intro',
            'idCurso' => $curso->idCurso,
            'idProfeCreador' => $profe->idUsuario,
        ]);

        $pdf = UploadedFile::fake()->create('guia_original.pdf', 100, 'application/pdf');

        $this->actingAs($profe, 'sanctum')
            ->postJson("/api/temas/{$tema->idTema}/materiales", [
                'titulo' => 'Guia 1',
                'tipo' => 'PDF',
                'archivo' => $pdf,
            ]);

        $material = MaterialAprendizaje::first();

        $newPdf = UploadedFile::fake()->create('guia_nueva.pdf', 200, 'application/pdf');

        $response = $this->actingAs($profe, 'sanctum')
            ->putJson("/api/materiales/{$material->idMaterial}", [
                'titulo' => 'Guia 1 Actualizada',
                'tipo' => 'PDF',
                'archivo' => $newPdf,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('materiales_aprendizaje', [
            'idMaterial' => $material->idMaterial,
            'titulo' => 'Guia 1 Actualizada',
        ]);
        $this->assertDatabaseHas('auditorias', [
            'accion' => 'editar_material',
            'idUsuario' => $profe->idUsuario,
        ]);
    }

    public function test_moderator_can_view_audit_logs()
    {
        $moderador = User::where('usuario', 'moderador')->first();

        AuditLogService::log('test_accion', 'TestEntity', 1, 'Detalles de prueba');

        $response = $this->actingAs($moderador)
            ->getJson('/api/moderacion/auditoria');

        $response->assertStatus(200)
            ->assertJsonFragment(['accion' => 'test_accion']);
    }
}
