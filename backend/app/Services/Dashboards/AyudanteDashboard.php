<?php

namespace App\Services\Dashboards;

use App\Models\Curso;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Solucion;
use App\Models\User;

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

    protected function getWidgets(): array
    {
        return [
            'metricas_ayudantia' => $this->getMetricasAyudantia(),
            'cursos' => $this->getCursosData(),
            'preguntas_pendientes' => $this->getPreguntasPendientes(),
            'actividad_reciente' => $this->getActividadReciente(),
        ];
    }

    protected function getMetricasAyudantia(): array
    {
        $respuestasValidadas = Respuesta::where('idUsuario', $this->usuario->idUsuario)
            ->where('validada', true)
            ->count();

        $misRespuestasTotal = Respuesta::where('idUsuario', $this->usuario->idUsuario)->count();

        $preguntasAbiertas = Pregunta::where('estado', 'abierta')->count();

        $totalCursos = Curso::count();

        return [
            'respuestas_validadas' => $respuestasValidadas,
            'mis_respuestas' => $misRespuestasTotal,
            'preguntas_abiertas' => $preguntasAbiertas,
            'cursos_activos' => $totalCursos,
        ];
    }

    protected function getCursosData(): array
    {
        $query = Curso::withCount('estudiantes');

        if (\Illuminate\Support\Facades\Schema::hasTable('ayudantes_cursos')) {
            $query->whereHas('ayudantes', function ($q) {
                $q->where('usuarios.idUsuario', $this->usuario->idUsuario);
            });
        }

        return $query->latest()
            ->get()
            ->map(function ($curso) {
                return [
                    'idCurso' => $curso->idCurso,
                    'titulo' => $curso->titulo,
                    'descripcion' => $curso->descripcion,
                    'lp' => $curso->lp,
                    'tipo' => $curso->tipo,
                    'estudiantes_count' => $curso->estudiantes_count,
                    'profesor' => $curso->creador ? $curso->creador->nombreCompleto : 'Docente Cátedra',
                ];
            })
            ->toArray();
    }

    protected function getPreguntasPendientes(): array
    {
        return Pregunta::where('estado', 'abierta')
            ->with(['creador:idUsuario,nombreCompleto,usuario', 'foro:idForo,titulo'])
            ->withCount('respuestas')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($preg) {
                return [
                    'idPregunta' => $preg->idPregunta,
                    'idForo' => $preg->idForo,
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

    protected function getActividadReciente(): array
    {
        $preguntas = Pregunta::with('creador:idUsuario,nombreCompleto')
            ->latest()
            ->take(4)
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

        $soluciones = Solucion::with(['estudiante:idUsuario,nombreCompleto', 'desafio:idDesafio,titulo'])
            ->where('estado', 'aprobado')
            ->latest()
            ->take(4)
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

        return $preguntas->concat($soluciones)
            ->sortByDesc('timestamp')
            ->take(6)
            ->values()
            ->toArray();
    }
}
