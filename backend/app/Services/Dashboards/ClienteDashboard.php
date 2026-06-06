<?php

namespace App\Services\Dashboards;

class ClienteDashboard extends BaseDashboard
{
    protected function getSidebar(): array
    {
        return [
            ['name' => 'Mi Perfil', 'route' => '/cliente/perfil'],
            ['name' => 'Mis Compras', 'route' => '/cliente/compras'],
            ['name' => 'Soporte', 'route' => '/cliente/soporte'],
        ];
    }

    protected function getWidgets(): array
    {
        return [
            'compras_recientes' => 3, // TODO
            'estado_cuenta' => 'Al día',
        ];
    }
}
