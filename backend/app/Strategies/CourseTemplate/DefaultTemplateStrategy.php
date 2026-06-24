<?php

namespace App\Strategies\CourseTemplate;

use App\Models\Curso;

class DefaultTemplateStrategy implements CursoTemplateStrategy
{
    /**
     * No realiza ninguna acción por defecto.
     */
    public function loadTemplate(Curso $curso): void
    {
        // No se carga ninguna plantilla por defecto.
    }
}
