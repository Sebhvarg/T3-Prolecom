<?php

namespace App\Services;

use App\Models\Desafio;
use App\Models\MaterialAprendizaje;
use App\Models\Quiz;
use Illuminate\Support\Facades\DB;

class ProgresoService
{
    const PESO_DESAFIOS = 0.50;

    const PESO_MATERIALES = 0.30;

    const PESO_QUIZZES = 0.20;

    public function calcularProgreso(int $idCurso, int $idEstudiante): array
    {
        $progresoChallenges = $this->calcularProgresoDesafios($idCurso, $idEstudiante);
        $progresoMateriales = $this->calcularProgresoMateriales($idCurso, $idEstudiante);
        $progresoQuizzes = $this->calcularProgresoQuizzes($idCurso, $idEstudiante);

        $sumaPesos = 0;
        $sumaProgreso = 0;

        if ($progresoChallenges['total'] > 0) {
            $sumaPesos += self::PESO_DESAFIOS;
            $sumaProgreso += ($progresoChallenges['porcentaje'] * self::PESO_DESAFIOS);
        }

        if ($progresoMateriales['total'] > 0) {
            $sumaPesos += self::PESO_MATERIALES;
            $sumaProgreso += ($progresoMateriales['porcentaje'] * self::PESO_MATERIALES);
        }

        if ($progresoQuizzes['total'] > 0) {
            $sumaPesos += self::PESO_QUIZZES;
            $sumaProgreso += ($progresoQuizzes['porcentaje'] * self::PESO_QUIZZES);
        }

        $total = $sumaPesos > 0 ? round($sumaProgreso / $sumaPesos, 1) : 0.0;

        return [
            'idCurso' => $idCurso,
            'idEstudiante' => $idEstudiante,
            'progreso_total' => $total,
            'desafios' => $progresoChallenges,
            'materiales' => $progresoMateriales,
            'quizzes' => $progresoQuizzes,
            'pendientes' => $this->obtenerPendientes($idCurso, $idEstudiante),
        ];
    }

