<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Rutas de Cursos
    Route::get('/cursos', [\App\Http\Controllers\Api\CursoController::class, 'index']);
    Route::get('/cursos/{id}', [\App\Http\Controllers\Api\CursoController::class, 'show']);

    Route::middleware('role:Administrador,Profesor')->group(function () {
        Route::post('/cursos', [\App\Http\Controllers\Api\CursoController::class, 'store']);
        Route::put('/cursos/{id}', [\App\Http\Controllers\Api\CursoController::class, 'update']);
        Route::delete('/cursos/{id}', [\App\Http\Controllers\Api\CursoController::class, 'destroy']);
    });
});
