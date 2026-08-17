<?php

namespace App\Services\Dashboards;

use App\Models\Curso;
use App\Models\Desafio;
use App\Models\Foro;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Solucion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AyudanteDashboard extends BaseDashboard
{
    protected $usuario;

    public function __construct(User $usuario)
    {
        $this->usuario = $usuario;
    }

    protected function getSidebar(): array
    {
        return [
            ['name' => 'Principal', 'route' => '/ayudante/dashboard'],
            ['name' => 'Cursos', 'route' => '/cursos'],
        ];
    }

    /**
     * Obtener los IDs de los cursos donde este usuario es Ayudante asignado.
     */
    protected function getAssignedCourseIds(): array
    {
        if (! Schema::hasTable('ayudantes_cursos')) {
            return [];
        }

        $assignedIds = DB::table('ayudantes_cursos')
            ->where('idUsuarioAyudante', $this->usuario->idUsuario)
            ->pluck('idCurso')
            ->toArray();

        $courseIds = ! empty($assignedIds) ? $assignedIds : $this->getFallbackCourseIds();

        return array_values(array_unique(array_filter($courseIds)));
    }

    private function getFallbackCourseIds(): array
    {
        $roles = $this->usuario->roles->pluck('rol');
        if ($roles->contains('Administrador')) {
            return Curso::pluck('idCurso')->toArray();
        }
        if ($roles->contains('Profesor')) {
            return Curso::where('idProfeCreador', $this->usuario->idUsuario)->pluck('idCurso')->toArray();
        }

        return [];
    }

    protected function getActividadReciente(array $courseIds, array $foroIds): array
    {
        $preguntas = $this->getRecientePreguntas($foroIds);
        $soluciones = $this->getRecienteSoluciones($courseIds);

        return $preguntas->concat($soluciones)
            ->sortByDesc('timestamp')
            ->take(8)
            ->values()
            ->toArray();
    }

    private function getRecientePreguntas(array $foroIds)
    {
        if (empty($foroIds)) {
            return collect();
        }

        return Pregunta::whereIn('idForo', $foroIds)
            ->with('creador:idUsuario,nombreCompleto')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($p) {
                return [
                    'tipo' => 'pregunta',
                    'titulo' => $p->titulo,
                    'usuario' => $p->creador ? $p->creador->nombreCompleto : 'Estudiante',
                    'fecha' => $p->created_at ? $p->created_at->toISOString() : now()->toISOString(),
                    'timestamp' => $p->created_at ? $p->created_at->timestamp : now()->timestamp,
                ];
            });
    }

    private function getRecienteSoluciones(array $courseIds)
    {
        $challengeIds = $this->getChallengeIdsInCourses($courseIds);

        if (empty($challengeIds)) {
            return collect();
        }

        return Solucion::whereIn('idDesafio', $challengeIds)
            ->where('estado', 'aprobado')
            ->with(['estudiante:idUsuario,nombreCompleto', 'desafio:idDesafio,titulo'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($s) {
                return [
                    'tipo' => 'solucion',
                    'titulo' => $s->desafio ? $s->desafio->titulo : 'Desafío',
                    'usuario' => $s->estudiante ? $s->estudiante->nombreCompleto : 'Estudiante',
                    'fecha' => $s->created_at ? $s->created_at->toISOString() : now()->toISOString(),
                    'timestamp' => $s->created_at ? $s->created_at->timestamp : now()->timestamp,
                ];
            });
    }

    /**
     * Obtener los IDs de todos los foros pertenecientes a los cursos asignados al ayudante.
     */
    protected function getForoIdsInCourses(array $courseIds): array
    {
        if (empty($courseIds)) {
            return [];
        }

        $forosFromItems = DB::table('items_tema')
            ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
            ->whereIn('temas.idCurso', $courseIds)
            ->where(function ($q) {
                $q->where('items_tema.itemable_type', 'App\\Models\\Foro')
                    ->orWhere('items_tema.itemable_type', 'Foro')
                    ->orWhere('items_tema.itemable_type', 'foro')
                    ->orWhere('items_tema.itemable_type', Foro::class);
            })
            ->pluck('items_tema.itemable_id')
            ->toArray();

        $forosDirect = [];
        if (Schema::hasColumn('foros', 'idCurso')) {
            $forosDirect = DB::table('foros')
                ->whereIn('idCurso', $courseIds)
                ->pluck('idForo')
                ->toArray();
        }

        return array_values(array_unique(array_filter(array_merge($forosFromItems, $forosDirect))));
    }

    /**
     * Obtener los IDs de desafíos pertenecientes a los cursos asignados al ayudante.
     */
    protected function getChallengeIdsInCourses(array $courseIds): array
    {
        if (empty($courseIds)) {
            return [];
        }

        $challengeIdsFromItems = DB::table('items_tema')
            ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
            ->whereIn('temas.idCurso', $courseIds)
            ->where(function ($q) {
                $q->where('items_tema.itemable_type', Desafio::class)
                    ->orWhere('items_tema.itemable_type', 'Desafio')
                    ->orWhere('items_tema.itemable_type', 'desafio')
                    ->orWhere('items_tema.itemable_type', 'App\\Models\\Desafio');
            })
            ->pluck('items_tema.itemable_id')
            ->toArray();

        $challengeIdsDirect = DB::table('desafios')
            ->whereIn('idCurso', $courseIds)
            ->pluck('idDesafio')
            ->toArray();

        return array_values(array_unique(array_filter(array_merge($challengeIdsFromItems, $challengeIdsDirect))));
    }

    protected function getWidgets(): array
    {
        $courseIds = $this->getAssignedCourseIds();
        $foroIds = $this->getForoIdsInCourses($courseIds);

        return [
            'metricas_ayudantia' => $this->getMetricasAyudantia($courseIds, $foroIds),
            'cursos' => $this->getCursosData($courseIds),
            'preguntas_pendientes' => $this->getPreguntasPendientes($foroIds),
            'actividad_reciente' => $this->getActividadReciente($courseIds, $foroIds),
        ];
    }

    protected function getMetricasAyudantia(array $courseIds, array $foroIds): array
    {
        $respuestasValidadas = Respuesta::where('idUsuario', $this->usuario->idUsuario)
            ->where('validada', true)
            ->count();

        $misRespuestasTotal = Respuesta::where('idUsuario', $this->usuario->idUsuario)->count();

        $preguntasAbiertas = ! empty($foroIds)
            ? Pregunta::where('estado', 'abierta')->whereIn('idForo', $foroIds)->count()
            : 0;

        $totalCursos = count($courseIds);

        return [
            'respuestas_validadas' => $respuestasValidadas,
            'mis_respuestas' => $misRespuestasTotal,
            'preguntas_abiertas' => $preguntasAbiertas,
            'cursos_activos' => $totalCursos,
        ];
    }

    protected function getCursosData(array $courseIds): array
    {
        if (empty($courseIds)) {
            return [];
        }

        return Curso::withCount('estudiantes')
            ->whereIn('idCurso', $courseIds)
            ->latest()
            ->get()
            ->map(function ($curso) {
                return [
                    'idCurso' => $curso->idCurso,
                    'titulo' => $curso->titulo,
                    'descripcion' => $curso->descripcion,
                    'lp' => $curso->lenguaje ?? $curso->lp ?? 'Programación',
                    'tipo' => $curso->tipo === 'privado' ? 'Privado' : 'Público',
                    'estudiantes_count' => $curso->estudiantes_count,
                    'profesor' => $curso->creador ? $curso->creador->nombreCompleto : 'Docente Cátedra',
                ];
            })
            ->toArray();
    }

    protected function getPreguntasPendientes(array $foroIds): array
    {
        if (empty($foroIds)) {
            return [];
        }

        return Pregunta::where('estado', 'abierta')
            ->whereIn('idForo', $foroIds)
            ->with(['creador:idUsuario,nombreCompleto,usuario', 'foro:idForo,titulo'])
            ->withCount('respuestas')
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($preg) {
                $idCurso = null;
                if ($preg->foro && $preg->foro->itemTema && $preg->foro->itemTema->tema) {
                    $idCurso = $preg->foro->itemTema->tema->idCurso;
                }

                return [
                    'idPregunta' => $preg->idPregunta,
                    'idForo' => $preg->idForo,
                    'idCurso' => $idCurso,
                    'titulo' => $preg->titulo,
                    'descripcion' => $preg->descripcion,
                    'autor' => $preg->creador ? ($preg->creador->nombreCompleto ?? $preg->creador->usuario) : 'Estudiante',
                    'foro_titulo' => $preg->foro ? $preg->foro->titulo : 'Foro General',
                    'respuestas_count' => $preg->respuestas_count,
                    'fecha' => $preg->created_at ? $preg->created_at->diffForHumans() : 'Reciente',
                ];
            })
            ->toArray();
    }
}
