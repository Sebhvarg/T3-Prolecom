<?php

namespace Tests\Feature;

use App\Models\Curso;
use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesAndStatesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthAndRBACTest extends TestCase
{
    use RefreshDatabase;

    private const TIPO_PUBLICO = 'público';

    private const API_CURSOS_ROUTE = '/api/cursos';

    private const API_REGISTER_ROUTE = '/api/register';

    private const ESTUDIANTE_EMAIL = 'estud_test@gmail.com';

    private const VALID_TEST_KEY = 'SecurePass123!';

    private const ESTUDIANTE_NOMBRE = 'Estudiante Prueba';

    protected ?Rol $adminRol = null;

    protected ?Rol $profesorRol = null;

    protected ?Rol $estudianteRol = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndStatesSeeder::class);

        $this->adminRol = Rol::find(1);
        $this->profesorRol = Rol::find(3);
        $this->estudianteRol = Rol::find(6);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes()
    {
        $response = $this->getJson('/api/user');
        $response->assertStatus(401);
    }

    private function createUserWithRole(Rol $role): User
    {
        $user = User::factory()->create();
        $user->roles()->attach($role->idRol);

        return $user;
    }

    private function actAsUserWithRole(Rol $role): User
    {
        $user = $this->createUserWithRole($role);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_student_cannot_create_course()
    {
        $this->actAsUserWithRole($this->estudianteRol);

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
        $professor = $this->actAsUserWithRole($this->profesorRol);

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
        $this->actAsUserWithRole($this->adminRol);

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
        $professorA = $this->createUserWithRole($this->profesorRol);
        $this->actAsUserWithRole($this->profesorRol);

        $course = Curso::create([
            'titulo' => 'Curso de A',
            'descripcion' => 'Original',
            'lp' => 'A',
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $professorA->idUsuario,
        ]);

        $response = $this->putJson("/api/cursos/{$course->idCurso}", [
            'titulo' => 'Curso Editado por B',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_edit_any_course()
    {
        $professor = $this->createUserWithRole($this->profesorRol);
        $this->actAsUserWithRole($this->adminRol);

        $course = Curso::create([
            'titulo' => 'Curso de Profesor',
            'descripcion' => 'Original',
            'lp' => 'A',
            'tipo' => self::TIPO_PUBLICO,
            'idProfeCreador' => $professor->idUsuario,
        ]);

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
            'password' => self::VALID_TEST_KEY,
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
            'password' => self::VALID_TEST_KEY,
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

    private function assertRegistrationFails(array $data, array $expectedErrors)
    {
        $response = $this->postJson(self::API_REGISTER_ROUTE, array_merge([
            'nombreCompleto' => self::ESTUDIANTE_NOMBRE,
            'usuario' => 'Estudtest',
            'email' => self::ESTUDIANTE_EMAIL,
            'password' => self::VALID_TEST_KEY,
            'rol' => 'Estudiante',
        ], $data));

        $response->assertStatus(400);
        $response->assertJsonValidationErrors($expectedErrors);
    }

    public function test_registration_fails_if_username_does_not_start_with_uppercase()
    {
        $this->assertRegistrationFails([
            'usuario' => 'estudTest',
        ], ['usuario']);
    }

    public function test_registration_fails_if_username_contains_spaces()
    {
        $this->assertRegistrationFails([
            'usuario' => 'Estud Test',
        ], ['usuario']);
    }

    public function test_registration_fails_if_username_exceeds_length_limit()
    {
        $this->assertRegistrationFails([
            'usuario' => 'Estudtestverylongusernamemorethan20chars',
        ], ['usuario']);
    }

    public function test_registration_fails_if_password_is_weak()
    {
        $this->assertRegistrationFails([
            'password' => 'weakpass',
        ], ['password']);
    }
}
