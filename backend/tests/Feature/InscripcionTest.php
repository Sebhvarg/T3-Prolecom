<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Rol;
use App\Models\Curso;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class InscripcionTest extends TestCase
{
    use RefreshDatabase;

    protected $adminRol;
    protected $profesorRol;
    protected $estudianteRol;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic roles and states for testing using DB table
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

    public function test_student_can_self_enroll_in_public_course()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de Python',
            'descripcion' => 'Aprende Python',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario
        ]);

        Sanctum::actingAs($student);

        $response = $this->postJson("/api/cursos/{$course->idCurso}/inscribir");

        $response->assertStatus(201);
        $this->assertDatabaseHas('inscripciones_cursos', [
            'idUsuarioEstudiante' => $student->idUsuario,
            'idCurso' => $course->idCurso
        ]);
    }

    public function test_student_cannot_self_enroll_in_private_course()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso Privado',
            'descripcion' => 'Solo invitados',
            'lp' => 'Java',
            'tipo' => 'privado',
            'idProfeCreador' => $professor->idUsuario
        ]);

        Sanctum::actingAs($student);

        $response = $this->postJson("/api/cursos/{$course->idCurso}/inscribir");

        $response->assertStatus(403);
        $this->assertDatabaseMissing('inscripciones_cursos', [
            'idUsuarioEstudiante' => $student->idUsuario,
            'idCurso' => $course->idCurso
        ]);
    }

    public function test_student_cannot_enroll_twice()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de JS',
            'descripcion' => 'Aprende JS',
            'lp' => 'JavaScript',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario
        ]);

        // Enroll first time
        $course->estudiantes()->attach($student->idUsuario, ['fechaInscripcion' => now()]);

        Sanctum::actingAs($student);

        // Attempt second time
        $response = $this->postJson("/api/cursos/{$course->idCurso}/inscribir");

        $response->assertStatus(400);
    }

    public function test_student_can_unenroll()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de C#',
            'descripcion' => 'Aprende C#',
            'lp' => 'C#',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario
        ]);

        $course->estudiantes()->attach($student->idUsuario, ['fechaInscripcion' => now()]);

        Sanctum::actingAs($student);

        $response = $this->deleteJson("/api/cursos/{$course->idCurso}/desmatricular");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('inscripciones_cursos', [
            'idUsuarioEstudiante' => $student->idUsuario,
            'idCurso' => $course->idCurso
        ]);
    }

    public function test_professor_can_manually_enroll_student()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso Manual',
            'descripcion' => 'Curso para matricular manualmente',
            'lp' => 'PHP',
            'tipo' => 'privado',
            'idProfeCreador' => $professor->idUsuario
        ]);

        Sanctum::actingAs($professor);

        $response = $this->postJson("/api/cursos/{$course->idCurso}/matricular-manual", [
            'email' => $student->email
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('inscripciones_cursos', [
            'idUsuarioEstudiante' => $student->idUsuario,
            'idCurso' => $course->idCurso
        ]);
    }

    public function test_student_cannot_manually_enroll_others()
    {
        $studentA = User::factory()->create();
        $studentA->roles()->attach($this->estudianteRol->idRol);

        $studentB = User::factory()->create();
        $studentB->roles()->attach($this->estudianteRol->idRol);

        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de Python',
            'descripcion' => 'Aprende Python',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario
        ]);

        Sanctum::actingAs($studentA);

        $response = $this->postJson("/api/cursos/{$course->idCurso}/matricular-manual", [
            'email' => $studentB->email
        ]);

        $response->assertStatus(403);
    }

    public function test_professor_can_manually_unenroll_student()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso Manual',
            'descripcion' => 'Curso para matricular manualmente',
            'lp' => 'PHP',
            'tipo' => 'privado',
            'idProfeCreador' => $professor->idUsuario
        ]);

        $course->estudiantes()->attach($student->idUsuario, ['fechaInscripcion' => now()]);

        Sanctum::actingAs($professor);

        $response = $this->deleteJson("/api/cursos/{$course->idCurso}/desmatricular", [
            'idUsuarioEstudiante' => $student->idUsuario
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('inscripciones_cursos', [
            'idUsuarioEstudiante' => $student->idUsuario,
            'idCurso' => $course->idCurso
        ]);
    }

    public function test_api_filters_courses_correctly()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $courseA = Curso::create([
            'titulo' => 'Curso A Python',
            'descripcion' => 'Python',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $professor->idUsuario
        ]);

        $courseB = Curso::create([
            'titulo' => 'Curso B JS',
            'descripcion' => 'JS',
            'lp' => 'JavaScript',
            'tipo' => 'privado',
            'idProfeCreador' => $professor->idUsuario
        ]);

        // Student is enrolled only in A
        $courseA->estudiantes()->attach($student->idUsuario, ['fechaInscripcion' => now()]);

        Sanctum::actingAs($student);

        // 1. Filter: mis_cursos
        $response = $this->getJson('/api/cursos?filtro=mis_cursos');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.idCurso', $courseA->idCurso);

        // 2. Filter: disponibles
        $response = $this->getJson('/api/cursos?filtro=disponibles');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.idCurso', $courseB->idCurso);

        // 3. Filter: lp
        $response = $this->getJson('/api/cursos?lp=Python');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.idCurso', $courseA->idCurso);

        // 4. Filter: tipo
        $response = $this->getJson('/api/cursos?tipo=privado');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.idCurso', $courseB->idCurso);
    }
}
