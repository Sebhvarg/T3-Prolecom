<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Interfaces\AuthRepositoryInterface;

class EloquentAuthRepository implements AuthRepositoryInterface
{
    public function findByUsernameOrEmailWithRoles(string $login)
    {
        return User::where('usuario', $login)
            ->orWhere('email', $login)
            ->with(['roles.rutas', 'estado'])
            ->first();
    }
}
