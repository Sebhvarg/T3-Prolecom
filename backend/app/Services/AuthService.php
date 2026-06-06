<?php

namespace App\Services;

use App\Repositories\Interfaces\AuthRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    protected $authRepository;

    public function __construct(AuthRepositoryInterface $authRepository)
    {
        $this->authRepository = $authRepository;
    }

    public function login(array $credentials)
    {
        $usuario = $this->authRepository->findByUsernameOrEmailWithRoles($credentials['login']);

        if (!$usuario || !Hash::check($credentials['password'], $usuario->password)) {
            throw ValidationException::withMessages([
                'error' => 'Credenciales inválidas'
            ])->status(401);
        }

        if ($usuario->estado->estado !== 'Activo') {
            throw ValidationException::withMessages([
                'error' => 'Cuenta ' . $usuario->estado->estado
            ])->status(403);
        }

        $token = $usuario->createToken('auth_token')->plainTextToken;

        $rutas = $usuario->roles->flatMap(function ($rol) {
            return $rol->rutas->pluck('ruta');
        })->unique()->implode(';');

        return [
            'token' => $token,
            'user' => [
                'idUsuario' => $usuario->idUsuario,
                'nombreCompleto' => $usuario->nombreCompleto,
                'usuario' => $usuario->usuario,
                'email' => $usuario->email,
                'rol' => $usuario->roles->pluck('rol')->first(),
                'id_rol' => $usuario->roles->pluck('idRol')->first(),
                'rutas' => $rutas ? explode(';', $rutas) : [],
            ]
        ];
    }
}
