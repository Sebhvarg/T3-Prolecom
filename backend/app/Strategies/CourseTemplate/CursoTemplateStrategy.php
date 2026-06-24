<?php

namespace App\Strategies\CourseTemplate;

use App\Models\Curso;

interface CursoTemplateStrategy
{
    /**
     * Carga la plantilla de temas en el curso especificado.
     */
    public function loadTemplate(Curso $curso): void;
}
