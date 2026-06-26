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
            return response()->json($e->errors(), $e->status);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombreCompleto' => 'required|string|max:500',
            'usuario' => 'required|string|max:20|unique:usuarios,usuario|regex:/^[A-Z]\S*$/',
            'email' => 'required|email|max:120|unique:usuarios,email',
            'password' => ['required', 'string', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/'],
            'fechaDeNacimiento' => 'nullable|date',
            'rol' => 'required|in:Profesor,Estudiante',
        ], [
            'usuario.regex' => 'El usuario debe comenzar con una letra mayúscula y no debe contener espacios.',
            'usuario.max' => 'El usuario no puede superar los 20 caracteres.',
            'password.regex' => 'La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        try {
            $idRol = $request->rol === 'Profesor' ? 3 : 6;

            $usuario = \Illuminate\Support\Facades\DB::transaction(function () use ($request, $idRol) {
                // Crear el usuario
                $user = \App\Models\User::create([
                    'nombreCompleto' => $request->nombreCompleto,
                    'usuario' => $request->usuario,
                    'email' => $request->email,
                    'password' => \Illuminate\Support\Facades\Hash::make($request->password),
                    'fechaDeNacimiento' => $request->fechaDeNacimiento,
                    'idEstado' => 1, // Activo
                    'xp' => 0,
                ]);

                // Asignar el rol
                \Illuminate\Support\Facades\DB::table('rolUsuario')->insert([
                    'idUsuario' => $user->idUsuario,
                    'idRol' => $idRol,
                ]);

                return $user;
            });

            // Generar token para iniciar sesión automáticamente
            $token = $usuario->createToken('auth_token')->plainTextToken;

            // Obtener las rutas
            $usuarioConRoles = \App\Models\User::with('roles.rutas')->findOrFail($usuario->idUsuario);
            $rutas = $usuarioConRoles->roles->flatMap(function ($rol) {
                return $rol->rutas->pluck('ruta');
            })->unique()->implode(';');

            return response()->json([
                'message' => 'Usuario registrado con éxito',
                'token' => $token,
                'user' => [
                    'idUsuario' => $usuario->idUsuario,
                    'nombreCompleto' => $usuario->nombreCompleto,
                    'usuario' => $usuario->usuario,
                    'email' => $usuario->email,
                    'rol' => $request->rol,
                    'id_rol' => $idRol,
                    'rutas' => $rutas ? explode(';', $rutas) : [],
                ]
            ], 201);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error registrando usuario: " . $e->getMessage());
            return response()->json(['message' => 'Error al registrar el usuario en el servidor.'], 500);
        }
    }
}
