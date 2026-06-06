<?php

namespace App\Repositories\Interfaces;

interface AuthRepositoryInterface
{
    public function findByUsernameOrEmailWithRoles(string $login);
}
