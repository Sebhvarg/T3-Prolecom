<?php

namespace App\Strategies\CourseTemplate;

use App\Models\Curso;

class PythonTemplateStrategy implements CursoTemplateStrategy
{
    /**
     * Carga los temas predefinidos para un curso de Python.
     */
    public function loadTemplate(Curso $curso): void
    {
        $temas = [
            'Introducción a la programación' => 'Conceptos fundamentales de programación y toma de contacto con Python.',
            'Variables y tipos de datos (strings y listas)' => 'Declaración de variables, tipos primitivos, manipulación de cadenas de texto y listas básicas.',
            'Funciones' => 'Definición de funciones, parámetros, valores de retorno y ámbito de variables.',
            'Estructuras de control' => 'Uso de condicionales (if, elif, else) y bucles (for, while) para controlar el flujo de ejecución.',
            'Colecciones' => 'Estructuras de datos avanzadas: tuplas, conjuntos (sets) y diccionarios.',
            'Arreglos n-dimensionales' => 'Introducción a arreglos estructurados y procesamiento matricial (conceptos clave).',
            'Archivos: entrada y salida' => 'Lectura y escritura de archivos locales de texto y manipulación de rutas.',
            'Procesamiento de datos' => 'Técnicas de análisis y manipulación de datos con estructuras básicas en Python.',
        ];

        foreach ($temas as $nombre => $descripcion) {
            $curso->temas()->create([
                'nombre' => $nombre,
                'descripcion' => $descripcion,
            ]);
        }
    }
}
