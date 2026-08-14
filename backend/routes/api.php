<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CursoController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DesafioController;
use App\Http\Controllers\Api\ForoController;
use App\Http\Controllers\Api\HealthLogController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\ModeracionController;
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\TemaController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

if (! defined('ROUTE_CURSO_ID')) {
    define('ROUTE_CURSO_ID', '/cursos/{id}');
}
if (! defined('ROUTE_DESAFIO_ID')) {
    define('ROUTE_DESAFIO_ID', '/desafios/{id}');
}
if (! defined('ROUTE_FORO_ID')) {
    define('ROUTE_FORO_ID', '/foros/{idForo}');
}
if (! defined('ROUTE_PREGUNTA_ID')) {
    define('ROUTE_PREGUNTA_ID', '/preguntas/{idPregunta}');
}
if (! defined('ROUTE_QUIZ_ID')) {
    define('ROUTE_QUIZ_ID', '/quizzes/{idQuiz}');
}

/*
|--------------------------------------------------------------------------
| API Routes — Sistema T3-Prolecom
|--------------------------------------------------------------------------
*/

// Rutas Públicas de Autenticación
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Rutas Protegidas (Autenticadas por Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Auth, Perfil & Dashboard
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Cursos — lectura, exploración y matriculación (PB08/PB10)
    Route::get('/cursos', [CursoController::class, 'index']);
    Route::get('/lenguajes', [CursoController::class, 'getLenguajes']);
    Route::get('/categorias', [CursoController::class, 'getCategorias']);
    Route::get('/cursos/total', [CursoController::class, 'cursosTotal']);
    Route::get(ROUTE_CURSO_ID, [CursoController::class, 'show']);
    Route::get('/mis-cursos', [CursoController::class, 'misCursos']);
    Route::post(ROUTE_CURSO_ID.'/inscribir', [CursoController::class, 'inscribir']);
    Route::delete(ROUTE_CURSO_ID.'/desmatricular', [CursoController::class, 'desmatricular']);

    // Ayudantes de Curso
    Route::get(ROUTE_CURSO_ID.'/ayudantes', [CursoController::class, 'getAyudantes']);
    Route::post(ROUTE_CURSO_ID.'/ayudantes', [CursoController::class, 'asignarAyudante']);
    Route::delete(ROUTE_CURSO_ID.'/ayudantes/{idAyudante}', [CursoController::class, 'desasignarAyudante']);

    // Moderadores de Curso
    Route::get(ROUTE_CURSO_ID.'/moderadores', [CursoController::class, 'getModeradores']);
    Route::post(ROUTE_CURSO_ID.'/moderadores', [CursoController::class, 'asignarModerador']);
    Route::delete(ROUTE_CURSO_ID.'/moderadores/{idModerador}', [CursoController::class, 'desasignarModerador']);

    // Temas (Módulos)
    Route::post('/cursos/{id}/temas', [TemaController::class, 'store']);
    Route::put('/temas/{id}', [TemaController::class, 'update']);
    Route::delete('/temas/{id}', [TemaController::class, 'destroy']);

    // Materiales de Aprendizaje
    Route::post('/temas/{id}/materiales', [MaterialController::class, 'store']);
    Route::put('/materiales/{id}', [MaterialController::class, 'update']);
    Route::delete('/materiales/{id}', [MaterialController::class, 'destroy']);
    Route::get('/materiales/{id}/stream', [MaterialController::class, 'stream']);
    Route::get('/materiales/{id}/download', [MaterialController::class, 'download']);

    // Desafíos y Soluciones
    Route::get('/temas/{idTema}/desafios', [DesafioController::class, 'indexByTema']);
    Route::get(ROUTE_DESAFIO_ID, [DesafioController::class, 'show']);
    Route::post(ROUTE_DESAFIO_ID.'/soluciones', [DesafioController::class, 'enviarSolucion']);
    Route::get(ROUTE_DESAFIO_ID.'/soluciones', [DesafioController::class, 'listarIntentos']);
    Route::post(ROUTE_DESAFIO_ID.'/reset', [DesafioController::class, 'reset']);

    // Rutas de Quizzes (Evaluaciones / Cuestionarios)
    Route::get('/cursos/{idCurso}/quizzes', [QuizController::class, 'indexByCurso']);
    Route::get(ROUTE_QUIZ_ID, [QuizController::class, 'show']);
    Route::post(ROUTE_QUIZ_ID.'/intentos', [QuizController::class, 'enviarIntento']);
    Route::get(ROUTE_QUIZ_ID.'/intentos', [QuizController::class, 'listarIntentos']);

    // FORO ACADÉMICO
    Route::get(ROUTE_FORO_ID, [ForoController::class, 'show']);
    Route::get(ROUTE_FORO_ID.'/preguntas', [ForoController::class, 'indexPreguntas']);
    Route::post(ROUTE_FORO_ID.'/preguntas', [ForoController::class, 'storePregunta']);
    Route::get(ROUTE_PREGUNTA_ID, [ForoController::class, 'showPregunta']);
    Route::put(ROUTE_PREGUNTA_ID, [ForoController::class, 'updatePregunta']);
    Route::delete(ROUTE_PREGUNTA_ID, [ForoController::class, 'destroyPregunta']);

    // Respuestas Foro
    Route::post(ROUTE_PREGUNTA_ID.'/respuestas', [ForoController::class, 'storeRespuesta']);
    Route::put('/respuestas/{idRespuesta}', [ForoController::class, 'updateRespuesta']);
    Route::delete('/respuestas/{idRespuesta}', [ForoController::class, 'destroyRespuesta']);
    Route::post('/respuestas/{idRespuesta}/votar', [ForoController::class, 'votar']);

    // Reportes de contenido
    Route::post(ROUTE_PREGUNTA_ID.'/reportar', [ForoController::class, 'reportarPregunta']);
    Route::post('/respuestas/{idRespuesta}/reportar', [ForoController::class, 'reportarRespuesta']);

    // NOTIFICACIONES
    Route::get('/notificaciones', [NotificacionController::class, 'index']);
    Route::patch('/notificaciones/{id}/leer', [NotificacionController::class, 'marcarLeida']);
    Route::patch('/notificaciones/leer-todas', [NotificacionController::class, 'marcarTodasLeidas']);

    // Rutas con restricción de roles
    Route::middleware('role:Administrador,Profesor,Ayudante')->group(function () {
        Route::post('/temas/{idTema}/desafios', [DesafioController::class, 'store']);
        Route::put(ROUTE_DESAFIO_ID, [DesafioController::class, 'update']);
        Route::delete(ROUTE_DESAFIO_ID, [DesafioController::class, 'destroy']);

        // Foros
        Route::post('/temas/{idTema}/foros', [ForoController::class, 'store']);
        Route::put(ROUTE_FORO_ID, [ForoController::class, 'update']);
        Route::delete(ROUTE_FORO_ID, [ForoController::class, 'destroy']);
        Route::patch(ROUTE_FORO_ID.'/estado', [ForoController::class, 'toggleEstado']);
        Route::patch(ROUTE_PREGUNTA_ID.'/fijar', [ForoController::class, 'toggleFijar']);
        Route::patch(ROUTE_PREGUNTA_ID.'/estado', [ForoController::class, 'toggleEstadoPregunta']);
        Route::put('/respuestas/{idRespuesta}/validar', [ForoController::class, 'toggleValidarRespuesta']);

        // Gestión de Quizzes por Instructores
        Route::post('/cursos/{idCurso}/quizzes', [QuizController::class, 'store']);
        Route::put(ROUTE_QUIZ_ID, [QuizController::class, 'update']);
        Route::delete(ROUTE_QUIZ_ID, [QuizController::class, 'destroy']);
        Route::post(ROUTE_QUIZ_ID.'/reiniciar-intentos', [QuizController::class, 'reiniciarIntentos']);
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

    // MODERACIÓN Y CONTROL DE REPORTES (Administrador, Moderador)
    Route::middleware('role:Administrador,Moderador')->group(function () {
        Route::get('/moderacion/stats', [ModeracionController::class, 'stats']);
        Route::get('/moderacion/reportes', [ModeracionController::class, 'indexReportes']);
        Route::get('/moderacion/auditoria', [ModeracionController::class, 'indexAuditorias']);
        Route::post('/moderacion/reportes/{id}/resolver', [ModeracionController::class, 'resolverReporte']);
        Route::post('/moderacion/reportes/{id}/ocultar', [ModeracionController::class, 'ocultarPublicacion']);
        Route::post('/moderacion/usuarios/{id}/banear', [ModeracionController::class, 'banearUsuario']);
    });

    // Rutas exclusivas de Administrador / Soporte (PB22 - SCRUM-60 & SCRUM-61)
    Route::middleware('role:Administrador,Soporte')->group(function () {
        Route::get('/admin/usuarios', [UserController::class, 'index']);
        Route::put('/admin/usuarios/{id}/roles', [UserController::class, 'updateRoles']);
        Route::put('/admin/usuarios/{id}/estado', [UserController::class, 'updateEstado']);
        Route::put('/admin/usuarios/{id}/reset-password', [UserController::class, 'resetPassword']);

        // Monitor de salud del sistema y logs de errores (SCRUM-61)
        Route::get('/admin/logs', [HealthLogController::class, 'index']);
    });
});
