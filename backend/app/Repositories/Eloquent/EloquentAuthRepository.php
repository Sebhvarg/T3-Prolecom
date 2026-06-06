<?php

namespace App\Repositories\Eloquent;

use App\Models\Usuario;
use App\Repositories\Interfaces\AuthRepositoryInterface;

class EloquentAuthRepository implements AuthRepositoryInterface
{
    public function findByUsernameOrEmailWithRoles(string $login)
    {
        return Usuario::where('usuario', $login)
            ->orWhere('email', $login)
            ->with(['roles.rutas', 'estado'])
            ->first();
    }
}
