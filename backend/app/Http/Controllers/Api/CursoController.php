<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CursoController extends Controller
{
    public function index()
    {
        $cursos = Curso::with('creador:idUsuario,nombreCompleto')->get();
        return response()->json($cursos);
    }

    public function show($id)
    {
        $curso = Curso::with('creador:idUsuario,nombreCompleto')->findOrFail($id);
        return response()->json($curso);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:150',
            'descripcion' => 'required|string',
            'lp' => 'required|string|max:50',
            'tipo' => 'required|in:público,privado',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $curso = Curso::create([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'lp' => $request->lp,
            'tipo' => $request->tipo,
            'idProfeCreador' => $request->user()->idUsuario,
        ]);

        return response()->json([
            'message' => 'Curso creado con éxito',
            'curso' => $curso->load('creador:idUsuario,nombreCompleto')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $curso = Curso::findOrFail($id);

        // Validar que el usuario sea Administrador o el creador del curso
        $user = $request->user();
        $isAdmin = $user->roles->pluck('rol')->contains('Administrador');
        if (!$isAdmin && $curso->idProfeCreador !== $user->idUsuario) {
            return response()->json(['message' => 'No tienes permisos para editar este curso'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:150',
            'descripcion' => 'sometimes|required|string',
            'lp' => 'sometimes|required|string|max:50',
            'tipo' => 'sometimes|required|in:público,privado',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $curso->update($request->only('titulo', 'descripcion', 'lp', 'tipo'));

        return response()->json([
            'message' => 'Curso actualizado con éxito',
            'curso' => $curso->load('creador:idUsuario,nombreCompleto')
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $curso = Curso::findOrFail($id);

        // Validar que el usuario sea Administrador o el creador del curso
        $user = $request->user();
        $isAdmin = $user->roles->pluck('rol')->contains('Administrador');
        if (!$isAdmin && $curso->idProfeCreador !== $user->idUsuario) {
            return response()->json(['message' => 'No tienes permisos para eliminar este curso'], 403);
        }

        $curso->delete();

        return response()->json(['message' => 'Curso eliminado con éxito']);
    }
}
