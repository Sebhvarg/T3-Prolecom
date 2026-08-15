<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CategoriaCurso;
use App\Models\Curso;
use App\Models\Desafio;
use App\Models\LenguajeProgramacion;
use App\Models\Solucion;
use App\Models\User;
use App\Services\AuditLogService;
use App\Strategies\CourseTemplate\CursoTemplateFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class CursoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Curso::query()->with(['creador:idUsuario,nombreCompleto', 'categoria:idCategoria,nombre,slug,icono']);

        $this->applyFilters($query, $request, $user);

        $cursos = $query->get();

        if ($user) {
            $cursos->each(function ($curso) use ($user) {
                $curso->esta_matriculado = $curso->estudiantes()
                    ->where('usuarios.idUsuario', $user->idUsuario)
                    ->exists();
            });
        }

        return response()->json($cursos);
    }

    private function applyFilters($query, Request $request, $user): void
    {
        if ($request->filled('lp')) {
            $query->where('lp', $request->lp);
        }
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }
        if ($request->filled('idCategoria')) {
            $query->where('idCategoria', $request->idCategoria);
        }
        if ($request->has('filtro')) {
            $this->applyEnrollmentFilter($query, (string) $request->filtro, $user);
        }
    }

    private function applyEnrollmentFilter($query, string $filtro, $user): void
    {
        if ($filtro === 'mis_cursos') {
            $userRole = $user ? $user->roles->pluck('rol')->first() : null;
            if ($userRole === 'Ayudante' && Schema::hasTable('ayudantes_cursos')) {
                $query->whereHas('ayudantes', fn ($q) => $q->where('usuarios.idUsuario', $user->idUsuario));
            } else {
                $query->whereHas('estudiantes', fn ($q) => $q->where('usuarios.idUsuario', $user->idUsuario));
            }
        } elseif ($filtro === 'disponibles') {
            $query->whereDoesntHave('estudiantes', fn ($q) => $q->where('usuarios.idUsuario', $user->idUsuario));
        }
    }

    public function getCategorias()
    {
        return response()->json(CategoriaCurso::all());
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
        $curso->progreso_desafios = $this->calcularProgresoDesafios($curso, $user);

        return response()->json($curso);
    }

    private function calcularProgresoDesafios(Curso $curso, $user): array
    {
        $desafiosCount = 0;
        $desafiosResueltosCount = 0;

        foreach ($curso->temas as $tema) {
            foreach ($tema->items as $item) {
                if ($item->itemable_type === Desafio::class) {
                    $desafiosCount++;
                    if ($user && Solucion::where('idDesafio', $item->itemable_id)->where('idEstudiante', $user->idUsuario)->where('estado', 'aprobado')->exists()) {
                        $desafiosResueltosCount++;
                    }
                }
            }
        }

        return [
            'resueltos' => $desafiosResueltosCount,
            'totales' => $desafiosCount,
            'porcentaje' => $desafiosCount > 0 ? (int) round(($desafiosResueltosCount / $desafiosCount) * 100) : 0,
        ];
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

        AuditLogService::log('crear_curso', 'Curso', $curso->idCurso, "Curso creado: {$curso->titulo}");

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

        AuditLogService::log('editar_curso', 'Curso', $curso->idCurso, "Curso actualizado: {$curso->titulo}");

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
            return response()->json(['message' => 'The student is already enrolled in this course'], 422);
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

    public function getLenguajes()
    {
        $lenguajes = LenguajeProgramacion::where('activo', true)
            ->orderBy('nombre')
            ->get();

        return response()->json($lenguajes);
    }

    public function getAyudantes($id)
    {
        $curso = Curso::findOrFail($id);
        if (! Schema::hasTable('ayudantes_cursos')) {
            return response()->json([]);
        }

        $ayudantes = $curso->ayudantes()
            ->select('usuarios.idUsuario', 'usuarios.nombreCompleto', 'usuarios.usuario', 'usuarios.email')
            ->get();

        return response()->json($ayudantes);
    }

    public function asignarAyudante(Request $request, $id)
    {
        $user = $request->user();
        $curso = Curso::findOrFail($id);

        $isAuthorized = $user->idUsuario === $curso->idProfeCreador ||
            $user->roles->pluck('rol')->intersect(['Administrador', 'Soporte'])->isNotEmpty();

        if (! $isAuthorized) {
            return response()->json(['message' => 'No tienes permisos para asignar ayudantes a este curso'], 403);
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required_without:idUsuarioAyudante|nullable|email',
            'idUsuarioAyudante' => 'required_without:email|nullable|exists:usuarios,idUsuario',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $ayudante = $request->filled('idUsuarioAyudante')
            ? User::findOrFail($request->idUsuarioAyudante)
            : User::where('email', $request->email)->firstOrFail();

        $errorMsg = $this->checkAyudanteEligible($curso, $ayudante);
        if ($errorMsg) {
            return response()->json(['message' => $errorMsg], 400);
        }

        $curso->ayudantes()->attach($ayudante->idUsuario, ['idAsignador' => $user->idUsuario]);
        $this->ensureAyudanteRole($ayudante);

        return response()->json([
            'message' => 'Ayudante asignado exitosamente al curso',
            'ayudante' => [
                'idUsuario' => $ayudante->idUsuario,
                'nombreCompleto' => $ayudante->nombreCompleto,
                'email' => $ayudante->email,
            ],
        ], 201);
    }

    private function checkAyudanteEligible(Curso $curso, User $ayudante): ?string
    {
        if (! Schema::hasTable('ayudantes_cursos')) {
            return 'La tabla ayudantes_cursos no existe aún en la base de datos';
        }
        if ($curso->ayudantes()->where('usuarios.idUsuario', $ayudante->idUsuario)->exists()) {
            return 'El usuario ya está asignado como ayudante de este curso';
        }

        return null;
    }

    private function ensureAyudanteRole(User $ayudante): void
    {
        if (! $ayudante->roles()->where('roles.rol', 'Ayudante')->exists()) {
            $rolAyudante = DB::table('roles')->where('rol', 'Ayudante')->first();
            if ($rolAyudante) {
                DB::table('usuario_roles')->insert([
                    'idUsuario' => $ayudante->idUsuario,
                    'idRol' => $rolAyudante->idRol,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function desasignarAyudante(Request $request, $id, $idAyudante)
    {
        $user = $request->user();
        $curso = Curso::findOrFail($id);

        $isAuthorized = $user->idUsuario === $curso->idProfeCreador ||
            $user->roles->pluck('rol')->intersect(['Administrador', 'Soporte'])->isNotEmpty();

        if (! $isAuthorized) {
            return response()->json(['message' => 'No tienes permisos para remover ayudantes de este curso'], 403);
        }

        if (! Schema::hasTable('ayudantes_cursos')) {
            return response()->json(['message' => 'La tabla ayudantes_cursos no existe aún'], 400);
        }

        $curso->ayudantes()->detach($idAyudante);

        return response()->json(['message' => 'Ayudante removido del curso exitosamente']);
    }

    public function getModeradores($id)
    {
        $curso = Curso::findOrFail($id);
        if (! Schema::hasTable('moderadores_cursos')) {
            return response()->json([]);
        }

        $moderadores = $curso->moderadores()
            ->select('usuarios.idUsuario', 'usuarios.nombreCompleto', 'usuarios.usuario', 'usuarios.email')
            ->get();

        return response()->json($moderadores);
    }

    public function asignarModerador(Request $request, $id)
    {
        $user = $request->user();
        $curso = Curso::findOrFail($id);

        $isAuthorized = $user->idUsuario === $curso->idProfeCreador ||
            $user->roles->pluck('rol')->intersect(['Administrador', 'Soporte'])->isNotEmpty();

        if (! $isAuthorized) {
            return response()->json(['message' => 'No tienes permisos para asignar moderadores a este curso'], 403);
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required_without:idUsuarioModerador|nullable|email',
            'idUsuarioModerador' => 'required_without:email|nullable|exists:usuarios,idUsuario',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $moderador = $request->filled('idUsuarioModerador')
            ? User::findOrFail($request->idUsuarioModerador)
            : User::where('email', $request->email)->firstOrFail();

        $errorMsg = $this->checkModeradorEligible($curso, $moderador);
        if ($errorMsg) {
            return response()->json(['message' => $errorMsg], 400);
        }

        $curso->moderadores()->attach($moderador->idUsuario, ['idAsignador' => $user->idUsuario]);

        return response()->json([
            'message' => 'Moderador asignado exitosamente al curso',
            'moderador' => [
                'idUsuario' => $moderador->idUsuario,
                'nombreCompleto' => $moderador->nombreCompleto,
                'email' => $moderador->email,
            ],
        ], 201);
    }

    private function checkModeradorEligible(Curso $curso, User $moderador): ?string
    {
        if (! Schema::hasTable('moderadores_cursos')) {
            return 'La tabla moderadores_cursos no existe aún en la base de datos';
        }
        if ($curso->moderadores()->where('usuarios.idUsuario', $moderador->idUsuario)->exists()) {
            return 'El usuario ya está asignado como moderador de este curso';
        }

        return null;
    }

    public function desasignarModerador(Request $request, $id, $idModerador)
    {
        $user = $request->user();
        $curso = Curso::findOrFail($id);

        $isAuthorized = $user->idUsuario === $curso->idProfeCreador ||
            $user->roles->pluck('rol')->intersect(['Administrador', 'Soporte'])->isNotEmpty();

        if (! $isAuthorized) {
            return response()->json(['message' => 'No tienes permisos para remover moderadores de este curso'], 403);
        }

        if (! Schema::hasTable('moderadores_cursos')) {
            return response()->json(['message' => 'La tabla moderadores_cursos no existe aún'], 400);
        }

        $curso->moderadores()->detach($idModerador);

        return response()->json(['message' => 'Moderador removido del curso exitosamente']);
    }
}
