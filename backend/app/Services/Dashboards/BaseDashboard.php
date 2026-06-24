<?php

namespace App\Services\Dashboards;

abstract class BaseDashboard implements DashboardInterface
{
    /**
     * Template Method: Define el esqueleto del dashboard
     */
    public function render(): array
    {
        return [
            'header' => $this->getHeader(),
            'sidebar' => $this->getSidebar(),
            'widgets' => $this->getWidgets(),
        ];
    }

    protected function getHeader(): array
    {
        return [
            'title' => 'Sistema Prolecom',
            'userMenu' => true,
        ];
    }

    abstract protected function getSidebar(): array;

    abstract protected function getWidgets(): array;
}
