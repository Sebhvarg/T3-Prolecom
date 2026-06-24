<?php

namespace App\Services;

use App\Repositories\Interfaces\AuthRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    protected $authRepository;

    const MAX_ATTEMPTS = 5;
    const DECAY_SECONDS = 30;

    public function __construct(AuthRepositoryInterface $authRepository)
    {
        $this->authRepository = $authRepository;
    }

    public function login(array $credentials)
    {
        $throttleKey = $this->throttleKey($credentials['login']);

        // Verificar si está bloqueado por demasiados intentos
        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'error' => "Demasiados intentos fallidos. Intenta nuevamente en {$seconds} segundos.",
                'retry_after' => $seconds,
            ])->status(429);
        }

        $usuario = $this->authRepository->findByUsernameOrEmailWithRoles($credentials['login']);

        if (!$usuario || !Hash::check($credentials['password'], $usuario->password)) {
            // Registrar intento fallido
            RateLimiter::hit($throttleKey, self::DECAY_SECONDS);

            $remaining = RateLimiter::remaining($throttleKey, self::MAX_ATTEMPTS);
            throw ValidationException::withMessages([
                'error' => $remaining > 0
                    ? "Credenciales inválidas. Te quedan {$remaining} intento(s)."
                    : "Credenciales inválidas.",
            ])->status(401);
        }

        if ($usuario->estado->estado !== 'Activo') {
            throw ValidationException::withMessages([
                'error' => 'Cuenta ' . $usuario->estado->estado
            ])->status(403);
        }

        // Login exitoso: limpiar el contador de intentos
        RateLimiter::clear($throttleKey);

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
    /**
     * Genera una clave única por usuario/IP para el rate limiter.
     */
    protected function throttleKey(string $login): string
    {
        return 'login:' . Str::lower($login) . '|' . request()->ip();
    }
}
