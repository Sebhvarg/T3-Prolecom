<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CursoController;
use App\Http\Controllers\Api\DesafioController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\TemaController;
use App\Http\Controllers\Api\UserController;
use App\Models\LenguajeProgramacion;
use App\Services\Dashboards\DashboardFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

if (!defined('ROUTE_CURSO_ID')) {
    define('ROUTE_CURSO_ID', '/cursos/{id}');
}
if (!defined('ROUTE_DESAFIO_ID')) {
    define('ROUTE_DESAFIO_ID', '/desafios/{id}');
}

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
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

    // Rutas de Cursos e Inscripciones
    $cursoRoute = '/cursos/{id}';
    Route::get('/cursos', [CursoController::class, 'index']);
    Route::get('/cursos/total', [CursoController::class, 'cursosTotal']);
    Route::get(ROUTE_CURSO_ID, [CursoController::class, 'show']);
    Route::post(ROUTE_CURSO_ID.'/inscribir', [CursoController::class, 'inscribir']);
    Route::delete(ROUTE_CURSO_ID.'/desmatricular', [CursoController::class, 'desmatricular']);

    // Rutas de Temas (Módulos)
    Route::post('/cursos/{id}/temas', [TemaController::class, 'store']);
    Route::put('/temas/{id}', [TemaController::class, 'update']);
    Route::delete('/temas/{id}', [TemaController::class, 'destroy']);

    // Rutas de Materiales de Aprendizaje
    Route::post('/temas/{id}/materiales', [MaterialController::class, 'store']);
    Route::delete('/materiales/{id}', [MaterialController::class, 'destroy']);
    Route::get('/materiales/{id}/stream', [MaterialController::class, 'stream']);
    Route::get('/materiales/{id}/download', [MaterialController::class, 'download']);

    // Rutas de Desafíos y Soluciones
    Route::get('/temas/{idTema}/desafios', [DesafioController::class, 'indexByTema']);
    Route::get(ROUTE_DESAFIO_ID, [DesafioController::class, 'show']);
    Route::post(ROUTE_DESAFIO_ID.'/soluciones', [DesafioController::class, 'enviarSolucion']);
    Route::get(ROUTE_DESAFIO_ID.'/soluciones', [DesafioController::class, 'listarIntentos']);

    Route::middleware('role:Administrador,Profesor,Ayudante')->group(function () {
        Route::post('/temas/{idTema}/desafios', [DesafioController::class, 'store']);
        Route::put(ROUTE_DESAFIO_ID, [DesafioController::class, 'update']);
        Route::delete(ROUTE_DESAFIO_ID, [DesafioController::class, 'destroy']);
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
