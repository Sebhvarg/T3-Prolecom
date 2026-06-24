<?php

namespace App\Strategies\CourseTemplate;

class CursoTemplateFactory
{
    /**
     * Obtiene la estrategia de plantilla adecuada para el lenguaje del curso.
     */
    public static function getStrategy(?string $lp): CursoTemplateStrategy
    {
        $language = strtolower(trim($lp ?? ''));

        switch ($language) {
            case 'python':
                return new PythonTemplateStrategy;
            default:
                return new DefaultTemplateStrategy;
        }
    }
}
