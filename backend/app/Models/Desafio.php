<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Desafio extends Model
{
    protected $table = 'desafios';
    protected $primaryKey = 'idDesafio';

    protected $fillable = [
        'titulo',
        'descripcionProblema',
        'dificultad',
        'testCases',
        'salidaEsperada',
        'estado',
        'idCreador',
        'idCurso'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'testCases' => 'array',
    ];

    public function creador()
    {
        return $this->belongsTo(Usuario::class, 'idCreador', 'idUsuario');
    }

    public function curso()
    {
        return $this->belongsTo(Curso::class, 'idCurso', 'idCurso');
    }

    public function soluciones()
    {
        return $this->hasMany(Solucion::class, 'idDesafio', 'idDesafio');
    }
}
