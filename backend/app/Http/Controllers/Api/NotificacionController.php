<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notificacion;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    /**
     * Listar notificaciones del usuario autenticado.
     * Las no leídas aparecen primero, luego por fecha descendente.
     */
    public function index(Request $request)
    {
        $notificaciones = Notificacion::where('idUsuario', $request->user()->idUsuario)
            ->orderBy('leida')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($notificaciones);
    }

    /**
     * Marcar una notificación específica como leída.
     */
    public function marcarLeida(Request $request, $id)
    {
        $notificacion = Notificacion::where('idNotificacion', $id)
            ->where('idUsuario', $request->user()->idUsuario)
            ->firstOrFail();

        $notificacion->update(['leida' => true]);

        return response()->json(['message' => 'Notificación marcada como leída.']);
    }

    /**
     * Marcar todas las notificaciones del usuario como leídas.
     */
    public function marcarTodasLeidas(Request $request)
    {
        Notificacion::where('idUsuario', $request->user()->idUsuario)
            ->where('leida', false)
            ->update(['leida' => true]);

        return response()->json(['message' => 'Todas las notificaciones marcadas como leídas.']);
    }
}
