<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Login y password son requeridos'], 400);
        }

        try {
            $data = $this->authService->login($request->only('login', 'password'));

            return response()->json($data);
        } catch (ValidationException $e) {
            $errors  = $e->errors();
            $status  = $e->status;

            // Respuesta limpia para el frontend (sin arrays anidados de Laravel)
            $payload = [
                'error' => is_array($errors['error'] ?? null)
                    ? $errors['error'][0]
                    : ($errors['error'] ?? 'Error de autenticación'),
            ];

            // Incluir retry_after solo en el caso de bloqueo por intentos (429)
            if ($status === 429 && isset($errors['retry_after'])) {
                $payload['retry_after'] = is_array($errors['retry_after'])
                    ? (int) $errors['retry_after'][0]
                    : (int) $errors['retry_after'];
            }

            return response()->json($payload, $status);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }
}
