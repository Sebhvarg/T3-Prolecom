<?php

namespace App\Events;

use App\Models\Solucion;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SolucionEvaluada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Solucion $solucion) {}

    /**
     * Canal privado del estudiante — solo él recibe su resultado
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("soluciones.{$this->solucion->idEstudiante}")];
    }

    public function broadcastAs(): string
    {
        return 'solucion.resultado';
    }

    public function broadcastWith(): array
    {
        return [
            'idSolucion' => $this->solucion->idSolucion,
            'idDesafio' => $this->solucion->idDesafio,
            'estado' => $this->solucion->estado,
            'casos_pasados' => $this->solucion->casos_pasados,
            'casos_totales' => $this->solucion->casos_totales,
            'puntos_otorgados' => $this->solucion->puntos_otorgados,
            'tiempo_ejecucion_ms' => $this->solucion->tiempo_ejecucion_ms,
            'memoria_ejecucion_kb' => $this->solucion->memoria_ejecucion_kb,
            'stdout' => $this->solucion->stdout,
            'stderr' => $this->solucion->stderr,
        ];
    }
}
