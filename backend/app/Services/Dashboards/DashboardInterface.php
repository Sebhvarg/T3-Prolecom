<?php

namespace App\Services\Dashboards;

interface DashboardInterface
{
    /**
     * Renderiza los datos o la estructura del dashboard.
     * Podría retornar un array de datos para una API o una vista para Blade.
     */
    public function render(): array;
}
