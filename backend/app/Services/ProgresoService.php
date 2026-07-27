<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * SCRUM-49 - Backend (PHP): Algoritmos de cálculo de progreso
 *
 * Fórmula de progreso total:
 *   progreso_total = (peso_desafios * % desafíos aprobados)
 *                  + (peso_materiales * % materiales vistos)
 *
 * Pesos:
 *   - Desafíos:   60%
 *   - Materiales: 40%
 */
class ProgresoService
{
    // Pesos de cada componente en el progreso total
    const PESO_DESAFIOS   = 0.60;
    const PESO_MATERIALES = 0.40;

    /**
     * Calcula el progreso completo de un estudiante en un curso.
     *
     * @param int $idCurso
     * @param int $idEstudiante
     * @return array
     */
    public function calcularProgreso(int $idCurso, int $idEstudiante): array
    {
        $progresoChallenges = $this->calcularProgresoDesafios($idCurso, $idEstudiante);
        $progresoMateriales = $this->calcularProgresoMateriales($idCurso, $idEstudiante);

        // Progreso total ponderado
        $total = round(
            ($progresoChallenges['porcentaje'] * self::PESO_DESAFIOS)
            + ($progresoMateriales['porcentaje'] * self::PESO_MATERIALES),
            2
        );

        return [
            'idCurso'           => $idCurso,
            'idEstudiante'      => $idEstudiante,
            'progreso_total'    => $total,
            'desafios'          => $progresoChallenges,
            'materiales'        => $progresoMateriales,
        ];
    }

    /**
     * SCRUM-49: Calcula el progreso basado en desafíos aprobados.
     * Un desafío se considera superado si el estudiante tiene al menos
     * una solución con estado = 'aprobado'.
     */
    public function calcularProgresoDesafios(int $idCurso, int $idEstudiante): array
    {
        // Total de desafíos publicados en el curso
        $total = DB::table('desafios')
            ->where('idCurso', $idCurso)
            ->where('estado', 'publicado')
            ->count();

        if ($total === 0) {
            return [
                'completados' => 0,
                'total'       => 0,
                'porcentaje'  => 0.0,
            ];
        }

        // Desafíos que el estudiante ha superado (al menos una solución aprobada)
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
            'total'       => $total,
            'porcentaje'  => $porcentaje,
        ];
    }

    /**
     * SCRUM-49: Calcula el progreso basado en materiales consumidos.
     * Un material se considera visto si existe un registro
     * en la tabla 'materiales_vistos' para ese estudiante.
     */
    public function calcularProgresoMateriales(int $idCurso, int $idEstudiante): array
    {
        // Total de materiales en el curso (a través de items_tema → temas → curso)
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
                'vistos'     => 0,
                'total'      => 0,
                'porcentaje' => 0.0,
            ];
        }

        // Materiales vistos por el estudiante
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
            'vistos'     => $vistos,
            'total'      => $total,
            'porcentaje' => $porcentaje,
        ];
    }
}