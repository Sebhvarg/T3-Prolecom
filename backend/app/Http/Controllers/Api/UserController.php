<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EstadoCuenta;
use App\Models\LogActividad;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['roles', 'estado']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombreCompleto', 'like', "%{$search}%")
                    ->orWhere('usuario', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('rol')) {
            $rol = $request->rol;
            $query->whereHas('roles', function ($q) use ($rol) {
                $q->where('rol', $rol)->orWhere('roles.idRol', $rol);
            });
        }

        if ($request->filled('estado')) {
            $estado = $request->estado;
            $query->whereHas('estado', function ($q) use ($estado) {
                $q->where('estado', $estado)->orWhere('estadosCuenta.idEstado', $estado);
            });
        }

        $users = $query->orderBy('idUsuario', 'desc')->get();
        $availableRoles = Rol::select('idRol', 'rol')->get();
        $availableStates = EstadoCuenta::select('idEstado', 'estado')->get();

        return response()->json([
            'users' => $users,
            'availableRoles' => $availableRoles,
            'availableStates' => $availableStates,
        ]);
    }

    public function updateRoles(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'idRol' => 'nullable|exists:roles,idRol',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,idRol',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $user = User::findOrFail($id);

        $rolesToSync = [];
        if ($request->filled('idRol')) {
            $rolesToSync = [$request->idRol];
        } elseif ($request->filled('roles')) {
            $rolesToSync = $request->roles;
        }

        if ($rolesToSync !== []) {
            $user->roles()->sync($rolesToSync);
        }

        try {
            $nuevoRol = Rol::find($rolesToSync[0] ?? null)?->rol ?? 'Rol';
            LogActividad::create([
                'accion' => "Cambio de rol a '{$nuevoRol}' para el usuario @{$user->usuario}",
                'idUsuario' => $request->user()->idUsuario ?? $user->idUsuario,
            ]);
        } catch (\Exception $e) {
            //
        }

        return response()->json([
            'message' => 'Rol de usuario actualizado exitosamente',
            'user' => $user->fresh(['roles', 'estado']),
        ]);
    }

    public function updateEstado(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'idEstado' => 'required|exists:estadosCuenta,idEstado',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $user = User::findOrFail($id);
        $user->idEstado = $request->idEstado;
        $user->save();

        // Revocación Automática de Tokens JWT/Sanctum al inhabilitar/suspender/banear
        if ((int) $request->idEstado !== 1) {
            try {
                DB::table('personal_access_tokens')
                    ->where('tokenable_id', $user->idUsuario)
                    ->delete();
            } catch (\Exception $e) {
                //
            }
        }

        try {
            $estadoNombre = EstadoCuenta::find($request->idEstado)?->estado ?? "Estado {$request->idEstado}";
            LogActividad::create([
                'accion' => "Cambio de estado a '{$estadoNombre}' para el usuario @{$user->usuario}",
                'idUsuario' => $request->user()->idUsuario ?? $user->idUsuario,
            ]);
        } catch (\Exception $e) {
            //
        }

        return response()->json([
            'message' => 'Estado de cuenta actualizado exitosamente',
            'user' => $user->fresh(['roles', 'estado']),
        ]);
    }

    public function resetPassword(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:8',
        ], [
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $user = User::findOrFail($id);
        $user->password = Hash::make($request->password);
        $user->save();

        // Revocar tokens existentes por seguridad al cambiar contraseña
        try {
            DB::table('personal_access_tokens')
                ->where('tokenable_id', $user->idUsuario)
                ->delete();
        } catch (\Exception $e) {
            //
        }

        try {
            LogActividad::create([
                'accion' => "Restablecimiento de contraseña para el usuario @{$user->usuario}",
                'idUsuario' => $request->user()->idUsuario ?? $user->idUsuario,
            ]);
        } catch (\Exception $e) {
            //
        }

        return response()->json([
            'message' => 'Contraseña del usuario restablecida exitosamente',
        ]);
    }

    public function listarEstudiantes()
    {
        $estudiantes = User::whereHas('roles', function ($q) {
            $q->where('rol', 'Estudiante');
        })->select('idUsuario', 'nombreCompleto', 'email')->get();

        return response()->json($estudiantes);
    }

    public function listarAyudantes()
    {
        $ayudantes = User::whereHas('roles', function ($q) {
            $q->where('rol', 'Ayudante')->orWhere('roles.idRol', 5);
        })->select('idUsuario', 'nombreCompleto', 'email')->get();

        return response()->json($ayudantes);
    }

    public function usuariosActivos()
    {
        $count = User::whereHas('estado', function ($q) {
            $q->where('estado', 'Activo');
        })->count();

        return response()->json(['count' => $count]);
    }
}
