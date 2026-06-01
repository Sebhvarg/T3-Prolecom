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

    public function test_authenticated_student_cannot_create_a_course()
    {
        $student = Usuario::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        Sanctum::actingAs($student);

        $response = $this->postJson('/api/cursos', [
            'titulo' => 'Nuevo Curso',
            'descripcion' => 'Descripción',
            'lp' => 'PHP',
            'tipo' => 'público'
        ]);

        $response->assertStatus(403);
    }

    public function test_authenticated_profesor_can_create_a_course()
    {
        $profesor = Usuario::factory()->create();
        $profesor->roles()->attach($this->profesorRol->idRol);

        Sanctum::actingAs($profesor);

        $response = $this->postJson('/api/cursos', [
            'titulo' => 'Curso de Prueba',
            'descripcion' => 'Este es un curso de prueba',
            'lp' => 'Laravel',
            'tipo' => 'público'
        ]);

        $response->assertStatus(201);
    }

    public function test_authenticated_admin_can_access_admin_routes()
    {
        $admin = Usuario::factory()->create();
        $admin->roles()->attach($this->adminRol->idRol);

        Sanctum::actingAs($admin);

        // Crear un curso para poder listar temas
        $curso = \App\Models\Curso::create([
            'titulo' => 'Curso Admin',
            'descripcion' => 'Desc',
            'lp' => 'Java',
            'idProfeCreador' => $admin->idUsuario
        ]);

        $response = $this->getJson('/api/temas?idCurso=' . $curso->idCurso);
        $response->assertStatus(200);
    }
}
