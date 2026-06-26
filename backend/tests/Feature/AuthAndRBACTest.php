<?php

namespace Tests\Feature;

use App\Models\Curso;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthAndRBACTest extends TestCase
{
    use RefreshDatabase;

    private const TIPO_PUBLICO = 'público';

    private const API_CURSOS_ROUTE = '/api/cursos';

    private const API_REGISTER_ROUTE = '/api/register';

    private const ESTUDIANTE_EMAIL = 'estud_test@gmail.com';

    private const PASSWORD_VALIDO = 'SecurePass123!';

    private const ESTUDIANTE_NOMBRE = 'Estudiante Prueba';

    protected $adminRol;

    protected $profesorRol;

    protected $estudianteRol;

    protected $activoEstado;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic roles and states for testing using DB table to bypass mass assignment guarding of IDs
        DB::table('estadosCuenta')->insertOrIgnore([
            'idEstado' => 1,
            'estado' => 'Activo',
        ]);

        DB::table('roles')->insertOrIgnore([
            ['idRol' => 1, 'rol' => 'Administrador'],
            ['idRol' => 3, 'rol' => 'Profesor'],
            ['idRol' => 6, 'rol' => 'Estudiante'],
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

        $response = $this->postJson(self::API_CURSOS_ROUTE, [
            'titulo' => 'Curso de Prueba',
            'descripcion' => 'Descripción',
            'lp' => 'Python',
            'tipo' => self::TIPO_PUBLICO,
        ]);

        $response->assertStatus(403);
    }

    public function test_professor_can_create_course()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        Sanctum::actingAs($professor);

        $response = $this->postJson(self::API_CURSOS_ROUTE, [
            'titulo' => 'Curso de Python',
            'descripcion' => 'Aprende Python desde cero',
            'lp' => 'Python',
            'tipo' => self::TIPO_PUBLICO,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('cursos', [
            'titulo' => 'Curso de Python',
            'idProfeCreador' => $professor->idUsuario,
        ]);
    }

    public function test_admin_can_create_course()
    {
        $admin = User::factory()->create();
        $admin->roles()->attach($this->adminRol->idRol);

        Sanctum::actingAs($admin);

        $response = $this->postJson(self::API_CURSOS_ROUTE, [
            'titulo' => 'Curso de Admin',
            'descripcion' => 'Aprende administración de sistemas',
            'lp' => 'Linux',
            'tipo' => self::TIPO_PUBLICO,
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
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $professorA->idUsuario,
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
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/cursos/{$course->idCurso}", [
            'titulo' => 'Curso Editado por Admin',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('cursos', [
            'idCurso' => $course->idCurso,
            'titulo' => 'Curso Editado por Admin',
        ]);
    }

    public function test_user_can_register_as_professor()
    {
        $response = $this->postJson(self::API_REGISTER_ROUTE, [
            'nombreCompleto' => 'Profesor de Prueba',
            'usuario' => 'ProfeTest',
            'email' => 'profe_test@gmail.com',
            'password' => self::PASSWORD_VALIDO,
            'fechaDeNacimiento' => '1980-05-15',
            'rol' => 'Profesor',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'token',
            'user' => [
                'idUsuario',
                'nombreCompleto',
                'usuario',
                'email',
                'rol',
                'id_rol',
                'rutas',
            ],
        ]);

        $this->assertDatabaseHas('usuarios', [
            'usuario' => 'ProfeTest',
            'email' => 'profe_test@gmail.com',
        ]);

        // Verificar que el rol asignado sea el idRol 3 (Profesor)
        $userId = $response->json('user.idUsuario');
        $this->assertDatabaseHas('rolUsuario', [
            'idUsuario' => $userId,
            'idRol' => 3,
        ]);
    }

    public function test_user_can_register_as_student()
    {
        $response = $this->postJson(self::API_REGISTER_ROUTE, [
            'nombreCompleto' => 'Estudiante de Prueba',
            'usuario' => 'EstudTest',
            'email' => self::ESTUDIANTE_EMAIL,
            'password' => self::PASSWORD_VALIDO,
            'fechaDeNacimiento' => '2005-10-20',
            'rol' => 'Estudiante',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'token',
            'user' => [
                'idUsuario',
                'nombreCompleto',
                'usuario',
                'email',
                'rol',
                'id_rol',
                'rutas',
            ],
        ]);

        $this->assertDatabaseHas('usuarios', [
            'usuario' => 'EstudTest',
            'email' => self::ESTUDIANTE_EMAIL,
        ]);

        // Verificar que el rol asignado sea el idRol 6 (Estudiante)
        $userId = $response->json('user.idUsuario');
        $this->assertDatabaseHas('rolUsuario', [
            'idUsuario' => $userId,
            'idRol' => 6,
        ]);
    }

    public function test_registration_validation_fails_with_missing_fields()
    {
        $response = $this->postJson(self::API_REGISTER_ROUTE, []);
        $response->assertStatus(400);
        $response->assertJsonStructure([
            'errors' => [
                'nombreCompleto',
                'usuario',
                'email',
                'password',
                'rol',
            ],
        ]);
    }

    public function test_registration_fails_if_username_does_not_start_with_uppercase()
    {
        $response = $this->postJson(self::API_REGISTER_ROUTE, [
            'nombreCompleto' => self::ESTUDIANTE_NOMBRE,
            'usuario' => 'estudTest',
            'email' => self::ESTUDIANTE_EMAIL,
            'password' => self::PASSWORD_VALIDO,
            'rol' => 'Estudiante',
        ]);

        $response->assertStatus(400);
        $response->assertJsonValidationErrors(['usuario']);
    }

    public function test_registration_fails_if_username_contains_spaces()
    {
        $response = $this->postJson(self::API_REGISTER_ROUTE, [
            'nombreCompleto' => self::ESTUDIANTE_NOMBRE,
            'usuario' => 'Estud Test',
            'email' => self::ESTUDIANTE_EMAIL,
            'password' => self::PASSWORD_VALIDO,
            'rol' => 'Estudiante',
        ]);

        $response->assertStatus(400);
        $response->assertJsonValidationErrors(['usuario']);
    }

    public function test_registration_fails_if_username_exceeds_length_limit()
    {
        $response = $this->postJson(self::API_REGISTER_ROUTE, [
            'nombreCompleto' => self::ESTUDIANTE_NOMBRE,
            'usuario' => 'Estudtestverylongusernamemorethan20chars',
            'email' => self::ESTUDIANTE_EMAIL,
            'password' => self::PASSWORD_VALIDO,
            'rol' => 'Estudiante',
        ]);

        $response->assertStatus(400);
        $response->assertJsonValidationErrors(['usuario']);
    }

    public function test_registration_fails_if_password_is_weak()
    {
        $response = $this->postJson(self::API_REGISTER_ROUTE, [
            'nombreCompleto' => self::ESTUDIANTE_NOMBRE,
            'usuario' => 'Estudtest',
            'email' => self::ESTUDIANTE_EMAIL,
            'password' => 'weakpass',
            'rol' => 'Estudiante',
        ]);

        $response->assertStatus(400);
        $response->assertJsonValidationErrors(['password']);
    }
}
