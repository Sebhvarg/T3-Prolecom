<?php

namespace App\Services\Dashboards;

use App\Models\User;

class DashboardFactory
{
    /**
     * Factory Method: Retorna la instancia de Dashboard correcta
     * basándose en los roles del Usuario.
     */
    public static function create(User $usuario): DashboardInterface
    {
       
        $rolPrincipal = $usuario->roles->first();
        $nombreRol = $rolPrincipal ? strtolower($rolPrincipal->rol) : 'cliente';

       
        return match ($nombreRol) {
            'admin', 'administrador' => new AdminDashboard(),
            'cliente', 'usuario', 'user' => new ClienteDashboard(),
            default => new ClienteDashboard(), // Fallback por defecto
        };
    }
}
