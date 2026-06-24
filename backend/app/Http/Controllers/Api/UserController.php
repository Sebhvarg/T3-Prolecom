<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function listarEstudiantes()
    {
        $estudiantes = User::whereHas('roles', function ($q) {
            $q->where('rol', 'Estudiante');
        })->select('idUsuario', 'nombreCompleto', 'email')->get();

        return response()->json($estudiantes);
    }

    public function usuariosActivos()
    {
        $count = User::whereHas('estado', function ($q) {
            $q->where('estado', 'Activo');
        })->count();

        return response()->json(['count' => $count]);
    }
}
