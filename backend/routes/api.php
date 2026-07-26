<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CursoController;
use App\Http\Controllers\Api\DesafioController;
use App\Http\Controllers\Api\ForoController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\PerfilController;
use App\Http\Controllers\Api\TemaController;
use App\Http\Controllers\Api\UserController;
use App\Models\LenguajeProgramacion;
use App\Services\Dashboards\DashboardFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

if (! defined('ROUTE_CURSO_ID')) {
    define('ROUTE_CURSO_ID', '/cursos/{id}');
}
if (! defined('ROUTE_DESAFIO_ID')) {
    define('ROUTE_DESAFIO_ID', '/desafios/{id}');
}

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::put('/perfil/password', [PerfilController::class, 'cambiarPassword']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/dashboard', function (Request $request) {
        $dashboard = DashboardFactory::create($request->user()->load('roles'));

        return response()->json($dashboard->render());
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/lenguajes', function () {
        return response()->json(LenguajeProgramacion::where('activo', true)->get());
    });

    // ─────────────────────────────────────────────────────────────────
    // Cursos e Inscripciones
    // ─────────────────────────────────────────────────────────────────
    Route::get('/cursos', [CursoController::class, 'index']);
    Route::get('/cursos/total', [CursoController::class, 'cursosTotal']);
    Route::get(ROUTE_CURSO_ID, [CursoController::class, 'show']);
    Route::post(ROUTE_CURSO_ID.'/inscribir', [CursoController::class, 'inscribir']);
    Route::delete(ROUTE_CURSO_ID.'/desmatricular', [CursoController::class, 'desmatricular']);

    // ─────────────────────────────────────────────────────────────────
    // Temas (Módulos)
    // ─────────────────────────────────────────────────────────────────
    Route::post('/cursos/{id}/temas', [TemaController::class, 'store']);
    Route::put('/temas/{id}', [TemaController::class, 'update']);
    Route::delete('/temas/{id}', [TemaController::class, 'destroy']);

    // ─────────────────────────────────────────────────────────────────
    // Materiales de Aprendizaje
    // ─────────────────────────────────────────────────────────────────
    Route::post('/temas/{id}/materiales', [MaterialController::class, 'store']);
    Route::delete('/materiales/{id}', [MaterialController::class, 'destroy']);
    Route::get('/materiales/{id}/stream', [MaterialController::class, 'stream']);
    Route::get('/materiales/{id}/download', [MaterialController::class, 'download']);

    // ─────────────────────────────────────────────────────────────────
    // Desafíos y Soluciones
    // ─────────────────────────────────────────────────────────────────
    Route::get('/temas/{idTema}/desafios', [DesafioController::class, 'indexByTema']);
    Route::get(ROUTE_DESAFIO_ID, [DesafioController::class, 'show']);
    Route::post(ROUTE_DESAFIO_ID.'/soluciones', [DesafioController::class, 'enviarSolucion']);
    Route::get(ROUTE_DESAFIO_ID.'/soluciones', [DesafioController::class, 'listarIntentos']);

    // ─────────────────────────────────────────────────────────────────
    // FORO ACADÉMICO — PB12
    // Gestión de Foros (Itemable — creado dentro de un Tema)
    // ─────────────────────────────────────────────────────────────────
    Route::get('/foros/{idForo}', [ForoController::class, 'show']);

    // Preguntas del foro (todos los usuarios autenticados)
    Route::get('/foros/{idForo}/preguntas', [ForoController::class, 'indexPreguntas']);
    Route::post('/foros/{idForo}/preguntas', [ForoController::class, 'storePregunta']);
    Route::get('/preguntas/{idPregunta}', [ForoController::class, 'showPregunta']);
    Route::put('/preguntas/{idPregunta}', [ForoController::class, 'updatePregunta']);
    Route::delete('/preguntas/{idPregunta}', [ForoController::class, 'destroyPregunta']);

    // Respuestas (todos los usuarios autenticados)
    Route::post('/preguntas/{idPregunta}/respuestas', [ForoController::class, 'storeRespuesta']);
    Route::put('/respuestas/{idRespuesta}', [ForoController::class, 'updateRespuesta']);
    Route::delete('/respuestas/{idRespuesta}', [ForoController::class, 'destroyRespuesta']);

    // Votos — likes/dislikes en respuestas (todos los usuarios autenticados, excepto el autor)
    Route::post('/respuestas/{idRespuesta}/votar', [ForoController::class, 'votar']);

    // Reportes de contenido (todos los usuarios autenticados)
    Route::post('/preguntas/{idPregunta}/reportar', [ForoController::class, 'reportarPregunta']);
    Route::post('/respuestas/{idRespuesta}/reportar', [ForoController::class, 'reportarRespuesta']);

    // ─────────────────────────────────────────────────────────────────
    // NOTIFICACIONES
    // ─────────────────────────────────────────────────────────────────
    Route::get('/notificaciones', [NotificacionController::class, 'index']);
    Route::patch('/notificaciones/{id}/leer', [NotificacionController::class, 'marcarLeida']);
    Route::patch('/notificaciones/leer-todas', [NotificacionController::class, 'marcarTodasLeidas']);

    // ─────────────────────────────────────────────────────────────────
    // Rutas con restricción de roles
    // ─────────────────────────────────────────────────────────────────
    Route::middleware('role:Administrador,Profesor,Ayudante')->group(function () {
        // Desafíos — solo staff puede crear/editar/eliminar
        Route::post('/temas/{idTema}/desafios', [DesafioController::class, 'store']);
        Route::put(ROUTE_DESAFIO_ID, [DesafioController::class, 'update']);
        Route::delete(ROUTE_DESAFIO_ID, [DesafioController::class, 'destroy']);

        // Foros — crear en un tema (Admin, Profesor, Ayudante)
        Route::post('/temas/{idTema}/foros', [ForoController::class, 'store']);

        // Foro — editar/eliminar/cambiar estado (la verificación de ownership es interna)
        Route::put('/foros/{idForo}', [ForoController::class, 'update']);
        Route::delete('/foros/{idForo}', [ForoController::class, 'destroy']);
        Route::patch('/foros/{idForo}/estado', [ForoController::class, 'toggleEstado']);

        // Preguntas — fijar/desfijar y ocultar/mostrar
        Route::patch('/preguntas/{idPregunta}/fijar', [ForoController::class, 'toggleFijar']);
        Route::patch('/preguntas/{idPregunta}/estado', [ForoController::class, 'toggleEstadoPregunta']);

        // Respuestas — validar como Oficial (PB16 RBAC)
        Route::put('/respuestas/{idRespuesta}/validar', [ForoController::class, 'toggleValidarRespuesta']);
    });

    Route::middleware('role:Administrador,Profesor')->group(function () {
        Route::post('/cursos', [CursoController::class, 'store']);
        Route::put(ROUTE_CURSO_ID, [CursoController::class, 'update']);
        Route::delete(ROUTE_CURSO_ID, [CursoController::class, 'destroy']);
        Route::get(ROUTE_CURSO_ID.'/estudiantes', [CursoController::class, 'getEstudiantes']);
        Route::post(ROUTE_CURSO_ID.'/matricular-manual', [CursoController::class, 'matricularManual']);
        Route::get('/estudiantes', [UserController::class, 'listarEstudiantes']);
        Route::get('/usuarios/activos', [UserController::class, 'usuariosActivos']);
    });
});
