<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Curso extends Model
{
    use HasFactory;

    protected $table = 'cursos';
    protected $primaryKey = 'idCurso';

    protected $fillable = [
        'titulo',
        'descripcion',
        'lp',
        'tipo',
        'idProfeCreador',
    ];

    public function creador()
    {
        return $this->belongsTo(User::class, 'idProfeCreador', 'idUsuario');
    }

    public function estudiantes()
    {
        return $this->belongsToMany(User::class, 'inscripciones_cursos', 'idCurso', 'idUsuarioEstudiante');
    }
}
