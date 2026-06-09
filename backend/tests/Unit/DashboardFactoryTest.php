<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Rol;
use App\Services\Dashboards\DashboardFactory;
use App\Services\Dashboards\AdminDashboard;
use App\Services\Dashboards\ClienteDashboard;
use Illuminate\Database\Eloquent\Collection;

class DashboardFactoryTest extends TestCase
{
    public function test_creates_admin_dashboard_for_admin_role()
    {
        $usuario = new User();
        $rol = new Rol();
        $rol->rol = 'admin';
        
        $usuario->setRelation('roles', new Collection([$rol]));

        $dashboard = DashboardFactory::create($usuario);

        $this->assertInstanceOf(AdminDashboard::class, $dashboard);
    }

    public function test_creates_cliente_dashboard_for_estudiante_role()
    {
        $usuario = new User();
        $rol = new Rol();
        $rol->rol = 'estudiante';
        
        $usuario->setRelation('roles', new Collection([$rol]));

        $dashboard = DashboardFactory::create($usuario);

        $this->assertInstanceOf(ClienteDashboard::class, $dashboard);
    }

    public function test_creates_cliente_dashboard_by_default()
    {
        $usuario = new User();
        $usuario->setRelation('roles', new Collection([]));

        $dashboard = DashboardFactory::create($usuario);

        $this->assertInstanceOf(ClienteDashboard::class, $dashboard);
    }
}
