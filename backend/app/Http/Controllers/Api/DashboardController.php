<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Dashboards\DashboardFactory;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Obtener los datos y widgets del Dashboard según el rol del usuario autenticado.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $dashboardService = DashboardFactory::create($user);

        return response()->json($dashboardService->render());
    }
}
