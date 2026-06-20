<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Desafio extends Model
{
    use HasFactory;

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
        'idCurso',
        'puntos',
        'starter_code',
    ];

    protected $casts = [
        'testCases' => 'array',
    ];

    public function creador()
    {
        return $this->belongsTo(User::class, 'idCreador', 'idUsuario');
    }

    public function curso()
    {
        return $this->belongsTo(Curso::class, 'idCurso', 'idCurso');
    }
}
