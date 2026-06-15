<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaterialAprendizaje;
use App\Models\Tema;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MaterialController extends Controller
{
    private function checkPermission($curso, $user)
    {
        $isAdmin = $user->roles->pluck('rol')->contains('Administrador');
        return $isAdmin || $curso->idProfeCreador === $user->idUsuario;
    }

    private function isAuthorizedToView($curso, $user)
    {
        if ($this->checkPermission($curso, $user)) {
            return true;
        }
        return $curso->estudiantes()->where('usuarios.idUsuario', $user->idUsuario)->exists();
    }

    public function store(Request $request, $temaId)
    {
        $tema = Tema::findOrFail($temaId);
        $curso = $tema->curso;
        $user = $request->user();

        if (!$this->checkPermission($curso, $user)) {
            return response()->json(['message' => 'No tienes permisos para agregar materiales a este curso'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:150',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|in:PDF,video',
            'archivo' => 'required|file|max:30720', // máximo 30MB
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        if ($request->hasFile('archivo')) {
            // Guardamos el archivo de forma privada en el disco local
            $path = $request->file('archivo')->store('materials', 'local');
        } else {
            return response()->json(['message' => 'El archivo es obligatorio'], 400);
        }

        $material = MaterialAprendizaje::create([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'tipo' => $request->tipo,
            'enlaceArchivo' => $path,
            'idTema' => $tema->idTema,
            'idUsuarioCreador' => $user->idUsuario,
        ]);

        return response()->json([
            'message' => 'Material subido con éxito',
            'material' => $material
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $material = MaterialAprendizaje::findOrFail($id);
        $curso = $material->tema->curso;
        $user = $request->user();

        if (!$this->checkPermission($curso, $user)) {
            return response()->json(['message' => 'No tienes permisos para eliminar este material'], 403);
        }

        // Eliminar el archivo del disco local
        if (Storage::disk('local')->exists($material->enlaceArchivo)) {
            Storage::disk('local')->delete($material->enlaceArchivo);
        }

        $material->delete();

        return response()->json(['message' => 'Material eliminado con éxito']);
    }

    // STREAMING SEGURO (Para reproducir video o cargar PDF en visor seguro)
    public function stream(Request $request, $id)
    {
        $material = MaterialAprendizaje::findOrFail($id);
        $curso = $material->tema->curso;
        $user = $request->user();

        if (!$this->isAuthorizedToView($curso, $user)) {
            return response()->json(['message' => 'No estás matriculado en este curso para ver este recurso'], 403);
        }

        if (!Storage::disk('local')->exists($material->enlaceArchivo)) {
            return response()->json(['message' => 'El archivo no existe o fue removido'], 404);
        }

        $absolutePath = Storage::disk('local')->path($material->enlaceArchivo);

        // response()->file() maneja cabeceras HTTP Range automáticamente, vital para que el navegador reproduzca y navegue (seek) en videos
        return response()->file($absolutePath);
    }

    // DESCARGA SEGURA
    public function download(Request $request, $id)
    {
        $material = MaterialAprendizaje::findOrFail($id);
        $curso = $material->tema->curso;
        $user = $request->user();

        if (!$this->isAuthorizedToView($curso, $user)) {
            return response()->json(['message' => 'No estás autorizado para descargar este archivo'], 403);
        }

        if (!Storage::disk('local')->exists($material->enlaceArchivo)) {
            return response()->json(['message' => 'El archivo solicitado no existe'], 404);
        }

        // Obtener la extensión del archivo para preservarla en la descarga
        $ext = pathinfo($material->enlaceArchivo, PATHINFO_EXTENSION);
        $safeName = str_replace(['/', '\\', '?', '%', '*', ':', '|', '"', '<', '>'], '-', $material->titulo);
        $filename = $safeName . ($ext ? '.' . $ext : '');

        return Storage::disk('local')->download($material->enlaceArchivo, $filename);
    }
}
