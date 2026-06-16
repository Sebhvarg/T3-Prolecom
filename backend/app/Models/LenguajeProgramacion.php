<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LenguajeProgramacion extends Model
{
    protected $table = 'lenguajes_programacion';
    protected $primaryKey = 'idLenguaje';

    protected $fillable = [
        'nombre',
        'slug',
        'icono',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    /**
     * Cursos que usan este lenguaje.
     */
    public function cursos()
    {
        return $this->hasMany(Curso::class, 'idLenguaje', 'idLenguaje');
    }
}
