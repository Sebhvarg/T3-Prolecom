<?php

namespace Tests\Unit;

use App\Models\LogActividad;
use App\Models\User;
use App\Services\Dashboards\AdminDashboard;
use Database\Seeders\RolesAndStatesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupportAndAdminUnitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndStatesSeeder::class);
    }

    public function test_log_actividad_belongs_to_usuario()
    {
        $user = User::factory()->create(['idEstado' => 1]);

        $log = LogActividad::create([
            'accion' => 'Prueba de log de usuario',
            'idUsuario' => $user->idUsuario,
        ]);

        $this->assertInstanceOf(User::class, $log->usuario);
        $this->assertEquals($user->idUsuario, $log->usuario->idUsuario);
        $this->assertEquals('Prueba de log de usuario', $log->accion);
    }

    public function test_admin_dashboard_service_computes_widget_metrics()
    {
        User::factory()->create(['idEstado' => 1]);

        $dashboard = new AdminDashboard();
        $data = $dashboard->getData();

        $this->assertArrayHasKey('widgets', $data);
        $this->assertArrayHasKey('total_usuarios', $data['widgets']);
        $this->assertArrayHasKey('usuarios_activos', $data['widgets']);
        $this->assertArrayHasKey('total_cursos', $data['widgets']);
        $this->assertGreaterThanOrEqual(1, $data['widgets']['total_usuarios']);
    }

    public function test_user_status_can_be_updated_to_inactive_or_banned()
    {
        $user = User::factory()->create(['idEstado' => 1]);
        $this->assertEquals(1, $user->idEstado);

        $user->idEstado = 2; // Inactivo
        $user->save();

        $this->assertEquals(2, $user->fresh()->idEstado);
        $this->assertEquals('Inactivo', $user->fresh()->estado->estado);
    }
}
