<?php

namespace Tests\Feature;

use App\Models\Curso;
use App\Models\Foro;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Rol;
use App\Models\Tema;
use App\Models\User;
use Database\Seeders\RolesAndStatesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ForoRBACTest extends TestCase
{
    use RefreshDatabase;

    protected ?Rol $adminRol = null;
    protected ?Rol $profesorRol = null;
    protected ?Rol $ayudanteRol = null;
    protected ?Rol $estudianteRol = null;
    protected ?Curso $curso = null;
    protected ?Tema $tema = null;
    protected ?Foro $foro = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndStatesSeeder::class);

        $this->adminRol = Rol::find(1);      // Administrador
        $this->profesorRol = Rol::find(3);   // Profesor
        $this->ayudanteRol = Rol::find(5);   // Ayudante
        $this->estudianteRol = Rol::find(6); // Estudiante

        $profesor = $this->createUserWithRole($this->profesorRol);
        $this->curso = Curso::create([
            'titulo' => 'Curso de Demostración PB16',
            'descripcion' => 'Descripción del curso',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $profesor->idUsuario,
        ]);

        $this->tema = Tema::create([
            'nombre' => 'Tema 1: Fundamentos',
            'descripcion' => 'Descripción del tema',
            'idCurso' => $this->curso->idCurso,
        ]);

        $this->foro = Foro::create([
            'titulo' => 'Foro de Preguntas Tema 1',
            'descripcion' => 'Espacio Q&A',
            'idUsuarioCreador' => $profesor->idUsuario,
            'estado' => 'abierto',
        ]);
    }

    private function createUserWithRole(Rol $role): User
    {
        $user = User::factory()->create();
        $user->roles()->attach($role->idRol);

        return $user;
    }

    public function test_authenticated_user_can_create_question_and_answer()
    {
        $student = $this->createUserWithRole($this->estudianteRol);
        Sanctum::actingAs($student);

        // 1. Crear Pregunta en el Foro
        $respPregunta = $this->postJson("/api/foros/{$this->foro->idForo}/preguntas", [
            'titulo' => '¿Cómo funciona la validación de respuestas?',
            'descripcion' => 'Tengo dudas sobre cómo los profesores validan una respuesta.',
        ]);

        $respPregunta->assertStatus(201);
        $idPregunta = $respPregunta->json('idPregunta');

        $this->assertDatabaseHas('preguntas', [
            'idPregunta' => $idPregunta,
            'titulo' => '¿Cómo funciona la validación de respuestas?',
            'idUsuarioCreador' => $student->idUsuario,
            'idForo' => $this->foro->idForo,
            'estado' => 'abierta',
        ]);

        // 2. Responder a la pregunta
        $respRespuesta = $this->postJson("/api/preguntas/{$idPregunta}/respuestas", [
            'contenido' => 'La validación marca una respuesta como oficial.',
        ]);

        $respRespuesta->assertStatus(201);
        $idRespuesta = $respRespuesta->json('idRespuesta');

        $this->assertDatabaseHas('respuestas', [
            'idRespuesta' => $idRespuesta,
            'validada' => false,
        ]);
    }

    public function test_student_cannot_validate_answer()
    {
        $student = $this->createUserWithRole($this->estudianteRol);

        $pregunta = Pregunta::create([
            'titulo' => 'Duda estudiante',
            'descripcion' => 'Detalle',
            'idUsuarioCreador' => $student->idUsuario,
            'idForo' => $this->foro->idForo,
            'estado' => 'abierta',
        ]);

        $respuesta = Respuesta::create([
            'contenido' => 'Respuesta estudiante',
            'idUsuario' => $student->idUsuario,
            'idPregunta' => $pregunta->idPregunta,
            'validada' => false,
        ]);

        Sanctum::actingAs($student);

        $response = $this->putJson("/api/respuestas/{$respuesta->idRespuesta}/validar");

        $response->assertStatus(403);
        $this->assertDatabaseHas('respuestas', [
            'idRespuesta' => $respuesta->idRespuesta,
            'validada' => false,
        ]);
    }

    public function test_instructor_can_validate_answer()
    {
        $student = $this->createUserWithRole($this->estudianteRol);
        $profesor = $this->createUserWithRole($this->profesorRol);

        $pregunta = Pregunta::create([
            'titulo' => 'Duda estudiante',
            'descripcion' => 'Detalle',
            'idUsuarioCreador' => $student->idUsuario,
            'idForo' => $this->foro->idForo,
            'estado' => 'abierta',
        ]);

        $respuesta = Respuesta::create([
            'contenido' => 'Respuesta correcta del profesor',
            'idUsuario' => $profesor->idUsuario,
            'idPregunta' => $pregunta->idPregunta,
            'validada' => false,
        ]);

        Sanctum::actingAs($profesor);

        $response = $this->putJson("/api/respuestas/{$respuesta->idRespuesta}/validar");

        $response->assertStatus(200);
        $response->assertJson([
            'respuesta' => [
                'idRespuesta' => $respuesta->idRespuesta,
                'validada' => true,
            ],
        ]);

        $this->assertDatabaseHas('respuestas', [
            'idRespuesta' => $respuesta->idRespuesta,
            'validada' => true,
        ]);

        // La pregunta pasa a estar resuelta
        $this->assertDatabaseHas('preguntas', [
            'idPregunta' => $pregunta->idPregunta,
            'estado' => 'resuelta',
        ]);
    }

    public function test_ta_ayudante_can_validate_answer()
    {
        $student = $this->createUserWithRole($this->estudianteRol);
        $ayudante = $this->createUserWithRole($this->ayudanteRol);

        $pregunta = Pregunta::create([
            'titulo' => 'Duda sobre tarea',
            'descripcion' => '¿Cuándo se entrega?',
            'idUsuarioCreador' => $student->idUsuario,
            'idForo' => $this->foro->idForo,
            'estado' => 'abierta',
        ]);

        $respuesta = Respuesta::create([
            'contenido' => 'Respuesta oficial del ayudante',
            'idUsuario' => $ayudante->idUsuario,
            'idPregunta' => $pregunta->idPregunta,
            'validada' => false,
        ]);

        Sanctum::actingAs($ayudante);

        $response = $this->putJson("/api/respuestas/{$respuesta->idRespuesta}/validar");

        $response->assertStatus(200);
        $this->assertDatabaseHas('respuestas', [
            'idRespuesta' => $respuesta->idRespuesta,
            'validada' => true,
        ]);
    }
}
