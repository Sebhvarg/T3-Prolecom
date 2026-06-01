<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\MaterialAprendizaje;

class MaterialController extends Controller
{
    /**
     * Subir material de estudio
     */
    public function store(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:150',
            'tipo' => 'required|in:PDF,video',
            'enlaceArchivo' => 'required|string',
            'idTema' => 'required|exists:temas,idTema'
        ]);

        $material = MaterialAprendizaje::create([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'tipo' => $request->tipo,
            'enlaceArchivo' => $request->enlaceArchivo,
            'idTema' => $request->idTema,
            'idUsuarioCreador' => $request->user()->idUsuario
        ]);

        return response()->json($material, 201);
    }

    /**
     * Eliminar material
     */
    public function destroy($id)
    {
        $material = MaterialAprendizaje::findOrFail($id);
        $material->delete();

        return response()->json(['message' => 'Material eliminado']);
    }
}
