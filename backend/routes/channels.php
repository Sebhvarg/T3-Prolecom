<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Canal privado de notificaciones por usuario.
| Solo el propio usuario puede suscribirse a su canal.
|
*/

Broadcast::channel('notificaciones.{idUsuario}', function ($user, $idUsuario) {
    return (int) $user->idUsuario === (int) $idUsuario;
});

// Canal privado de soluciones evaluadas (ya existía la lógica)
Broadcast::channel('soluciones.{idUsuario}', function ($user, $idUsuario) {
    return (int) $user->idUsuario === (int) $idUsuario;
});
