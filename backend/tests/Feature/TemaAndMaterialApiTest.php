<?php

namespace Tests\Feature;

use App\Models\Curso;
use App\Models\ItemTema;
use App\Models\MaterialAprendizaje;
use App\Models\Rol;
use App\Models\Tema;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TemaAndMaterialApiTest extends TestCase
{
    use RefreshDatabase;

    private const COURSE_TITLE = 'Curso de PHP';

    private const COURSE_DESC = 'PHP testing';

    private const COURSE_TYPE = 'público';

    private const TEMA_NAME = 'Tema 1';

    private const MIME_PDF = 'application/pdf';

    protected $adminRol;

    protected $profesorRol;

    protected $estudianteRol;

    protected function setUp(): void
    {
        parent::setUp();

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

        Storage::fake('local');
    }

    public function test_professor_can_create_tema_in_their_own_course()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de Testing',
            'descripcion' => 'Pruebas con Laravel',
            'lp' => 'PHP',
            'tipo' => self::COURSE_TYPE,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        Sanctum::actingAs($professor);

        $response = $this->postJson("/api/cursos/{$course->idCurso}/temas", [
            'nombre' => 'Tema 1: Conceptos Básicos',
            'descripcion' => 'Introducción general',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('temas', [
            'nombre' => 'Tema 1: Conceptos Básicos',
            'idCurso' => $course->idCurso,
        ]);
    }

    public function test_student_cannot_create_tema()
    {
        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => 'Curso de Testing',
            'descripcion' => 'Pruebas con Laravel',
            'lp' => 'PHP',
            'tipo' => self::COURSE_TYPE,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        Sanctum::actingAs($student);

        $response = $this->postJson("/api/cursos/{$course->idCurso}/temas", [
            'nombre' => 'Tema del Estudiante',
        ]);

        $response->assertStatus(403);
    }

    public function test_professor_can_upload_material()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => self::COURSE_TITLE,
            'descripcion' => self::COURSE_DESC,
            'lp' => 'PHP',
            'tipo' => self::COURSE_TYPE,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => self::TEMA_NAME,
            'idCurso' => $course->idCurso,
        ]);

        Sanctum::actingAs($professor);

        $file = UploadedFile::fake()->create('guia.pdf', 1000, self::MIME_PDF);

        $response = $this->postJson("/api/temas/{$tema->idTema}/materiales", [
            'titulo' => 'Documento Guía',
            'descripcion' => 'Material PDF',
            'tipo' => 'PDF',
            'archivo' => $file,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('materiales_aprendizaje', [
            'titulo' => 'Documento Guía',
            'tipo' => 'PDF',
        ]);

        $material = MaterialAprendizaje::first();
        Storage::disk('local')->assertExists($material->enlaceArchivo);

        $this->assertDatabaseHas('items_tema', [
            'idTema' => $tema->idTema,
            'itemable_type' => MaterialAprendizaje::class,
            'itemable_id' => $material->idMaterial,
        ]);
    }

    public function test_material_validation_mimetype_and_size()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => self::COURSE_TITLE,
            'descripcion' => self::COURSE_DESC,
            'lp' => 'PHP',
            'tipo' => self::COURSE_TYPE,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => self::TEMA_NAME,
            'idCurso' => $course->idCurso,
        ]);

        Sanctum::actingAs($professor);

        // Test invalid mimetype (e.g. php file or exe)
        $invalidFile = UploadedFile::fake()->create('malicious.exe', 500, 'application/octet-stream');
        $response = $this->postJson("/api/temas/{$tema->idTema}/materiales", [
            'titulo' => 'Malicious File',
            'tipo' => 'PDF',
            'archivo' => $invalidFile,
        ]);
        $response->assertStatus(400);

        // Test file too large (config default max_size is 30720 KB = 30MB)
        $largeFile = UploadedFile::fake()->create('huge_video.mp4', 40000, 'video/mp4'); // 40MB
        $response = $this->postJson("/api/temas/{$tema->idTema}/materiales", [
            'titulo' => 'Large Video',
            'tipo' => 'video',
            'archivo' => $largeFile,
        ]);
        $response->assertStatus(400);
    }

    public function test_enrolled_student_can_stream_and_download_material()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $course = Curso::create([
            'titulo' => self::COURSE_TITLE,
            'descripcion' => self::COURSE_DESC,
            'lp' => 'PHP',
            'tipo' => self::COURSE_TYPE,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        // Enroll student
        $course->estudiantes()->attach($student->idUsuario, ['fechaInscripcion' => now()]);

        $tema = Tema::create([
            'nombre' => self::TEMA_NAME,
            'idCurso' => $course->idCurso,
        ]);

        // Save a mock file in local disk
        $path = Storage::disk('local')->putFile('materials', UploadedFile::fake()->create('guia.pdf', 500, self::MIME_PDF));

        $material = MaterialAprendizaje::create([
            'titulo' => 'Guía Académica',
            'tipo' => 'PDF',
            'enlaceArchivo' => $path,
            'idUsuarioCreador' => $professor->idUsuario,
        ]);

        ItemTema::create([
            'idTema' => $tema->idTema,
            'itemable_type' => MaterialAprendizaje::class,
            'itemable_id' => $material->idMaterial,
            'orden' => 1,
        ]);

        Sanctum::actingAs($student);

        // Test stream endpoint
        $response = $this->getJson("/api/materiales/{$material->idMaterial}/stream");
        $response->assertStatus(200);

        // Test download endpoint
        $response = $this->getJson("/api/materiales/{$material->idMaterial}/download");
        $response->assertStatus(200);
    }

    public function test_unenrolled_student_cannot_stream_material()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $student = User::factory()->create();
        $student->roles()->attach($this->estudianteRol->idRol);

        $course = Curso::create([
            'titulo' => self::COURSE_TITLE,
            'descripcion' => self::COURSE_DESC,
            'lp' => 'PHP',
            'tipo' => self::COURSE_TYPE,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => self::TEMA_NAME,
            'idCurso' => $course->idCurso,
        ]);

        $material = MaterialAprendizaje::create([
            'titulo' => 'Guía Oculta',
            'tipo' => 'PDF',
            'enlaceArchivo' => 'materials/oculto.pdf',
            'idUsuarioCreador' => $professor->idUsuario,
        ]);

        ItemTema::create([
            'idTema' => $tema->idTema,
            'itemable_type' => MaterialAprendizaje::class,
            'itemable_id' => $material->idMaterial,
            'orden' => 1,
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson("/api/materiales/{$material->idMaterial}/stream");
        $response->assertStatus(403);
    }

    public function test_cascade_delete_tema_removes_materials_and_files()
    {
        $professor = User::factory()->create();
        $professor->roles()->attach($this->profesorRol->idRol);

        $course = Curso::create([
            'titulo' => self::COURSE_TITLE,
            'descripcion' => self::COURSE_DESC,
            'lp' => 'PHP',
            'tipo' => self::COURSE_TYPE,
            'idProfeCreador' => $professor->idUsuario,
        ]);

        $tema = Tema::create([
            'nombre' => self::TEMA_NAME,
            'idCurso' => $course->idCurso,
        ]);

        $path = Storage::disk('local')->putFile('materials', UploadedFile::fake()->create('archivo.pdf', 500, self::MIME_PDF));

        $material = MaterialAprendizaje::create([
            'titulo' => 'Archivo a eliminar',
            'tipo' => 'PDF',
            'enlaceArchivo' => $path,
            'idUsuarioCreador' => $professor->idUsuario,
        ]);

        ItemTema::create([
            'idTema' => $tema->idTema,
            'itemable_type' => MaterialAprendizaje::class,
            'itemable_id' => $material->idMaterial,
            'orden' => 1,
        ]);

        Sanctum::actingAs($professor);

        $response = $this->deleteJson("/api/temas/{$tema->idTema}");

        $response->assertStatus(200);

        // Verify Tema is deleted
        $this->assertDatabaseMissing('temas', ['idTema' => $tema->idTema]);

        // Verify ItemTema is cascade deleted
        $this->assertDatabaseMissing('items_tema', ['idTema' => $tema->idTema]);

        // Verify Material is cascade deleted
        $this->assertDatabaseMissing('materiales_aprendizaje', ['idMaterial' => $material->idMaterial]);

        // Verify File is deleted from disk
        Storage::disk('local')->assertMissing($path);
    }
}
