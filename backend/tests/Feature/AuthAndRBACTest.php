<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Rol;
use App\Models\EstadoCuenta;
use App\Models\Curso;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class AuthAndRBACTest extends TestCase
{
    use RefreshDatabase;

    protected $adminRol;
    protected $profesorRol;
    protected $estudianteRol;
    protected $activoEstado;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic roles and states for testing using DB table to bypass mass assignment guarding of IDs
        \Illuminate\Support\Facades\DB::table('estadosCuenta')->insertOrIgnore([
            'idEstado' => 1,
            'estado' => 'Activo'
        ]);

        \Illuminate\Support\Facades\DB::table('roles')->insertOrIgnore([
            ['idRol' => 1, 'rol' => 'Administrador'],
            ['idRol' => 3, 'rol' => 'Profesor'],
            ['idRol' => 6, 'rol' => 'Estudiante']
        ]);

        $this->adminRol = Rol::find(1);
        $this->profesorRol = Rol::find(3);
        $this->estudianteRol = Rol::find(6);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes()
    {
        $response = $this->getJson('/api/user');
        $response->assertStatus(401);
    }

    public function test_student_cannot_create_course()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        Sanctum::actingAs($student);

        $response = $this->postJson('/api/cursos', [
            'titulo' => 'Curso de Prueba',
            'descripcion' => 'Descripción',
            'lp' => 'Python',
            'tipo' => 'público'
        ]);

        $response->assertStatus(403);
    }

    public function test_professor_can_create_course()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        Sanctum::actingAs($professor);

        $response = $this->postJson('/api/cursos', [
            'titulo' => 'Curso de Python',
            'descripcion' => 'Aprende Python desde cero',
            'lp' => 'Python',
            'tipo' => 'público'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('cursos', [
            'titulo' => 'Curso de Python',
            'idProfeCreador' => $professor->idUsuario
        ]);
    }

    public function test_admin_can_create_course()
    {
        $admin = User::factory()->create();
        $admin->roles()->attach($this->adminRol->idRol);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/cursos', [
            'titulo' => 'Curso de Admin',
            'descripcion' => 'Aprende administración de sistemas',
            'lp' => 'Linux',
            'tipo' => 'público'
        ]);

        $response->assertStatus(201);
    }

    public function test_non_owner_professor_cannot_edit_course()
    {
        $professorA = User::factory()->create();
        $professorA->roles()->attach($this->profesorRol->idRol);

        $professorB = User::factory()->create();
        $professorB->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de A',
            'descripcion' => 'Original',
            'lp' => 'A',
            'tipo' => 'público',
            'idProfeCreador' => $professorA->idUsuario
        ]);

        Sanctum::actingAs($professorB);

        $response = $this->putJson("/api/cursos/{$course->idCurso}", [
            'titulo' => 'Curso Editado por B',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_edit_any_course()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $admin = User::factory()->create();
        $admin->roles()->attach($this->adminRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de Profesor',
            'descripcion' => 'Original',
            'lp' => 'A',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/cursos/{$course->idCurso}", [
            'titulo' => 'Curso Editado por Admin',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('cursos', [
            'idCurso' => $course->idCurso,
            'titulo' => 'Curso Editado por Admin'
        ]);
    }
}
