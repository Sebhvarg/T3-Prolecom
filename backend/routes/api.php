<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ForoController;
use App\Http\Controllers\Api\DesafioController;
use App\Http\Controllers\Api\CursoController;
use App\Http\Controllers\Api\TemaController;
use App\Http\Controllers\Api\MaterialController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Rutas del Foro
    Route::get('/foro/preguntas', [ForoController::class, 'index']);
    Route::get('/foro/preguntas/{id}', [ForoController::class, 'show']);
    Route::post('/foro/preguntas', [ForoController::class, 'storePregunta']);
    Route::post('/foro/preguntas/{id}/respuestas', [ForoController::class, 'storeRespuesta']);

    // Rutas de Desafíos
    Route::get('/desafios', [DesafioController::class, 'index']);
    Route::get('/desafios/{id}', [DesafioController::class, 'show']);
    Route::post('/desafios/{id}/evaluar', [DesafioController::class, 'evaluar']);

    // Rutas de Cursos
    Route::get('/cursos', [CursoController::class, 'index']);
    Route::get('/cursos/{id}', [CursoController::class, 'show']);
    Route::post('/cursos/{id}/inscribirse', [CursoController::class, 'inscribirse']);

    // Rutas protegidas por Rol (Solo Admin y Profesores)
    Route::middleware('role:Administrador,Profesor')->group(function () {
        Route::post('/cursos', [CursoController::class, 'store']);
        Route::put('/cursos/{id}', [CursoController::class, 'update']);
        Route::delete('/cursos/{id}', [CursoController::class, 'destroy']);
        Route::get('/temas', [TemaController::class, 'index']);
        Route::post('/temas', [TemaController::class, 'store']);
        Route::post('/materiales', [MaterialController::class, 'store']);
        Route::delete('/materiales/{id}', [MaterialController::class, 'destroy']);
    });
});
