<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

if (!defined('ROUTE_CURSO_ID')) {
    define('ROUTE_CURSO_ID', '/cursos/{id}');
}

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/dashboard', function (Request $request) {
        $dashboard = \App\Services\Dashboards\DashboardFactory::create($request->user()->load('roles'));
        return response()->json($dashboard->render());
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/lenguajes', function () {
        return response()->json(\App\Models\LenguajeProgramacion::where('activo', true)->get());
    });


    // Rutas de Cursos e Inscripciones
    $cursoRoute = '/cursos/{id}';
    Route::get('/cursos', [\App\Http\Controllers\Api\CursoController::class, 'index']);
    Route::get(ROUTE_CURSO_ID, [\App\Http\Controllers\Api\CursoController::class, 'show']);
    Route::post(ROUTE_CURSO_ID . '/inscribir', [\App\Http\Controllers\Api\CursoController::class, 'inscribir']);
    Route::delete(ROUTE_CURSO_ID . '/desmatricular', [\App\Http\Controllers\Api\CursoController::class, 'desmatricular']);

    // Rutas de Temas (Módulos)
    Route::post('/cursos/{id}/temas', [\App\Http\Controllers\Api\TemaController::class, 'store']);
    Route::put('/temas/{id}', [\App\Http\Controllers\Api\TemaController::class, 'update']);
    Route::delete('/temas/{id}', [\App\Http\Controllers\Api\TemaController::class, 'destroy']);

    // Rutas de Materiales de Aprendizaje
    Route::post('/temas/{id}/materiales', [\App\Http\Controllers\Api\MaterialController::class, 'store']);
    Route::delete('/materiales/{id}', [\App\Http\Controllers\Api\MaterialController::class, 'destroy']);
    Route::get('/materiales/{id}/stream', [\App\Http\Controllers\Api\MaterialController::class, 'stream']);
    Route::get('/materiales/{id}/download', [\App\Http\Controllers\Api\MaterialController::class, 'download']);

    // Rutas de Desafíos y Soluciones
    Route::get('/lenguajes', function () {
        return response()->json(\App\Models\LenguajeProgramacion::where('activo', true)->get());
    });
    Route::get('/temas/{idTema}/desafios', [\App\Http\Controllers\Api\DesafioController::class, 'indexByTema']);
    Route::get('/desafios/{id}', [\App\Http\Controllers\Api\DesafioController::class, 'show']);
    Route::post('/desafios/{id}/soluciones', [\App\Http\Controllers\Api\DesafioController::class, 'enviarSolucion']);
    Route::get('/desafios/{id}/soluciones', [\App\Http\Controllers\Api\DesafioController::class, 'listarIntentos']);

    Route::middleware('role:Administrador,Profesor,Ayudante')->group(function () {
        Route::post('/temas/{idTema}/desafios', [\App\Http\Controllers\Api\DesafioController::class, 'store']);
        Route::put('/desafios/{id}', [\App\Http\Controllers\Api\DesafioController::class, 'update']);
        Route::delete('/desafios/{id}', [\App\Http\Controllers\Api\DesafioController::class, 'destroy']);
    });

    Route::middleware('role:Administrador,Profesor')->group(function () use ($cursoRoute) {
        Route::post('/cursos', [\App\Http\Controllers\Api\CursoController::class, 'store']);
        Route::put(ROUTE_CURSO_ID, [\App\Http\Controllers\Api\CursoController::class, 'update']);
        Route::delete(ROUTE_CURSO_ID, [\App\Http\Controllers\Api\CursoController::class, 'destroy']);
        Route::get(ROUTE_CURSO_ID . '/estudiantes', [\App\Http\Controllers\Api\CursoController::class, 'getEstudiantes']);
        Route::post(ROUTE_CURSO_ID . '/matricular-manual', [\App\Http\Controllers\Api\CursoController::class, 'matricularManual']);
        Route::get('/estudiantes', [\App\Http\Controllers\Api\UserController::class, 'listarEstudiantes']);
    });
});
