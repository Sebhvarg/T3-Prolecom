<?php

namespace App\Services\Dashboards;

use App\Models\Notificacion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClienteDashboard extends BaseDashboard
{
    private const COL_NOMBRE_CURSO = 'cursos.titulo as nombre_curso';

    protected $usuario;

    public function __construct(?User $usuario = null)
    {
        $this->usuario = $usuario;
    }

    protected function getSidebar(): array
    {
        return [
            ['name' => 'Principal', 'route' => '/dashboard/estudiante'],
            ['name' => 'Mis Cursos', 'route' => '/cursos'],
            ['name' => 'Mi Perfil', 'route' => '/perfil'],
            ['name' => 'Catálogo de Cursos', 'route' => '/cursos'],
        ];
    }

    protected function getWidgets(): array
    {
        return [
            'mis_cursos' => $this->getMisCursos(),
            'actividades' => $this->getActividades(),
        ];
    }

    protected function getMisCursos(): array
    {
        if (! $this->usuario) {
            return [];
        }

        return $this->usuario->cursos()
            ->with('creador:idUsuario,nombreCompleto')
            ->get()
            ->map(function ($curso) {
                return [
                    'idCurso' => $curso->idCurso,
                    'titulo' => $curso->titulo,
                    'descripcion' => $curso->descripcion,
                    'lp' => $curso->lp,
                    'tipo' => $curso->tipo,
                    'creador' => $curso->creador ? ['nombreCompleto' => $curso->creador->nombreCompleto] : null,
                ];
            })
            ->toArray();
    }

    protected function getActividades(): array
    {
        if (! $this->usuario) {
            return [];
        }

        // 1. Notificaciones directas registradas en la base de datos para este estudiante
        $notificaciones = [];
        if (Schema::hasTable('notificaciones')) {
            $notificaciones = Notificacion::where('idUsuario', $this->usuario->idUsuario)
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($notif) {
                    return [
                        'id' => 'notif-'.$notif->idNotificacion,
                        'tipo' => $this->formatTipoNotificacion($notif->tipo),
                        'titulo' => $notif->titulo,
                        'curso' => $notif->mensaje,
                        'fecha' => $notif->created_at ? $notif->created_at->diffForHumans() : 'Hace un momento',
                        'timestamp' => $notif->created_at ? $notif->created_at->timestamp : now()->timestamp,
                    ];
                })
                ->toArray();
        }

        // 2. Cursos en los que el estudiante está actualmente matriculado
        $cursosEstudiante = DB::table('inscripciones_cursos')
            ->where('idUsuarioEstudiante', $this->usuario->idUsuario)
            ->pluck('idCurso')
            ->toArray();

        if (empty($cursosEstudiante)) {
            return $notificaciones;
        }

        // A. Materiales de Aprendizaje (PDFs y Videos publicados por el profesor)
        $materiales = Schema::hasTable('materiales_aprendizaje')
            ? DB::table('materiales_aprendizaje')
                ->join('items_tema', 'items_tema.itemable_id', '=', 'materiales_aprendizaje.idMaterial')
                ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
                ->join('cursos', 'temas.idCurso', '=', 'cursos.idCurso')
                ->whereIn('temas.idCurso', $cursosEstudiante)
                ->select('materiales_aprendizaje.idMaterial', 'materiales_aprendizaje.titulo', 'materiales_aprendizaje.created_at', self::COL_NOMBRE_CURSO)
                ->latest('materiales_aprendizaje.created_at')
                ->take(5)
                ->get()
                ->map(function ($mat) {
                    $created = $mat->created_at ? Carbon::parse($mat->created_at) : now();

                    return [
                        'id' => 'mat-'.$mat->idMaterial,
                        'tipo' => 'Material Publicado',
                        'titulo' => $mat->titulo,
                        'curso' => $mat->nombre_curso,
                        'fecha' => $created->diffForHumans(),
                        'timestamp' => $created->timestamp,
                    ];
                })->toArray()
            : [];

        // B. Desafíos Prácticos de Código
        $desafios = Schema::hasTable('desafios')
            ? DB::table('desafios')
                ->join('items_tema', 'items_tema.itemable_id', '=', 'desafios.idDesafio')
                ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
                ->join('cursos', 'temas.idCurso', '=', 'cursos.idCurso')
                ->whereIn('temas.idCurso', $cursosEstudiante)
                ->select('desafios.idDesafio', 'desafios.titulo', 'desafios.created_at', self::COL_NOMBRE_CURSO)
                ->latest('desafios.created_at')
                ->take(5)
                ->get()
                ->map(function ($des) {
                    $created = $des->created_at ? Carbon::parse($des->created_at) : now();

                    return [
                        'id' => 'des-'.$des->idDesafio,
                        'tipo' => 'Desafío Práctico',
                        'titulo' => $des->titulo,
                        'curso' => $des->nombre_curso,
                        'fecha' => $created->diffForHumans(),
                        'timestamp' => $created->timestamp,
                    ];
                })->toArray()
            : [];

        // C. Quizzes / Cuestionarios
        $quizzes = Schema::hasTable('quizzes')
            ? DB::table('quizzes')
                ->join('cursos', 'quizzes.idCurso', '=', 'cursos.idCurso')
                ->whereIn('quizzes.idCurso', $cursosEstudiante)
                ->select('quizzes.idQuiz', 'quizzes.titulo', 'quizzes.created_at', self::COL_NOMBRE_CURSO)
                ->latest('quizzes.created_at')
                ->take(5)
                ->get()
                ->map(function ($qz) {
                    $created = $qz->created_at ? Carbon::parse($qz->created_at) : now();

                    return [
                        'id' => 'quiz-'.$qz->idQuiz,
                        'tipo' => 'Evaluación / Quiz',
                        'titulo' => $qz->titulo,
                        'curso' => $qz->nombre_curso,
                        'fecha' => $created->diffForHumans(),
                        'timestamp' => $created->timestamp,
                    ];
                })->toArray()
            : [];

        // D. Foros de Discusión
        $foros = Schema::hasTable('foros')
            ? DB::table('foros')
                ->join('items_tema', 'items_tema.itemable_id', '=', 'foros.idForo')
                ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
                ->join('cursos', 'temas.idCurso', '=', 'cursos.idCurso')
                ->whereIn('temas.idCurso', $cursosEstudiante)
                ->select('foros.idForo', 'foros.titulo', 'foros.created_at', self::COL_NOMBRE_CURSO)
                ->latest('foros.created_at')
                ->take(5)
                ->get()
                ->map(function ($fr) {
                    $created = $fr->created_at ? Carbon::parse($fr->created_at) : now();

                    return [
                        'id' => 'foro-'.$fr->idForo,
                        'tipo' => 'Foro Abierto',
                        'titulo' => $fr->titulo,
                        'curso' => $fr->nombre_curso,
                        'fecha' => $created->diffForHumans(),
                        'timestamp' => $created->timestamp,
                    ];
                })->toArray()
            : [];

        // E. Nuevos Temas creados en sus cursos
        $temas = Schema::hasTable('temas')
            ? DB::table('temas')
                ->join('cursos', 'temas.idCurso', '=', 'cursos.idCurso')
                ->whereIn('temas.idCurso', $cursosEstudiante)
                ->select('temas.idTema', 'temas.nombre as titulo', 'temas.created_at', self::COL_NOMBRE_CURSO)
                ->latest('temas.created_at')
                ->take(5)
                ->get()
                ->map(function ($tm) {
                    $created = $tm->created_at ? Carbon::parse($tm->created_at) : now();

                    return [
                        'id' => 'tema-'.$tm->idTema,
                        'tipo' => 'Nuevo Módulo',
                        'titulo' => $tm->titulo,
                        'curso' => $tm->nombre_curso,
                        'fecha' => $created->diffForHumans(),
                        'timestamp' => $created->timestamp,
                    ];
                })->toArray()
            : [];

        return collect([...$notificaciones, ...$materiales, ...$desafios, ...$quizzes, ...$foros, ...$temas])
            ->unique('id')
            ->sortByDesc('timestamp')
            ->take(10)
            ->values()
            ->toArray();
    }

    private function formatTipoNotificacion(string $tipo): string
    {
        $map = [
            'nuevo_material' => 'Nuevo Material',
            'nuevo_desafio' => 'Nuevo Desafío',
            'nuevo_quiz' => 'Nueva Evaluación',
            'nuevo_foro' => 'Nuevo Foro',
            'nuevo_tema' => 'Nuevo Módulo',
            'nueva_respuesta' => 'Foro Respuesta',
            'respuesta_validada' => 'Respuesta Validada',
        ];

        return $map[$tipo] ?? ucfirst(str_replace('_', ' ', $tipo));
    }
}
