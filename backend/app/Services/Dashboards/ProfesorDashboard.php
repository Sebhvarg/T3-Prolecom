<?php

namespace App\Services\Dashboards;

use App\Models\User;
use App\Models\Curso;
use App\Models\Pregunta;
use App\Models\Solucion;

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
            ['name' => 'Chat', 'route' => '/chat'],
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

        // 1. Obtener últimas preguntas
        $preguntas = Pregunta::whereIn('idCurso', $cursosProfe)
            ->with(['creador:idUsuario,nombreCompleto', 'curso:idCurso,titulo'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($pregunta) {
                $nombreCompleto = $pregunta->creador->nombreCompleto ?? 'Estudiante';
                $primerNombre = explode(' ', $nombreCompleto)[0];
                return [
                    'tipo' => 'foro',
                    'estudiante' => $primerNombre,
                    'detalle' => 'hizo una pregunta',
                    'titulo_actividad' => $pregunta->titulo,
                    'curso' => $pregunta->curso->titulo ?? 'Curso',
                    'paralelo' => 10 + (($pregunta->idCurso ?? 0) % 5),
                    'fecha' => $pregunta->created_at ? $pregunta->created_at->toISOString() : now()->toISOString(),
                    'timestamp' => $pregunta->created_at ? $pregunta->created_at->timestamp : now()->timestamp,
                ];
            });

        // 2. Obtener últimas soluciones aprobadas
        $soluciones = Solucion::whereHas('desafio', function ($q) use ($cursosProfe) {
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
            $cursoId = $solucion->desafio->idCurso ?? 0;
            $cursoTitulo = $solucion->desafio->curso->titulo ?? 'Curso';
            return [
                'tipo' => 'desafio',
                'estudiante' => $primerNombre,
                'detalle' => 'completó',
                'titulo_actividad' => $solucion->desafio->titulo ?? 'Actividad',
                'curso' => $cursoTitulo,
                'paralelo' => 10 + ($cursoId % 5),
                'fecha' => $solucion->created_at ? $solucion->created_at->toISOString() : now()->toISOString(),
                'timestamp' => $solucion->created_at ? $solucion->created_at->timestamp : now()->timestamp,
            ];
        });

        // Combinar y ordenar por más reciente
        return collect()
            ->merge($preguntas)
            ->merge($soluciones)
            ->sortByDesc('timestamp')
            ->take(4) // El mock muestra 4 actividades
            ->values()
            ->toArray();
    }
}
