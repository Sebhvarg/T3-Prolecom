<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use App\Models\LenguajeProgramacion;
use App\Models\Solucion;
use App\Models\User;
use App\Strategies\CourseTemplate\CursoTemplateFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CursoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Curso::query()->with(['creador:idUsuario,nombreCompleto', 'categoria:idCategoria,nombre,slug,icono']);

        // Filtro por Lenguaje (LP)
        if ($request->has('lp') && ! empty($request->lp)) {
            $query->where('lp', $request->lp);
        }

        // Filtro por Tipo (Público/Privado)
        if ($request->has('tipo') && ! empty($request->tipo)) {
            $query->where('tipo', $request->tipo);
        }

        // Filtro por Categoría
        if ($request->has('idCategoria') && ! empty($request->idCategoria)) {
            $query->where('idCategoria', $request->idCategoria);
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

        // Inyectar el flag esta_matriculado dinámicamente
        if ($user) {
            $cursos->each(function ($curso) use ($user) {
                $curso->esta_matriculado = $curso->estudiantes()
                    ->where('usuarios.idUsuario', $user->idUsuario)
                    ->exists();
            });
        }

        return response()->json($cursos);
    }

    public function getCategorias()
    {
        return response()->json(\App\Models\CategoriaCurso::all());
    }

    public function show(Request $request, $id)
    {
        $user = $request->user('sanctum') ?? auth()->user();

        $curso = Curso::with([
            'creador:idUsuario,nombreCompleto',
            'categoria:idCategoria,nombre,slug,icono',
            'temas.items.itemable',
            'temas' => function ($query) {
                $query->orderBy('idTema', 'asc');
            },
        ])->find($id);

        if (! $curso) {
            return response()->json(['message' => 'Curso no encontrado'], 404);
        }

        // Si el curso es privado y el usuario no está matriculado ni es creador/admin
        $isCreatorOrAdmin = $user && ($user->idUsuario === $curso->idProfeCreador || $user->roles->pluck('rol')->contains('Administrador'));
        $isEnrolled = $user && $curso->estudiantes()->where('usuarios.idUsuario', $user->idUsuario)->exists();

        if ($curso->tipo === 'privado' && ! $isCreatorOrAdmin && ! $isEnrolled) {
            return response()->json(['message' => 'No tienes acceso a este curso privado'], 403);
        }

        $curso->esta_matriculado = $isEnrolled;

        // Desafíos resueltos por el estudiante en este curso
        $desafiosCount = 0;
        $desafiosResueltosCount = 0;

        foreach ($curso->temas as $tema) {
            foreach ($tema->items as $item) {
                if ($item->itemable_type === \App\Models\Desafio::class) {
                    $desafiosCount++;
                    if ($user) {
                        $aprobado = Solucion::where('idDesafio', $item->itemable_id)
                            ->where('idEstudiante', $user->idUsuario)
                            ->where('estado', 'aprobado')
                            ->exists();
                        if ($aprobado) {
                            $desafiosResueltosCount++;
                        }
                    }
                }
            }
        }

        $desafiosTotales = $desafiosCount;
        $curso->progreso_desafios = [
            'resueltos' => $desafiosResueltosCount,
            'totales' => $desafiosTotales,
            'porcentaje' => $desafiosTotales > 0 ? round(($desafiosResueltosCount / $desafiosTotales) * 100) : 0,
        ];

        return response()->json($curso);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:150',
            'descripcion' => 'required|string',
            'lp' => 'required|string|max:50',
            'tipo' => 'required|in:público,privado',
            'idCategoria' => 'nullable|exists:categorias_curso,idCategoria',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $curso = Curso::create([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'lp' => $request->lp,
            'tipo' => $request->tipo,
            'idCategoria' => $request->idCategoria ?? 1,
            'idProfeCreador' => $request->user()->idUsuario,
        ]);

        // Aplicar la plantilla correspondiente al curso usando el patrón de diseño Strategy
        $strategy = CursoTemplateFactory::getStrategy($curso->lp);
        $strategy->loadTemplate($curso);

        \App\Services\AuditLogService::log('crear_curso', 'Curso', $curso->idCurso, "Curso creado: {$curso->titulo}");

        return response()->json([
            'message' => 'Curso creado con éxito',
            'curso' => $curso->load(['creador:idUsuario,nombreCompleto', 'categoria', 'temas']),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $curso = Curso::findOrFail($id);

        $user = $request->user();
        $isAdmin = $user->roles->pluck('rol')->contains('Administrador');
        if (! $isAdmin && $curso->idProfeCreador !== $user->idUsuario) {
            return response()->json(['message' => 'No tienes permisos para editar este curso'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:150',
            'descripcion' => 'sometimes|required|string',
            'lp' => 'sometimes|required|string|max:50',
            'tipo' => 'sometimes|required|in:público,privado',
            'idCategoria' => 'nullable|exists:categorias_curso,idCategoria',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $curso->update($request->only('titulo', 'descripcion', 'lp', 'tipo', 'idCategoria'));

        \App\Services\AuditLogService::log('editar_curso', 'Curso', $curso->idCurso, "Curso actualizado: {$curso->titulo}");

        return response()->json([
            'message' => 'Curso actualizado con éxito',
            'curso' => $curso->load(['creador:idUsuario,nombreCompleto', 'categoria']),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $curso = Curso::findOrFail($id);

        $user = $request->user();
        $isAdmin = $user->roles->pluck('rol')->contains('Administrador');
        if (! $isAdmin && $curso->idProfeCreador !== $user->idUsuario) {
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

        if (! $curso->estudiantes()->where('usuarios.idUsuario', $targetUserId)->exists()) {
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
            ],
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

    public function cursosTotal()
    {
        return response()->json(['count' => Curso::count()]);
    }

    private function procesarItemTema($item, array $idsDesafiosResueltos): array
    {
        if ($item->itemable && method_exists($item->itemable, 'creador')) {
            $item->itemable->load('creador:idUsuario,nombreCompleto');
        }

        $isDesafio = $item->itemable_type && str_contains($item->itemable_type, 'Desafio') && $item->itemable;
        if (! $isDesafio) {
            return ['es_desafio' => false, 'puntos' => 0, 'completado' => false];
        }

        $desafio = $item->itemable;
        $puntos = $desafio->puntos ?? 10;
        $isCompleted = in_array($desafio->idDesafio, $idsDesafiosResueltos);
        $desafio->completado = $isCompleted;

        return [
            'es_desafio' => true,
            'puntos' => $puntos,
            'completado' => $isCompleted,
        ];
    }

    public function getLenguajes()
    {
        $lenguajes = LenguajeProgramacion::where('activo', true)
            ->orderBy('nombre')
            ->get();

        return response()->json($lenguajes);
    }
}
