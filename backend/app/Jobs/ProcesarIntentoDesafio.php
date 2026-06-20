<?php

namespace App\Jobs;

use App\Events\SolucionEvaluada;
use App\Models\Desafio;
use App\Models\Solucion;
use App\Models\User;
use App\Services\Judge0Service;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcesarIntentoDesafio implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Intentos máximos si el Job falla
     */
    public int $tries = 3;

    /**
     * Timeout máximo en segundos para la evaluación
     */
    public int $timeout = 90;

    public function __construct(
        public Solucion $solucion
    ) {}

    public function handle(Judge0Service $judge0): void
    {
        $solucion = $this->solucion;
        $desafio = $solucion->desafio;
        
        if (!$desafio) {
            Log::error("ProcesarIntentoDesafio: Desafío no encontrado para la solución {$solucion->idSolucion}");
            return;
        }

        // Obtener casos de prueba
        $testCases = $desafio->testCases; // Es un array de arrays por el cast 'array'
        $total = is_array($testCases) ? count($testCases) : 0;

        if ($total === 0) {
            // Si el desafío no tiene casos de prueba, asumimos aprobado
            $solucion->update([
                'estado' => 'aprobado',
                'casos_pasados' => 0,
                'casos_totales' => 0,
                'puntos_otorgados' => $desafio->puntos,
            ]);
            
            // Otorgar XP
            $this->otorgarXP($solucion->idEstudiante, $desafio->puntos, $desafio->idDesafio);
            broadcast(new SolucionEvaluada($solucion->fresh()));
            return;
        }

        $passed = 0;
        $estado = 'aprobado';
        $stdout = '';
        $stderr = '';
        $execTime = 0;
        $execMemory = 0;

        // Determinar ID del lenguaje en Judge0 (en T3-Prolecom usamos idLenguaje del modelo)
        // Mapeamos nuestro idLenguaje local a Judge0:
        // idLenguaje = 1 (Python) -> Judge0 = 71 (Python 3.8.1)
        // idLenguaje = 2 (JavaScript) -> Judge0 = 63 (JavaScript Node.js 12.14.0) o similar
        $languageId = 71; // Default Python
        if ($solucion->idLenguaje == 2) {
            $languageId = 63; // JS Node
        }

        foreach ($testCases as $testCase) {
            $input = $testCase['input'] ?? '';
            $expectedOutput = $testCase['expected_output'] ?? $testCase['output'] ?? '';

            // Llamada síncrona a Judge0
            $result = $judge0->submitCode(
                $languageId,
                $solucion->codigoFuente,
                $expectedOutput,
                $input
            );

            if (isset($result['error'])) {
                $estado = 'rechazado'; // Mapeamos compile/server errors a rechazado
                $stderr = $result['error'];
                break;
            }

            $judgeStatus = $result['status']['id'] ?? 0;
            $execTime += (int) (($result['time'] ?? 0) * 1000); // Guardamos en ms
            $execMemory += (int) ($result['memory'] ?? 0);

            if ($judgeStatus === 3) {
                // 3 = Accepted
                $passed++;
            } elseif ($judgeStatus === 4) {
                // Wrong Answer
                $estado = 'rechazado';
                $stderr = "Respuesta incorrecta para el caso de prueba público.";
                break;
            } elseif ($judgeStatus === 5) {
                // Time Limit Exceeded
                $estado = 'rechazado';
                $stderr = "Límite de tiempo excedido.";
                break;
            } elseif ($judgeStatus === 6) {
                // Compile Error
                $estado = 'rechazado';
                $stderr = $result['compile_output'] ?? 'Error de compilación.';
                break;
            } else {
                // Runtime Error u otros
                $estado = 'rechazado';
                $stderr = $result['stderr'] ?? 'Error de ejecución.';
                break;
            }

            $stdout .= ($result['stdout'] ?? '') . "\n";
        }

        if ($passed < $total && $estado === 'aprobado') {
            $estado = 'rechazado';
        }

        $puntosOtorgados = 0;
        if ($estado === 'aprobado') {
            $puntosOtorgados = $desafio->puntos;
        }

        // Transacción para actualizar solución y otorgar XP
        DB::transaction(function () use ($solucion, $estado, $passed, $total, $puntosOtorgados, $execTime, $execMemory, $stdout, $stderr, $desafio) {
            // Actualizar la solución con pessimistic locking
            $solucionLock = Solucion::where('idSolucion', $solucion->idSolucion)->lockForUpdate()->first();
            $solucionLock->update([
                'estado' => $estado,
                'casos_pasados' => $passed,
                'casos_totales' => $total,
                'tiempo_ejecucion_ms' => $execTime,
                'memoria_ejecucion_kb' => $execMemory,
                'stdout' => $stdout,
                'stderr' => $stderr,
                'puntos_otorgados' => $puntosOtorgados,
            ]);

            if ($estado === 'aprobado') {
                $this->otorgarXP($solucion->idEstudiante, $desafio->puntos, $desafio->idDesafio);
            }
        });

        // Transmitir en tiempo real
        broadcast(new SolucionEvaluada($solucion->fresh()));
    }

    /**
     * Otorga puntos de XP al estudiante si es su primera resolución exitosa de este desafío.
     */
    private function otorgarXP(int $idEstudiante, int $puntos, int $idDesafio): void
    {
        // Verificar si ya existe otra solución aprobada anteriormente para este mismo desafío por el mismo estudiante
        $alreadySolved = Solucion::where('idEstudiante', $idEstudiante)
            ->where('idDesafio', $idDesafio)
            ->where('estado', 'aprobado')
            ->where('idSolucion', '!=', $this->solucion->idSolucion)
            ->exists();

        if (!$alreadySolved) {
            // Es la primera vez que lo resuelve con éxito, otorgamos XP
            $usuario = User::find($idEstudiante);
            if ($usuario) {
                $usuario->increment('xp', $puntos);
                Log::info("Otorgado {$puntos} XP al estudiante {$idEstudiante} por el desafío {$idDesafio}");
            }
        }
    }

    /**
     * Si el Job falla después de todos los intentos, marcar la solución como rezagada/rechazada
     */
    public function failed(\Throwable $exception): void
    {
        $this->solucion->update([
            'estado' => 'rechazado',
            'stderr' => 'Error interno de compilación o timeout de red: ' . $exception->getMessage(),
        ]);

        broadcast(new SolucionEvaluada($this->solucion->fresh()));
    }
}
