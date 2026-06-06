<?php

namespace Tests\Feature;

use App\Models\Usuario;
use App\Models\Rol;
use App\Models\EstadoCuenta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class AuthAndRBACTest extends TestCase
{
    use RefreshDatabase;

    protected $adminRol;
    protected $profesorRol;
    protected $estudianteRol;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic roles for testing
        $this->adminRol = Rol::firstOrCreate(['rol' => 'Administrador']);
        $this->profesorRol = Rol::firstOrCreate(['rol' => 'Profesor']);
        $this->estudianteRol = Rol::firstOrCreate(['rol' => 'Estudiante']);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes()
    {
        $response = $this->getJson('/api/user');
        $response->assertStatus(401);
    }
}
