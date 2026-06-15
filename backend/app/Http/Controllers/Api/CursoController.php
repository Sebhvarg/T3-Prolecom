<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CursoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Curso::query()->with('creador:idUsuario,nombreCompleto');

        // Filtro por Lenguaje (LP)
        if ($request->has('lp') && !empty($request->lp)) {
            $query->where('lp', $request->lp);
        }

        // Filtro por Tipo (Público/Privado)
        if ($request->has('tipo') && !empty($request->tipo)) {
            $query->where('tipo', $request->tipo);
        }

        // Filtros especiales de matrícula
        if ($request->has('filtro')) {
            if ($request->filtro === 'mis_cursos') {
                $query->whereHas('estudiantes', function ($q) use ($user) {
                    $q->where('usuarios.idUsuario', $user->idUsuario);
                });
            } elseif ($request->filtro === 'disponibles') {
                $query->whereDoesntHave('estudiantes', function ($q) use ($user) {
                    $q->where('usuarios.idUsuario', $user->idUsuario);
                });
            }
        }

        $cursos = $query->get();

        // Inyectar el flag esta_matriculado y progreso dinámicamente
        if ($user) {
            $cursos->each(function ($curso) use ($user) {
                $matricula = $curso->estudiantes()
                    ->where('usuarios.idUsuario', $user->idUsuario)
                    ->first();
                
                $curso->esta_matriculado = !is_null($matricula);
                $curso->progreso = $matricula ? floatval($matricula->pivot->progreso) : 0;
            });
        }

        return response()->json($cursos);
    }

    public function show($id)
    {
        $curso = Curso::with([
            'creador:idUsuario,nombreCompleto',
            'temas.items.itemable'
        ])->findOrFail($id);

        $curso->temas->each(function ($tema) {
            $tema->items->each(function ($item) {
                if ($item->itemable && method_exists($item->itemable, 'creador')) {
                    $item->itemable->load('creador:idUsuario,nombreCompleto');
                }
            });
        });

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

        $user = $request->user();
        $isAdmin = $user->roles->pluck('rol')->contains('Administrador');
        if (!$isAdmin && $curso->idProfeCreador !== $user->idUsuario) {
            return response()->json(['message' => 'No tienes permisos para eliminar este curso'], 403);
        }

        $curso->delete();

        return response()->json(['message' => 'Curso eliminado con éxito']);
    }

    // LÓGICA DE MATRICULACIÓN (PB6)

    public function inscribir(Request $request, $id)
    {
        $curso = Curso::findOrFail($id);
        $user = $request->user();

        if ($curso->tipo !== 'público') {
            return response()->json(['message' => 'No puedes inscribirte a un curso privado'], 403);
        }

        if ($curso->estudiantes()->where('usuarios.idUsuario', $user->idUsuario)->exists()) {
            return response()->json(['message' => 'Ya estás inscrito en este curso'], 400);
        }

        $curso->estudiantes()->attach($user->idUsuario, ['fechaInscripcion' => now()]);

        return response()->json(['message' => 'Inscripción exitosa'], 201);
    }

    public function desmatricular(Request $request, $id)
    {
        $curso = Curso::findOrFail($id);
        $user = $request->user();

        $isAdminOrProfe = $user->roles->pluck('rol')->intersect(['Administrador', 'Profesor'])->isNotEmpty();

        $targetUserId = $user->idUsuario;
        if ($isAdminOrProfe && $request->has('idUsuarioEstudiante')) {
            $targetUserId = $request->input('idUsuarioEstudiante');
        }

        if (!$curso->estudiantes()->where('usuarios.idUsuario', $targetUserId)->exists()) {
            return response()->json(['message' => 'El estudiante no está inscrito en este curso'], 400);
        }

        $curso->estudiantes()->detach($targetUserId);

        return response()->json(['message' => 'Desmatriculación exitosa']);
    }

    public function matricularManual(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:usuarios,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $curso = Curso::findOrFail($id);
        $student = User::where('email', $request->email)->firstOrFail();

        // Validar si ya está inscrito
        if ($curso->estudiantes()->where('usuarios.idUsuario', $student->idUsuario)->exists()) {
            return response()->json(['message' => 'El estudiante ya está inscrito en este curso'], 400);
        }

        $curso->estudiantes()->attach($student->idUsuario, ['fechaInscripcion' => now()]);

        return response()->json([
            'message' => 'Estudiante matriculado exitosamente',
            'estudiante' => [
                'idUsuario' => $student->idUsuario,
                'nombreCompleto' => $student->nombreCompleto,
                'email' => $student->email,
            ]
        ], 201);
    }

    public function getEstudiantes($id)
    {
        $curso = Curso::findOrFail($id);
        $estudiantes = $curso->estudiantes()
            ->select('usuarios.idUsuario', 'usuarios.nombreCompleto', 'usuarios.email')
            ->get();

        return response()->json($estudiantes);
    }
}
