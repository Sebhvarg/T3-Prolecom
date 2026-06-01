<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Curso;
use Illuminate\Support\Facades\Auth;

class CursoController extends Controller
{
    /**
     * Listar todos los cursos (o los del usuario actual si se requiere)
     */
    public function index()
    {
        return response()->json(Curso::with('profesor:idUsuario,nombreCompleto')->get());
    }

    /**
     * Mostrar detalles de un curso, incluyendo sus temas
     */
    public function show($id)
    {
        $curso = Curso::with(['profesor', 'temas.materiales'])->find($id);

        if (!$curso) {
            return response()->json(['message' => 'Curso no encontrado'], 404);
        }

        return response()->json($curso);
    }

    /**
     * Crear un nuevo curso (Solo Profesores/Admin)
     */
    public function store(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:150',
            'descripcion' => 'required|string',
            'lp' => 'required|string|max:50',
            'tipo' => 'in:público,privado'
        ]);

        $curso = Curso::create([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'lp' => $request->lp,
            'tipo' => $request->tipo ?? 'público',
            'idProfeCreador' => $request->user()->idUsuario
        ]);

        return response()->json($curso, 201);
    }

    /**
     * Actualizar un curso
     */
    public function update(Request $request, $id)
    {
        $curso = Curso::findOrFail($id);
        
        $request->validate([
            'titulo' => 'string|max:150',
            'descripcion' => 'string',
            'lp' => 'string|max:50',
            'tipo' => 'in:público,privado'
        ]);

        $curso->update($request->all());

        return response()->json($curso);
    }

    /**
     * Eliminar un curso
     */
    public function destroy($id)
    {
        $curso = Curso::findOrFail($id);
        $curso->delete();

        return response()->json(['message' => 'Curso eliminado correctamente']);
    }

    /**
     * Inscribir al estudiante autenticado en un curso
     */
    public function inscribirse($id)
    {
        $curso = Curso::findOrFail($id);
        $usuario = Auth::user();

        // Verificar si ya está inscrito
        if ($usuario->cursos()->where('inscripciones_cursos.idCurso', $id)->exists()) {
            return response()->json(['message' => 'Ya estás inscrito en este curso'], 400);
        }

        $usuario->cursos()->attach($id);

        return response()->json(['message' => 'Inscripción exitosa']);
    }
}
