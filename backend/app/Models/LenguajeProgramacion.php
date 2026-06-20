<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LenguajeProgramacion extends Model
{
    use HasFactory;

    protected $table = 'lenguajes_programacion';
    protected $primaryKey = 'idLenguaje';

    protected $fillable = [
        'nombre',
        'slug',
        'judge0_id',
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
