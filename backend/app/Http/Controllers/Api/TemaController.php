<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use App\Models\Tema;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TemaController extends Controller
{
    private function checkPermission(Curso $curso, $user)
    {
        $isAdmin = $user->roles->pluck('rol')->contains('Administrador');
        return $isAdmin || $curso->idProfeCreador === $user->idUsuario;
    }

    public function store(Request $request, $cursoId)
    {
        $curso = Curso::findOrFail($cursoId);
        $user = $request->user();

        if (!$this->checkPermission($curso, $user)) {
            return response()->json(['message' => 'No tienes permisos para agregar temas a este curso'], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $tema = Tema::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'idCurso' => $curso->idCurso,
        ]);

        return response()->json([
            'message' => 'Tema creado con éxito',
            'tema' => $tema
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $tema = Tema::findOrFail($id);
        $curso = $tema->curso;
        $user = $request->user();

        if (!$this->checkPermission($curso, $user)) {
            return response()->json(['message' => 'No tienes permisos para editar temas en este curso'], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:100',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $tema->update($request->only('nombre', 'descripcion'));

        return response()->json([
            'message' => 'Tema actualizado con éxito',
            'tema' => $tema
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $tema = Tema::findOrFail($id);
        $curso = $tema->curso;
        $user = $request->user();

        if (!$this->checkPermission($curso, $user)) {
            return response()->json(['message' => 'No tienes permisos para eliminar temas en este curso'], 403);
        }

        // Limpiar archivos y registros polimórficos asociados
        foreach ($tema->items as $item) {
            if ($item->itemable) {
                if ($item->itemable_type === \App\Models\MaterialAprendizaje::class) {
                    if (\Illuminate\Support\Facades\Storage::disk('local')->exists($item->itemable->enlaceArchivo)) {
                        \Illuminate\Support\Facades\Storage::disk('local')->delete($item->itemable->enlaceArchivo);
                    }
                }
                $item->itemable->delete();
            }
            $item->delete();
        }

        $tema->delete();

        return response()->json(['message' => 'Tema eliminado con éxito']);
    }
}
