<?php

namespace App\Services\Dashboards;

class AdminDashboard extends BaseDashboard
{
    protected function getSidebar(): array
    {
        return [
            ['name' => 'Gestión de Usuarios', 'route' => '/admin/usuarios'],
            ['name' => 'Gestión de Roles', 'route' => '/admin/roles'],
            ['name' => 'Reportes Financieros', 'route' => '/admin/reportes'],
        ];
    }

    protected function getWidgets(): array
    {
        return [
            'total_usuarios' => 150, // TODO
            'ingresos_mes' => 5000,
            'sesiones_activas' => 12,
        ];
    }
}
