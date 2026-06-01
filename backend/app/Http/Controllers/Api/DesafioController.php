<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Desafio;
use App\Models\Solucion;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DesafioController extends Controller
{
    /**
     * Listar desafíos filtrados por curso o dificultad
     */
    public function index(Request $request)
    {
        $query = Desafio::with(['creador:idUsuario,nombreCompleto']);

        if ($request->has('idCurso')) {
            $query->where('idCurso', $request->idCurso);
        }

        if ($request->has('dificultad')) {
            $query->where('dificultad', $request->dificultad);
        }

        return response()->json($query->get());
    }

    /**
     * Mostrar un desafío específico
     */
    public function show($id)
    {
        $desafio = Desafio::with(['creador', 'curso'])->find($id);

        if (!$desafio) {
            return response()->json(['message' => 'Desafío no encontrado'], 404);
        }

        return response()->json($desafio);
    }

    /**
     * "Correr" el código y evaluar resultados
     * Nota: En un entorno real, usaríamos un motor de ejecución seguro (Docker, Piston API, etc.)
     */
    public function evaluar(Request $request, $id)
    {
        $request->validate([
            'codigo' => 'required|string',
            'lenguaje' => 'required|string', // ej: python, javascript, php
        ]);

        $desafio = Desafio::findOrFail($id);
        $testCases = $desafio->testCases; // Formato esperado: [{"input": "...", "output": "..."}]
        
        $puntaje = 0;
        $total = count($testCases);
        $resultados = [];

        // Por ahora, simulamos la evaluación comparativa si no hay un motor de ejecución.
        // TODO: Integrar con una API de ejecución como Piston o un microservicio de Sandbox.
        
        foreach ($testCases as $case) {
            // Aquí iría la lógica de ejecución del código con la entrada $case['input']
            // y la comparación de la salida obtenida vs $case['output']
            
            // Simulación básica de éxito para propósitos de estructura
            $resultados[] = [
                'input' => $case['input'] ?? 'n/a',
                'expected' => $case['output'] ?? 'n/a',
                'actual' => 'Simulado (Motor de ejecución pendiente)',
                'status' => 'pending_runner'
            ];
        }

        // Guardar la solución del estudiante
        $solucion = Solucion::create([
            'codigoFuente' => $request->codigo,
            'fechaEntrega' => now(),
            'estado' => 'enviado',
            'idEstudiante' => $request->user()->idUsuario,
            'idDesafio' => $id
        ]);

        return response()->json([
            'message' => 'Evaluación enviada',
            'solucion_id' => $solucion->idSolucion,
            'resultados' => $resultados
        ]);
    }
}
