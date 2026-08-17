<?php

namespace App\Events;

use App\Models\Notificacion;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Evento Observer: se dispara cada vez que se crea una notificación.
 * Transmite por el canal privado del usuario destinatario.
 *
 * Canal: private-notificaciones.{idUsuario}
 * Evento: notificacion.nueva
 */
class NotificacionCreada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Notificacion $notificacion) {}

    /**
     * Canal privado del usuario — solo él recibe sus notificaciones.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("notificaciones.{$this->notificacion->idUsuario}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notificacion.nueva';
    }

    public function broadcastWith(): array
    {
        return [
            'idNotificacion' => $this->notificacion->idNotificacion,
            'tipo' => $this->notificacion->tipo,
            'titulo' => $this->notificacion->titulo,
            'mensaje' => $this->notificacion->mensaje,
            'leida' => false,
            'datos' => $this->notificacion->datos,
            'created_at' => $this->notificacion->created_at?->toISOString(),
        ];
    }
}
