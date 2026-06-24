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

        if ($language === 'python') {
            return new PythonTemplateStrategy;
        }

        return new DefaultTemplateStrategy;
    }
}
