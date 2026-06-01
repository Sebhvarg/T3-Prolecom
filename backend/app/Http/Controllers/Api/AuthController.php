<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required',
            'password' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Login y password son requeridos'], 400);
        }

        // Buscamos por usuario o email
        $usuario = Usuario::where('usuario', $request->login)
            ->orWhere('email', $request->login)
            ->with(['roles.rutas', 'estado'])
            ->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        if ($usuario->estado->estado !== 'Activo') {
            return response()->json(['error' => 'Cuenta ' . $usuario->estado->estado], 403);
        }

        // Generamos el token de Sanctum
        $token = $usuario->createToken('auth_token')->plainTextToken;

        // Formateamos las rutas como lo hacía el SP (separadas por ;)
        $rutas = $usuario->roles->flatMap(function ($rol) {
            return $rol->rutas->pluck('ruta');
        })->unique()->implode(';');

        return response()->json([
            'token' => $token,
            'user' => [
                'idUsuario' => $usuario->idUsuario,
                'nombreCompleto' => $usuario->nombreCompleto,
                'usuario' => $usuario->usuario,
                'email' => $usuario->email,
                'rol' => $usuario->roles->pluck('rol')->first(),
                'id_rol' => $usuario->roles->pluck('idRol')->first(), // Añadido para compatibilidad con PrivateRoute
                'rutas' => $rutas ? explode(';', $rutas) : [], // El frontend parece esperar un array
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }
}
