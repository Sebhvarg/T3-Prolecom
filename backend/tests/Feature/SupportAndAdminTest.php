<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesAndStatesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupportAndAdminTest extends TestCase
{
    use RefreshDatabase;

    protected ?Rol $adminRol = null;

    protected ?Rol $soporteRol = null;

    protected ?Rol $estudianteRol = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndStatesSeeder::class);

        $this->adminRol = Rol::find(1); // Administrador
        $this->soporteRol = Rol::find(4); // Soporte
        $this->estudianteRol = Rol::find(6); // Estudiante
    }

    private function createUserWithRole(Rol $role): User
    {
        $user = User::factory()->create(['idEstado' => 1]);
        $user->roles()->attach($role->idRol);

        return $user;
    }

    private function actAsUserWithRole(Rol $role): User
    {
        $user = $this->createUserWithRole($role);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_admin_can_list_users()
    {
        $this->actAsUserWithRole($this->adminRol);

        $response = $this->getJson('/api/admin/usuarios');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'users',
            'availableRoles',
            'availableStates',
        ]);
    }

    public function test_soporte_can_list_users()
    {
        $this->actAsUserWithRole($this->soporteRol);

        $response = $this->getJson('/api/admin/usuarios');
        $response->assertStatus(200);
    }

    public function test_student_cannot_access_admin_user_list()
    {
        $this->actAsUserWithRole($this->estudianteRol);

        $response = $this->getJson('/api/admin/usuarios');
        $response->assertStatus(403);
    }

    public function test_admin_can_update_user_role()
    {
        $this->actAsUserWithRole($this->adminRol);
        $student = $this->createUserWithRole($this->estudianteRol);

        // Cambiar rol de estudiante a Profesor (idRol 3)
        $response = $this->putJson("/api/admin/usuarios/{$student->idUsuario}/roles", [
            'idRol' => 3,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('rolUsuario', [
            'idUsuario' => $student->idUsuario,
            'idRol' => 3,
        ]);
    }

    public function test_admin_can_update_user_account_state()
    {
        $this->actAsUserWithRole($this->adminRol);
        $student = $this->createUserWithRole($this->estudianteRol);

        // Cambiar estado a Inactivo (idEstado 2) / Deshabilitado
        $response = $this->putJson("/api/admin/usuarios/{$student->idUsuario}/estado", [
            'idEstado' => 2,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('usuarios', [
            'idUsuario' => $student->idUsuario,
            'idEstado' => 2,
        ]);
    }

    public function test_admin_can_reset_user_password()
    {
        $this->actAsUserWithRole($this->adminRol);
        $student = $this->createUserWithRole($this->estudianteRol);

        $response = $this->putJson("/api/admin/usuarios/{$student->idUsuario}/reset-password", [
            'password' => 'NewSecurePassword123!',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Contraseña del usuario restablecida exitosamente',
        ]);
    }

    public function test_admin_can_view_health_and_error_logs()
    {
        $this->actAsUserWithRole($this->adminRol);

        $response = $this->getJson('/api/admin/logs');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'health' => [
                'database',
                'php_version',
                'memory_usage',
                'server_time',
            ],
            'summary' => [
                'errors',
                'warnings',
                'info',
                'total',
            ],
            'logs',
        ]);
    }
}
