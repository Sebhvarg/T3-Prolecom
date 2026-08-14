<?php

namespace App\Services\Dashboards;

use App\Models\Notificacion;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

class ClienteDashboard extends BaseDashboard
{
    protected $usuario;

    public function __construct(?User $usuario = null)
    {
        $this->usuario = $usuario;
    }

    protected function getSidebar(): array
    {
        return [
            ['name' => 'Principal', 'route' => '/dashboard/estudiante'],
            ['name' => 'Mis Cursos', 'route' => '/cursos'],
            ['name' => 'Mi Perfil', 'route' => '/perfil'],
        ];
    }

    protected function getWidgets(): array
    {
        return [
            'mis_cursos' => $this->getMisCursos(),
            'actividades' => $this->getActividades(),
        ];
    }

    protected function getMisCursos(): array
    {
        if (! $this->usuario) {
            return [];
        }

        return $this->usuario->cursos()
            ->with('creador:idUsuario,nombreCompleto')
            ->get()
            ->map(function ($curso) {
                return [
                    'idCurso' => $curso->idCurso,
                    'titulo' => $curso->titulo,
                    'descripcion' => $curso->descripcion,
                    'lp' => $curso->lp,
                    'tipo' => $curso->tipo,
                    'creador' => $curso->creador ? ['nombreCompleto' => $curso->creador->nombreCompleto] : null,
                ];
            })
            ->toArray();
    }

    protected function getActividades(): array
    {
        if (! $this->usuario || ! Schema::hasTable('notificaciones')) {
            return [];
        }

        return Notificacion::where('idUsuario', $this->usuario->idUsuario)
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($notif) {
                return [
                    'id' => $notif->idNotificacion,
                    'tipo' => ucfirst(str_replace('_', ' ', $notif->tipo)),
                    'titulo' => $notif->titulo,
                    'curso' => $notif->mensaje,
                    'fecha' => $notif->created_at ? $notif->created_at->diffForHumans() : 'Reciente',
                ];
            })
            ->toArray();
    }
}
