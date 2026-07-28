<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProgresoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgresoController extends Controller
{
    protected ProgresoService $progresoService;

    public function __construct(ProgresoService $progresoService)
    {
        $this->progresoService = $progresoService;
    }

    /**
     * GET /cursos/{id}/progreso
     */
    public function show(Request $request, int $id)
    {
        $usuario = $request->user();

        $inscrito = DB::table('inscripciones_cursos')
            ->where('idUsuarioEstudiante', $usuario->idUsuario)
            ->where('idCurso', $id)
            ->exists();

        if (! $inscrito) {
            return response()->json([
                'error' => 'No estás inscrito en este curso.',
            ], 403);
        }

        $progreso = $this->progresoService->calcularProgreso($id, $usuario->idUsuario);

        return response()->json($progreso);
    }
}