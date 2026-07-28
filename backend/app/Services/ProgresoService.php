<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ProgresoService
{
    const PESO_DESAFIOS = 0.60;

    const PESO_MATERIALES = 0.40;

    public function calcularProgreso(int $idCurso, int $idEstudiante): array
    {
        $progresoChallenges = $this->calcularProgresoDesafios($idCurso, $idEstudiante);
        $progresoMateriales = $this->calcularProgresoMateriales($idCurso, $idEstudiante);

        $total = round(
            ($progresoChallenges['porcentaje'] * self::PESO_DESAFIOS)
            + ($progresoMateriales['porcentaje'] * self::PESO_MATERIALES),
            2
        );

        return [
            'idCurso' => $idCurso,
            'idEstudiante' => $idEstudiante,
            'progreso_total' => $total,
            'desafios' => $progresoChallenges,
            'materiales' => $progresoMateriales,
        ];
    }

    public function calcularProgresoDesafios(int $idCurso, int $idEstudiante): array
    {
        $total = DB::table('desafios')
            ->where('idCurso', $idCurso)
            ->where('estado', 'publicado')
            ->count();

        if ($total === 0) {
            return [
                'completados' => 0,
                'total' => 0,
                'porcentaje' => 0.0,
            ];
        }

        $completados = DB::table('desafios')
            ->join('soluciones', 'desafios.idDesafio', '=', 'soluciones.idDesafio')
            ->where('desafios.idCurso', $idCurso)
            ->where('desafios.estado', 'publicado')
            ->where('soluciones.idEstudiante', $idEstudiante)
            ->where('soluciones.estado', 'aprobado')
            ->distinct('desafios.idDesafio')
            ->count('desafios.idDesafio');

        $porcentaje = round(($completados / $total) * 100, 2);

        return [
            'completados' => $completados,
            'total' => $total,
            'porcentaje' => $porcentaje,
        ];
    }

    public function calcularProgresoMateriales(int $idCurso, int $idEstudiante): array
    {
        $total = DB::table('materiales_aprendizaje')
            ->join('items_tema', function ($join) {
                $join->on('materiales_aprendizaje.idMaterial', '=', 'items_tema.itemable_id')
                    ->where('items_tema.itemable_type', '=', 'App\\Models\\MaterialAprendizaje');
            })
            ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
            ->where('temas.idCurso', $idCurso)
            ->count();

        if ($total === 0) {
            return [
                'vistos' => 0,
                'total' => 0,
                'porcentaje' => 0.0,
            ];
        }

        $vistos = DB::table('materiales_vistos')
            ->join('materiales_aprendizaje', 'materiales_vistos.idMaterial', '=', 'materiales_aprendizaje.idMaterial')
            ->join('items_tema', function ($join) {
                $join->on('materiales_aprendizaje.idMaterial', '=', 'items_tema.itemable_id')
                    ->where('items_tema.itemable_type', '=', 'App\\Models\\MaterialAprendizaje');
            })
            ->join('temas', 'items_tema.idTema', '=', 'temas.idTema')
            ->where('temas.idCurso', $idCurso)
            ->where('materiales_vistos.idEstudiante', $idEstudiante)
            ->count();

        $porcentaje = round(($vistos / $total) * 100, 2);

        return [
            'vistos' => $vistos,
            'total' => $total,
            'porcentaje' => $porcentaje,
        ];
    }
}