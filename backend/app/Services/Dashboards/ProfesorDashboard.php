<?php

namespace App\Services\Dashboards;

use App\Models\Curso;
use App\Models\Pregunta;
use App\Models\Solucion;
use App\Models\User;

class ProfesorDashboard extends BaseDashboard
{
    protected $usuario;

    public function __construct(User $usuario)
    {
        $this->usuario = $usuario;
    }

    protected function getSidebar(): array
    {
        return [
            ['name' => 'Principal', 'route' => '/profesor/dashboard'],
            ['name' => 'Cursos', 'route' => '/cursos'],

        ];
    }

    protected function getWidgets(): array
    {
        return [
            'cursos' => $this->getCursosData(),
            'actividad_reciente' => $this->getActividadReciente(),
        ];
    }

    protected function getCursosData(): array
    {
        return Curso::where('idProfeCreador', $this->usuario->idUsuario)
            ->withCount('estudiantes')
            ->get()
            ->map(function ($curso) {
                return [
                    'idCurso' => $curso->idCurso,
                    'titulo' => $curso->titulo,
                    'descripcion' => $curso->descripcion,
                    'lp' => $curso->lp,
                    'tipo' => $curso->tipo,
                    'estudiantes_count' => $curso->estudiantes_count,
                    'semanas' => 12,
                    'paralelo' => 10 + ($curso->idCurso % 5),
                ];
            })
            ->toArray();
    }

    protected function getActividadReciente(): array
    {
        $cursosProfe = Curso::where('idProfeCreador', $this->usuario->idUsuario)->pluck('idCurso')->toArray();
        $actPreguntas = $this->getActividadPreguntas($cursosProfe);
        $actSoluciones = $this->getActividadSoluciones($cursosProfe);

        return collect([...$actPreguntas, ...$actSoluciones])
            ->sortByDesc('timestamp')
            ->take(5)
            ->values()
            ->toArray();
    }

    private function getActividadPreguntas(array $cursosProfe): array
    {
        return Pregunta::whereHas('foro.itemTema.tema', function ($q) use ($cursosProfe) {
            $q->whereIn('idCurso', $cursosProfe);
        })
            ->with(['creador:idUsuario,nombreCompleto', 'foro.itemTema.tema.curso:idCurso,titulo'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($pregunta) {
                $nombreCompleto = $pregunta->creador->nombreCompleto ?? 'Estudiante';
                $primerNombre = explode(' ', $nombreCompleto)[0];
                $curso = $pregunta->foro?->itemTema?->tema?->curso;

                return [
                    'tipo' => 'foro',
                    'estudiante' => $primerNombre,
                    'detalle' => 'hizo una pregunta',
                    'titulo_actividad' => $pregunta->titulo,
                    'curso' => $curso ? $curso->titulo : 'Curso',
                    'paralelo' => 10 + (($curso ? $curso->idCurso : 0) % 5),
                    'fecha' => $pregunta->created_at ? $pregunta->created_at->toISOString() : now()->toISOString(),
                    'timestamp' => $pregunta->created_at ? $pregunta->created_at->timestamp : now()->timestamp,
                ];
            })->toArray();
    }

    private function getActividadSoluciones(array $cursosProfe): array
    {
        return Solucion::whereHas('desafio', function ($q) use ($cursosProfe) {
            $q->whereIn('idCurso', $cursosProfe);
        })
            ->with(['estudiante:idUsuario,nombreCompleto', 'desafio.curso'])
            ->where('estado', 'aprobado')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($solucion) {
                $nombreCompleto = $solucion->estudiante->nombreCompleto ?? 'Estudiante';
                $primerNombre = explode(' ', $nombreCompleto)[0];
                $desafio = $solucion->desafio;
                $cursoId = $desafio ? $desafio->idCurso : 0;
                $cursoTitulo = ($desafio && $desafio->curso) ? $desafio->curso->titulo : 'Curso';

                return [
                    'tipo' => 'desafio',
                    'estudiante' => $primerNombre,
                    'detalle' => 'completó',
                    'titulo_actividad' => $desafio ? $desafio->titulo : 'Actividad',
                    'curso' => $cursoTitulo,
                    'paralelo' => 10 + ($cursoId % 5),
                    'fecha' => $solucion->created_at ? $solucion->created_at->toISOString() : now()->toISOString(),
                    'timestamp' => $solucion->created_at ? $solucion->created_at->timestamp : now()->timestamp,
                ];
            })->toArray();
    }
}
