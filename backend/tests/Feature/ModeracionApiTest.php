<?php

namespace Tests\Feature;

use App\Models\Foro;
use App\Models\Pregunta;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ModeracionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_student_cannot_access_moderation_endpoints()
    {
        $estudiante = User::where('usuario', 'estudiante')->first();

        $response = $this->actingAs($estudiante)->getJson('/api/moderacion/stats');
        $response->assertStatus(403);

        $responseReportes = $this->actingAs($estudiante)->getJson('/api/moderacion/reportes');
        $responseReportes->assertStatus(403);
    }

    public function test_moderator_and_admin_can_access_stats_and_reportes()
    {
        $moderador = User::where('usuario', 'moderador')->first();
        $admin = User::where('usuario', 'admin')->first();

        $respMod = $this->actingAs($moderador)->getJson('/api/moderacion/stats');
        $respMod->assertStatus(200)
            ->assertJsonStructure(['pendientes', 'resueltos', 'contenidosOcultos', 'usuariosSancionados']);

        $respAdmin = $this->actingAs($admin)->getJson('/api/moderacion/reportes');
        $respAdmin->assertStatus(200);
    }

    public function test_moderator_can_resolve_and_hide_reported_pregunta()
    {
        $moderador = User::where('usuario', 'moderador')->first();
        $estudiante = User::where('usuario', 'estudiante')->first();

        $foro = Foro::first();
        $pregunta = Pregunta::create([
            'idForo' => $foro->idForo,
            'idUsuarioCreador' => $estudiante->idUsuario,
            'titulo' => 'Pregunta Inapropiada de Prueba',
            'descripcion' => 'Contenido indebido en el foro',
            'estado' => 'abierta',
        ]);

        $idReporte = DB::table('reportes')->insertGetId([
            'motivo' => 'Lenguaje ofensivo',
            'descripcion' => 'Insultos en la pregunta',
            'idUsuarioReportador' => $estudiante->idUsuario,
            'tipoPublicacion' => 'pregunta',
            'idPublicacionReportada' => $pregunta->idPregunta,
            'estado' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 1. Ocultar pregunta reportada
        $respOcultar = $this->actingAs($moderador)->postJson("/api/moderacion/reportes/{$idReporte}/ocultar");
        $respOcultar->assertStatus(200)->assertJson(['oculto' => true]);

        $this->assertEquals('oculta', $pregunta->fresh()->estado);

        // 2. Verificar que el reporte figura como resuelto
        $reporteActual = DB::table('reportes')->where('idReporte', $idReporte)->first();
        $this->assertEquals('resuelto', $reporteActual->estado);
    }

    public function test_moderator_can_ban_user()
    {
        $moderador = User::where('usuario', 'moderador')->first();
        $estudiante = User::where('usuario', 'estudiante')->first();

        $respBan = $this->actingAs($moderador)->postJson("/api/moderacion/usuarios/{$estudiante->idUsuario}/banear", [
            'idEstado' => 4, // 4 = Baneado
        ]);

        $respBan->assertStatus(200)
            ->assertJsonPath('usuario.idEstado', 4);

        $this->assertEquals(4, $estudiante->fresh()->idEstado);
    }
}
