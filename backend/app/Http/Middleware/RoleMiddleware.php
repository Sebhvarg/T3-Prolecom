<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (! $request->user()) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $userRoles = $request->user()->roles->pluck('rol')->toArray();
        $allowedRoles = [];
        foreach ($roles as $role) {
            foreach (explode(',', $role) as $r) {
                $allowedRoles[] = trim($r);
            }
        }

        foreach ($allowedRoles as $role) {
            if (in_array($role, $userRoles, true)) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'No tienes permisos para acceder a este recurso'], 403);
    }
}
