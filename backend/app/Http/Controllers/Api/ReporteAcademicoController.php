<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use App\Models\Respuesta;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReporteAcademicoController extends Controller
{
    private const DATE_FORMAT = 'Y-m-d H:i:s';

    /**
     * Reporte general de Cursos.
     * Retorna datos estructurados en JSON o genera una descarga CSV si ?export=csv.
     */
    public function reporteCursos(Request $request)
    {
        $user = $request->user();
        $roles = $user->roles->pluck('rol');

        $query = Curso::withCount('estudiantes')->with('creador:idUsuario,nombreCompleto,email');

        if ($roles->contains('Profesor') && ! $roles->contains('Administrador')) {
            $query->where('idProfeCreador', $user->idUsuario);
        } elseif ($roles->contains('Ayudante') && ! $roles->contains('Administrador')) {
            $assignedIds = Schema::hasTable('ayudantes_cursos')
                ? DB::table('ayudantes_cursos')->where('idUsuarioAyudante', $user->idUsuario)->pluck('idCurso')->toArray()
                : [];
            $query->whereIn('idCurso', $assignedIds);
        }

        $cursos = $query->latest()->get()->map(function ($curso) {
            $desafiosCount = DB::table('desafios')->where('idCurso', $curso->idCurso)->count();
            $quizzesCount = DB::table('quizzes')->where('idCurso', $curso->idCurso)->count();
            $ayudantesCount = Schema::hasTable('ayudantes_cursos')
                ? DB::table('ayudantes_cursos')->where('idCurso', $curso->idCurso)->count()
                : 0;

            return [
                'idCurso' => $curso->idCurso,
                'titulo' => $curso->titulo,
                'descripcion' => $curso->descripcion,
                'lenguaje' => $curso->lp ?? $curso->lenguaje ?? 'Programación',
                'tipo' => $curso->tipo ?? 'Público',
                'profesor' => $curso->creador ? $curso->creador->nombreCompleto : 'Docente Cátedra',
                'profesor_email' => $curso->creador ? $curso->creador->email : 'N/A',
                'estudiantes_matriculados' => $curso->estudiantes_count,
                'desafios_totales' => $desafiosCount,
                'quizzes_totales' => $quizzesCount,
                'ayudantes_asignados' => $ayudantesCount,
                'fecha_creacion' => $curso->created_at ? $curso->created_at->format(self::DATE_FORMAT) : 'N/A',
            ];
        });

        if ($request->query('export') === 'csv') {
            return $this->exportToCsv(
                'reporte_cursos_prolecom_'.date('Y-m-d').'.csv',
                ['ID Curso', 'Título', 'Lenguaje', 'Tipo', 'Profesor Creador', 'Email Profesor', 'Estudiantes Matriculados', 'Desafíos', 'Quizzes', 'Ayudantes', 'Fecha Creación'],
                $cursos->map(fn ($c) => [
                    $c['idCurso'],
                    $c['titulo'],
                    $c['lenguaje'],
                    $c['tipo'],
                    $c['profesor'],
                    $c['profesor_email'],
                    $c['estudiantes_matriculados'],
                    $c['desafios_totales'],
                    $c['quizzes_totales'],
                    $c['ayudantes_asignados'],
                    $c['fecha_creacion'],
                ])->toArray()
            );
        }

        return response()->json([
            'titulo' => 'Reporte de Cursos de la Plataforma',
            'fecha_generacion' => now()->format(self::DATE_FORMAT),
            'total_registros' => $cursos->count(),
            'data' => $cursos,
        ]);
    }

    /**
     * Helper para filtrar la consulta de estudiantes por rol.
     */
    private function filterEstudiantesByRole($query, $user, $roles): void
    {
        if ($roles->contains('Profesor') && ! $roles->contains('Administrador')) {
            $cursosProfeIds = Curso::where('idProfeCreador', $user->idUsuario)->pluck('idCurso')->toArray();
            $query->whereHas('cursosInscritos', fn ($q) => $q->whereIn('cursos.idCurso', $cursosProfeIds));
        } elseif ($roles->contains('Ayudante') && ! $roles->contains('Administrador')) {
            $assignedIds = Schema::hasTable('ayudantes_cursos')
                ? DB::table('ayudantes_cursos')->where('idUsuarioAyudante', $user->idUsuario)->pluck('idCurso')->toArray()
                : [];
            $query->whereHas('cursosInscritos', fn ($q) => $q->whereIn('cursos.idCurso', $assignedIds));
        }
    }

    /**
     * Reporte general de Estudiantes y su progreso.
     */
    public function reporteEstudiantes(Request $request)
    {
        $user = $request->user();
        $roles = $user->roles->pluck('rol');

        $query = User::whereHas('roles', fn ($q) => $q->where('rol', 'Estudiante'))->withCount('cursosInscritos');

        $this->filterEstudiantesByRole($query, $user, $roles);

        $estudiantes = $query->latest()->get()->map(function ($est) {
            $solucionesAprobadas = DB::table('soluciones')
                ->where('idEstudiante', $est->idUsuario)
                ->where('estado', 'aprobado')
                ->count();

            $intentosQuizzes = Schema::hasTable('quiz_intentos')
                ? DB::table('quiz_intentos')
                    ->where(function ($q) use ($est) {
                        if (Schema::hasColumn('quiz_intentos', 'idEstudiante')) {
                            $q->where('idEstudiante', $est->idUsuario);
                        }
                        if (Schema::hasColumn('quiz_intentos', 'idUsuario')) {
                            $q->orWhere('idUsuario', $est->idUsuario);
                        }
                    })
                    ->count()
                : 0;

            $estadoTexto = match ((int) $est->idEstado) {
                1 => 'Activo',
                2 => 'Inactivo',
                3 => 'Suspendido',
                4 => 'Baneado',
                default => 'Desconocido',
            };

            return [
                'idUsuario' => $est->idUsuario,
                'nombreCompleto' => $est->nombreCompleto,
                'usuario' => $est->usuario,
                'email' => $est->email,
                'xp' => $est->xp ?? 0,
                'cursos_inscritos' => $est->cursos_inscritos_count,
                'desafios_completados' => $solucionesAprobadas,
                'quizzes_realizados' => $intentosQuizzes,
                'estado' => $estadoTexto,
                'fecha_registro' => $est->created_at ? $est->created_at->format(self::DATE_FORMAT) : 'N/A',
            ];
        });

        if ($request->query('export') === 'csv') {
            return $this->exportToCsv(
                'reporte_estudiantes_prolecom_'.date('Y-m-d').'.csv',
                ['ID Usuario', 'Nombre Completo', 'Usuario', 'Email', 'XP Acumulado', 'Cursos Inscritos', 'Desafíos Completados', 'Quizzes Realizados', 'Estado', 'Fecha Registro'],
                $estudiantes->map(fn ($e) => [
                    $e['idUsuario'],
                    $e['nombreCompleto'],
                    $e['usuario'],
                    $e['email'],
                    $e['xp'],
                    $e['cursos_inscritos'],
                    $e['desafios_completados'],
                    $e['quizzes_realizados'],
                    $e['estado'],
                    $e['fecha_registro'],
                ])->toArray()
            );
        }

        return response()->json([
            'titulo' => 'Reporte de Estudiantes y Rendimiento Académico',
            'fecha_generacion' => now()->format(self::DATE_FORMAT),
            'total_registros' => $estudiantes->count(),
            'data' => $estudiantes,
        ]);
    }

    /**
     * Helper para filtrar la consulta de ayudantes por rol.
     */
    private function filterAyudantesByRole($query, $user, $roles): void
    {
        if ($roles->contains('Profesor') && ! $roles->contains('Administrador')) {
            $cursosProfeIds = Curso::where('idProfeCreador', $user->idUsuario)->pluck('idCurso')->toArray();
            if (Schema::hasTable('ayudantes_cursos')) {
                $ayudantesIds = DB::table('ayudantes_cursos')->whereIn('idCurso', $cursosProfeIds)->pluck('idUsuarioAyudante')->toArray();
                $query->whereIn('idUsuario', $ayudantesIds);
            }
        } elseif ($roles->contains('Ayudante') && ! $roles->contains('Administrador')) {
            $query->where('idUsuario', $user->idUsuario);
        }
    }

    /**
     * Reporte general de Ayudantes de Cátedra.
     */
    public function reporteAyudantes(Request $request)
    {
        $user = $request->user();
        $roles = $user->roles->pluck('rol');

        $query = User::where(function ($q) {
            $q->whereHas('roles', fn ($r) => $r->whereIn('rol', ['Ayudante', 'ayudante']));
            if (Schema::hasTable('ayudantes_cursos')) {
                $ayudantesPivotIds = DB::table('ayudantes_cursos')->pluck('idUsuarioAyudante')->toArray();
                if (! empty($ayudantesPivotIds)) {
                    $q->orWhereIn('idUsuario', array_unique($ayudantesPivotIds));
                }
            }
        });

        $this->filterAyudantesByRole($query, $user, $roles);

        $ayudantes = $query->latest()->get()->map(function ($ayu) {
            $cursosAsignadosCount = 0;
            $nombresCursos = [];

            if (Schema::hasTable('ayudantes_cursos')) {
                $cursosAsignados = DB::table('ayudantes_cursos')
                    ->join('cursos', 'ayudantes_cursos.idCurso', '=', 'cursos.idCurso')
                    ->where('ayudantes_cursos.idUsuarioAyudante', $ayu->idUsuario)
                    ->select('cursos.titulo')
                    ->get();

                $cursosAsignadosCount = $cursosAsignados->count();
                $nombresCursos = $cursosAsignados->pluck('titulo')->toArray();
            }

            $respuestasValidadas = Respuesta::where('idUsuario', $ayu->idUsuario)
                ->where('validada', true)
                ->count();

            $totalAportesForo = Respuesta::where('idUsuario', $ayu->idUsuario)->count();

            return [
                'idUsuario' => $ayu->idUsuario,
                'nombreCompleto' => $ayu->nombreCompleto,
                'usuario' => $ayu->usuario,
                'email' => $ayu->email,
                'cursos_asignados_count' => $cursosAsignadosCount,
                'cursos_asignados' => ! empty($nombresCursos) ? implode(', ', $nombresCursos) : 'Sin cursos asignados',
                'respuestas_validadas_oficiales' => $respuestasValidadas,
                'total_aportes_foro' => $totalAportesForo,
                'fecha_registro' => $ayu->created_at ? $ayu->created_at->format(self::DATE_FORMAT) : 'N/A',
            ];
        });

        if ($request->query('export') === 'csv') {
            return $this->exportToCsv(
                'reporte_ayudantes_prolecom_'.date('Y-m-d').'.csv',
                ['ID Ayudante', 'Nombre Completo', 'Usuario', 'Email', 'Cursos Asignados (Cant.)', 'Lista de Cursos', 'Respuestas Validadas Oficiales', 'Total Aportes Foro', 'Fecha Registro'],
                $ayudantes->map(fn ($a) => [
                    $a['idUsuario'],
                    $a['nombreCompleto'],
                    $a['usuario'],
                    $a['email'],
                    $a['cursos_asignados_count'],
                    $a['cursos_asignados'],
                    $a['respuestas_validadas_oficiales'],
                    $a['total_aportes_foro'],
                    $a['fecha_registro'],
                ])->toArray()
            );
        }

        return response()->json([
            'titulo' => 'Reporte de Ayudantes de Cátedra y Mentorías',
            'fecha_generacion' => now()->format(self::DATE_FORMAT),
            'total_registros' => $ayudantes->count(),
            'data' => $ayudantes,
        ]);
    }

    /**
     * Helper para exportar arreglos de datos a formato CSV estándar.
     */
    private function exportToCsv(string $filename, array $headers, array $rows)
    {
        $callback = function () use ($headers, $rows) {
            $file = fopen('php://output', 'w');
            // BOM para compatibilidad con Excel en UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($file, $headers);

            foreach ($rows as $row) {
                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ]);
    }
}
