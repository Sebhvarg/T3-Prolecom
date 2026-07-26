<?php

namespace Tests\Feature;

use App\Models\Curso;
use App\Models\Foro;
use App\Models\Notificacion;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Rol;
use App\Models\Tema;
use App\Models\User;
use Database\Seeders\RolesAndStatesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ForoAndNotificationFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected ?Rol $adminRol = null;
    protected ?Rol $profesorRol = null;
    protected ?Rol $ayudanteRol = null;
    protected ?Rol $estudianteRol = null;

    protected ?User $profesor = null;
    protected ?User $estudiante1 = null;
    protected ?User $estudiante2 = null;
    protected ?Curso $curso = null;
    protected ?Tema $tema = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndStatesSeeder::class);

        $this->adminRol = Rol::find(1);
        $this->profesorRol = Rol::find(3);
        $this->ayudanteRol = Rol::find(5);
        $this->estudianteRol = Rol::find(6);

        $this->profesor = $this->createUserWithRole($this->profesorRol, 'ProfePruebas');
        $this->estudiante1 = $this->createUserWithRole($this->estudianteRol, 'Estudiante1');
        $this->estudiante2 = $this->createUserWithRole($this->estudianteRol, 'Estudiante2');

        $this->curso = Curso::create([
            'titulo' => 'Curso de Testeo',
            'descripcion' => 'Descripción',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $this->profesor->idUsuario,
        ]);

        $this->tema = Tema::create([
            'nombre' => 'Tema 1: Pruebas',
            'descripcion' => 'Tema',
            'idCurso' => $this->curso->idCurso,
        ]);
    }

    private function createUserWithRole(Rol $role, string $namePrefix): User
    {
        $user = User::factory()->create([
            'nombreCompleto' => $namePrefix . ' ' . rand(100, 999),
        ]);
        $user->roles()->attach($role->idRol);

        return $user;
    }

    /**
     * Test 1: Crear Foro itemable dentro de un tema.
     */
    public function test_professor_can_create_foro_in_tema()
    {
        Sanctum::actingAs($this->profesor);

        $response = $this->postJson("/api/temas/{$this->tema->idTema}/foros", [
            'titulo' => 'Foro de Testeo Tema 1',
            'descripcion' => 'Descripción del foro de testeo',
        ]);

        $response->assertStatus(201);
        $idForo = $response->json('foro.idForo');

        $this->assertDatabaseHas('foros', [
            'idForo' => $idForo,
            'titulo' => 'Foro de Testeo Tema 1',
            'estado' => 'abierto',
        ]);

        $this->assertDatabaseHas('items_tema', [
            'idTema' => $this->tema->idTema,
            'itemable_type' => Foro::class,
            'itemable_id' => $idForo,
        ]);
    }

    /**
     * Test 2: Publicar respuesta genera notificación en-app al autor de la pregunta.
     */
    public function test_answering_question_triggers_notification_to_question_author()
    {
        $foro = Foro::create([
            'titulo' => 'Foro Notificaciones',
            'idUsuarioCreador' => $this->profesor->idUsuario,
            'estado' => 'abierto',
        ]);

        // Estudiante 1 hace pregunta
        $pregunta = Pregunta::create([
            'titulo' => '¿Cómo funciona la notificación?',
            'descripcion' => 'Consulta',
            'idUsuarioCreador' => $this->estudiante1->idUsuario,
            'idForo' => $foro->idForo,
            'estado' => 'abierta',
        ]);

        // Estudiante 2 responde
        Sanctum::actingAs($this->estudiante2);
        $response = $this->postJson("/api/preguntas/{$pregunta->idPregunta}/respuestas", [
            'contenido' => 'Te notificará al autor.',
        ]);

        $response->assertStatus(201);

        // Se debe haber creado una notificación para estudiante 1
        $this->assertDatabaseHas('notificaciones', [
            'idUsuario' => $this->estudiante1->idUsuario,
            'tipo' => Notificacion::TIPO_NUEVA_RESPUESTA,
            'leida' => false,
        ]);
    }

    /**
     * Test 3: Validar respuesta como Oficial genera notificación al autor de la respuesta.
     */
    public function test_validating_answer_triggers_notification_to_answer_author()
    {
        $foro = Foro::create([
            'titulo' => 'Foro Notificaciones 2',
            'idUsuarioCreador' => $this->profesor->idUsuario,
            'estado' => 'abierto',
        ]);

        $pregunta = Pregunta::create([
            'titulo' => 'Pregunta oficial',
            'descripcion' => 'Consulta',
            'idUsuarioCreador' => $this->estudiante1->idUsuario,
            'idForo' => $foro->idForo,
            'estado' => 'abierta',
        ]);

        $respuesta = Respuesta::create([
            'contenido' => 'Respuesta excelente',
            'idUsuario' => $this->estudiante2->idUsuario,
            'idPregunta' => $pregunta->idPregunta,
            'validada' => false,
        ]);

        // Profesor valida la respuesta
        Sanctum::actingAs($this->profesor);
        $response = $this->putJson("/api/respuestas/{$respuesta->idRespuesta}/validar");

        $response->assertStatus(200);

        // Se debe haber creado una notificación para estudiante 2
        $this->assertDatabaseHas('notificaciones', [
            'idUsuario' => $this->estudiante2->idUsuario,
            'tipo' => Notificacion::TIPO_RESPUESTA_VALIDADA,
            'leida' => false,
        ]);
    }

    /**
     * Test 4: Sistema de Votos (Like/Dislike) con toggle y prohibición de votar propia respuesta.
     */
    public function test_voting_system_like_dislike_and_toggle()
    {
        $foro = Foro::create([
            'titulo' => 'Foro Votos',
            'idUsuarioCreador' => $this->profesor->idUsuario,
            'estado' => 'abierto',
        ]);

        $pregunta = Pregunta::create([
            'titulo' => 'Pregunta votos',
            'descripcion' => 'Consulta',
            'idUsuarioCreador' => $this->estudiante1->idUsuario,
            'idForo' => $foro->idForo,
            'estado' => 'abierta',
        ]);

        $respuesta = Respuesta::create([
            'contenido' => 'Respuesta para votar',
            'idUsuario' => $this->estudiante1->idUsuario,
            'idPregunta' => $pregunta->idPregunta,
            'validada' => false,
        ]);

        // 1. Estudiante 1 intenta votar su propia respuesta -> 403 Forbidden
        Sanctum::actingAs($this->estudiante1);
        $selfVote = $this->postJson("/api/respuestas/{$respuesta->idRespuesta}/votar", ['tipo' => 'like']);
        $selfVote->assertStatus(403);

        // 2. Estudiante 2 le da Like -> 200 OK (likes_count = 1)
        Sanctum::actingAs($this->estudiante2);
        $vote1 = $this->postJson("/api/respuestas/{$respuesta->idRespuesta}/votar", ['tipo' => 'like']);
        $vote1->assertStatus(200);
        $vote1->assertJson(['likes_count' => 1, 'dislikes_count' => 0, 'mi_voto' => 'like']);

        // 3. Estudiante 2 hace clic en Like de nuevo -> Toggle (elimina voto, mi_voto = null)
        $voteToggle = $this->postJson("/api/respuestas/{$respuesta->idRespuesta}/votar", ['tipo' => 'like']);
        $voteToggle->assertStatus(200);
        $voteToggle->assertJson(['likes_count' => 0, 'dislikes_count' => 0, 'mi_voto' => null]);

        // 4. Estudiante 2 le da Dislike -> (dislikes_count = 1)
        $voteDislike = $this->postJson("/api/respuestas/{$respuesta->idRespuesta}/votar", ['tipo' => 'dislike']);
        $voteDislike->assertStatus(200);
        $voteDislike->assertJson(['likes_count' => 0, 'dislikes_count' => 1, 'mi_voto' => 'dislike']);
    }

    /**
     * Test 5: Endpoints de Notificaciones (listar, marcar leída, marcar todas leídas).
     */
    public function test_notification_endpoints_index_and_read()
    {
        Notificacion::crear($this->estudiante1->idUsuario, 'nueva_respuesta', 'Título 1', 'Mensaje 1');
        Notificacion::crear($this->estudiante1->idUsuario, 'respuesta_validada', 'Título 2', 'Mensaje 2');

        Sanctum::actingAs($this->estudiante1);

        // Listar notificaciones
        $index = $this->getJson('/api/notificaciones');
        $index->assertStatus(200);
        $this->assertEquals(2, count($index->json('data')));

        $idNotif = $index->json('data.0.idNotificacion');

        // Marcar una como leída
        $read1 = $this->patchJson("/api/notificaciones/{$idNotif}/leer");
        $read1->assertStatus(200);

        $this->assertDatabaseHas('notificaciones', [
            'idNotificacion' => $idNotif,
            'leida' => true,
        ]);

        // Marcar todas como leídas
        $readAll = $this->patchJson('/api/notificaciones/leer-todas');
        $readAll->assertStatus(200);

        $this->assertEquals(0, Notificacion::where('idUsuario', $this->estudiante1->idUsuario)->where('leida', false)->count());
    }
}