    public function obtenerPendientes(int $idCurso, int $idEstudiante): array
    {
        // 1. Desafíos no completados
        $challengeIdsFromItems = DB::table('items_tema')
            ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
            ->where('temas.idCurso', $idCurso)
            ->where(function ($q) {
                $q->where('items_tema.itemable_type', Desafio::class)
                    ->orWhere('items_tema.itemable_type', 'Desafio')
                    ->orWhere('items_tema.itemable_type', 'desafio')
                    ->orWhere('items_tema.itemable_type', 'App\\Models\\Desafio');
            })
            ->pluck('items_tema.itemable_id')
            ->toArray();

        $challengeIdsDirect = DB::table('desafios')
            ->where('idCurso', $idCurso)
            ->pluck('idDesafio')
            ->toArray();

        $allChallengeIds = array_values(array_unique(array_filter(array_merge($challengeIdsFromItems, $challengeIdsDirect))));

        $aprobados = DB::table('soluciones')
            ->whereIn('idDesafio', $allChallengeIds)
            ->where('idEstudiante', $idEstudiante)
            ->where(function ($q) {
                $q->where('estado', 'aprobado')->orWhere('estado', 'Aprobado');
            })
            ->pluck('idDesafio')
            ->toArray();

        $pendingChallengeIds = array_diff($allChallengeIds, $aprobados);

        $pendingDesafios = DB::table('desafios')
            ->whereIn('idDesafio', $pendingChallengeIds)
            ->select('idDesafio as id', 'titulo', 'dificultad')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'tipo' => 'desafio',
                    'etiqueta' => 'Desafío de Código',
                    'titulo' => $item->titulo,
                    'detalle' => 'Dificultad: ' . ucfirst($item->dificultad ?? 'Normal'),
                ];
            })
            ->toArray();

        // 2. Materiales no vistos
        $materialIdsFromItems = DB::table('items_tema')
            ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
            ->where('temas.idCurso', $idCurso)
            ->where(function ($q) {
                $q->where('items_tema.itemable_type', MaterialAprendizaje::class)
                    ->orWhere('items_tema.itemable_type', 'MaterialAprendizaje')
                    ->orWhere('items_tema.itemable_type', 'material')
                    ->orWhere('items_tema.itemable_type', 'App\\Models\\MaterialAprendizaje');
            })
            ->pluck('items_tema.itemable_id')
            ->toArray();

        $materialIdsDirect = DB::table('materiales_aprendizaje')
            ->where('idCurso', $idCurso)
            ->pluck('idMaterial')
            ->toArray();

        $allMaterialIds = array_values(array_unique(array_filter(array_merge($materialIdsFromItems, $materialIdsDirect))));

        $vistosIds = DB::table('materiales_vistos')
            ->whereIn('idMaterial', $allMaterialIds)
            ->where('idEstudiante', $idEstudiante)
            ->pluck('idMaterial')
            ->toArray();

        $pendingMaterialIds = array_diff($allMaterialIds, $vistosIds);

        $pendingMateriales = DB::table('materiales_aprendizaje')
            ->whereIn('idMaterial', $pendingMaterialIds)
            ->select('idMaterial as id', 'titulo', 'tipo', 'archivo_url')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'tipo' => 'material',
                    'etiqueta' => 'Material de Lectura',
                    'titulo' => $item->titulo,
                    'detalle' => 'Formato: ' . strtoupper($item->tipo ?? 'PDF'),
                    'archivo_url' => $item->archivo_url,
                ];
            })
            ->toArray();

        // 3. Quizzes no completados
        $quizIdsFromItems = DB::table('items_tema')
            ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
            ->where('temas.idCurso', $idCurso)
            ->where(function ($q) {
                $q->where('items_tema.itemable_type', Quiz::class)
                    ->orWhere('items_tema.itemable_type', 'Quiz')
                    ->orWhere('items_tema.itemable_type', 'quiz')
                    ->orWhere('items_tema.itemable_type', 'App\\Models\\Quiz');
            })
            ->pluck('items_tema.itemable_id')
            ->toArray();

        $quizIdsDirect = DB::table('quizzes')
            ->where('idCurso', $idCurso)
            ->pluck('idQuiz')
            ->toArray();

        $allQuizIds = array_values(array_unique(array_filter(array_merge($quizIdsFromItems, $quizIdsDirect))));

        $completedQuizIds = DB::table('quizzes_intentos')
            ->whereIn('idQuiz', $allQuizIds)
            ->where('idEstudiante', $idEstudiante)
            ->where(function ($q) {
                $q->where('estado', 'completado')->orWhere('estado', 'Completado');
            })
            ->pluck('idQuiz')
            ->toArray();

        $pendingQuizIds = array_diff($allQuizIds, $completedQuizIds);

        $pendingQuizzes = DB::table('quizzes')
            ->whereIn('idQuiz', $pendingQuizIds)
            ->select('idQuiz as id', 'titulo')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'tipo' => 'quiz',
                    'etiqueta' => 'Evaluación / Quiz',
                    'titulo' => $item->titulo,
                    'detalle' => 'Cuestionario de Evaluación',
                ];
            })
            ->toArray();

        return array_values(array_merge($pendingDesafios, $pendingMateriales, $pendingQuizzes));
    }

    public function calcularProgresoDesafios(int $idCurso, int $idEstudiante): array
    {
        $challengeIdsFromItems = DB::table('items_tema')
            ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
            ->where('temas.idCurso', $idCurso)
            ->where(function ($q) {
                $q->where('items_tema.itemable_type', Desafio::class)
                    ->orWhere('items_tema.itemable_type', 'Desafio')
                    ->orWhere('items_tema.itemable_type', 'desafio')
                    ->orWhere('items_tema.itemable_type', 'App\\Models\\Desafio');
            })
            ->pluck('items_tema.itemable_id')
            ->toArray();

        $challengeIdsDirect = DB::table('desafios')
            ->where('idCurso', $idCurso)
            ->pluck('idDesafio')
            ->toArray();

        $allChallengeIds = array_values(array_unique(array_filter(array_merge($challengeIdsFromItems, $challengeIdsDirect))));
        $total = count($allChallengeIds);

        if ($total === 0) {
            return [
                'completados' => 0,
                'total' => 0,
                'porcentaje' => 0.0,
            ];
        }

        $completados = DB::table('soluciones')
            ->whereIn('idDesafio', $allChallengeIds)
            ->where('idEstudiante', $idEstudiante)
            ->where(function ($q) {
                $q->where('estado', 'aprobado')->orWhere('estado', 'Aprobado');
            })
            ->distinct('idDesafio')
            ->count('idDesafio');

        $porcentaje = round(($completados / $total) * 100, 1);

        return [
            'completados' => $completados,
            'total' => $total,
            'porcentaje' => $porcentaje,
        ];
    }

    public function calcularProgresoMateriales(int $idCurso, int $idEstudiante): array
    {
        $materialIdsFromItems = DB::table('items_tema')
            ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
            ->where('temas.idCurso', $idCurso)
            ->where(function ($q) {
                $q->where('items_tema.itemable_type', MaterialAprendizaje::class)
                    ->orWhere('items_tema.itemable_type', 'MaterialAprendizaje')
                    ->orWhere('items_tema.itemable_type', 'material')
                    ->orWhere('items_tema.itemable_type', 'App\\Models\\MaterialAprendizaje');
            })
            ->pluck('items_tema.itemable_id')
            ->toArray();

        $materialIdsDirect = DB::table('materiales_aprendizaje')
            ->where('idCurso', $idCurso)
            ->pluck('idMaterial')
            ->toArray();

        $allMaterialIds = array_values(array_unique(array_filter(array_merge($materialIdsFromItems, $materialIdsDirect))));
        $total = count($allMaterialIds);

        if ($total === 0) {
            return [
                'vistos' => 0,
                'total' => 0,
                'porcentaje' => 0.0,
            ];
        }

        $vistos = DB::table('materiales_vistos')
            ->whereIn('idMaterial', $allMaterialIds)
            ->where('idEstudiante', $idEstudiante)
            ->distinct('idMaterial')
            ->count('idMaterial');

        $porcentaje = round(($vistos / $total) * 100, 1);

        return [
            'vistos' => $vistos,
            'total' => $total,
            'porcentaje' => $porcentaje,
        ];
    }

    public function calcularProgresoQuizzes(int $idCurso, int $idEstudiante): array
    {
        $quizIdsFromItems = DB::table('items_tema')
            ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
            ->where('temas.idCurso', $idCurso)
            ->where(function ($q) {
                $q->where('items_tema.itemable_type', Quiz::class)
                    ->orWhere('items_tema.itemable_type', 'Quiz')
                    ->orWhere('items_tema.itemable_type', 'quiz')
                    ->orWhere('items_tema.itemable_type', 'App\\Models\\Quiz');
            })
            ->pluck('items_tema.itemable_id')
            ->toArray();

        $quizIdsDirect = DB::table('quizzes')
            ->where('idCurso', $idCurso)
            ->pluck('idQuiz')
            ->toArray();

        $allQuizIds = array_values(array_unique(array_filter(array_merge($quizIdsFromItems, $quizIdsDirect))));
        $total = count($allQuizIds);

        if ($total === 0) {
            return [
                'completados' => 0,
                'total' => 0,
                'porcentaje' => 0.0,
            ];
        }

        $completados = DB::table('quizzes_intentos')
            ->whereIn('idQuiz', $allQuizIds)
            ->where('idEstudiante', $idEstudiante)
            ->where(function ($q) {
                $q->where('estado', 'completado')->orWhere('estado', 'Completado');
            })
            ->distinct('idQuiz')
            ->count('idQuiz');

        $porcentaje = round(($completados / $total) * 100, 1);

        return [
            'completados' => $completados,
            'total' => $total,
            'porcentaje' => $porcentaje,
        ];
    }
}
