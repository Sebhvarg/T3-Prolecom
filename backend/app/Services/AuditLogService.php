<?php

namespace App\Services;

use App\Models\Auditoria;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    public static function log(string $accion, string $entidad, ?int $entidadId = null, ?string $detalles = null): ?Auditoria
    {
        try {
            $user = Auth::user();
            $rolName = 'Sistema';
            if ($user) {
                try {
                    $rolName = $user->roles?->pluck('rol')->first() ?? 'Usuario';
                } catch (\Throwable $e) {
                    logger()->debug('Audit role resolution notice: '.$e->getMessage());
                    $rolName = 'Usuario';
                }
            }

            return Auditoria::create([
                'idUsuario' => $user?->idUsuario,
                'nombreUsuario' => $user ? $user->nombreCompleto : 'Sistema',
                'rolUsuario' => $rolName,
                'accion' => $accion,
                'entidad' => $entidad,
                'entidad_id' => $entidadId,
                'detalles' => $detalles,
                'ip_address' => Request::ip(),
            ]);
        } catch (\Throwable $e) {
            logger()->error('Error recording audit log: '.$e->getMessage());

            return null;
        }
    }
}
