<?php

namespace App\Services\Dashboards;

use App\Models\Curso;
use App\Models\User;

class AdminDashboard extends BaseDashboard
{
    protected function getSidebar(): array
    {
        return [
            ['name' => 'Gestión de Usuarios', 'route' => '/admin/usuarios'],
            ['name' => 'Salud del Sistema', 'route' => '/admin/logs'],
        ];
    }

    protected function getWidgets(): array
    {
        return [
            'total_usuarios' => User::count(),
            'usuarios_activos' => User::whereHas('estado', function ($q) {
                $q->where('estado', 'Activo');
            })->count(),
            'total_cursos' => Curso::count(),
        ];
    }
}
