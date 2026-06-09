<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

    // Rutas de Cursos e Inscripciones
    Route::get('/cursos', [\App\Http\Controllers\Api\CursoController::class, 'index']);
    Route::get('/cursos/{id}', [\App\Http\Controllers\Api\CursoController::class, 'show']);
    Route::post('/cursos/{id}/inscribir', [\App\Http\Controllers\Api\CursoController::class, 'inscribir']);
    Route::delete('/cursos/{id}/desmatricular', [\App\Http\Controllers\Api\CursoController::class, 'desmatricular']);

    Route::middleware('role:Administrador,Profesor')->group(function () {
        Route::post('/cursos', [\App\Http\Controllers\Api\CursoController::class, 'store']);
        Route::put('/cursos/{id}', [\App\Http\Controllers\Api\CursoController::class, 'update']);
        Route::delete('/cursos/{id}', [\App\Http\Controllers\Api\CursoController::class, 'destroy']);
        Route::get('/cursos/{id}/estudiantes', [\App\Http\Controllers\Api\CursoController::class, 'getEstudiantes']);
        Route::post('/cursos/{id}/matricular-manual', [\App\Http\Controllers\Api\CursoController::class, 'matricularManual']);
        Route::get('/estudiantes', [\App\Http\Controllers\Api\UserController::class, 'listarEstudiantes']);
    });
});
