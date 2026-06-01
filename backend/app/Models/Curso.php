<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Curso extends Model
{
    protected $table = 'cursos';
    protected $primaryKey = 'idCurso';

    protected $fillable = [
        'titulo',
        'descripcion',
        'lp',
        'tipo',
        'idProfeCreador'
    ];

    public function profesor()
    {
        return $this->belongsTo(Usuario::class, 'idProfeCreador', 'idUsuario');
    }

    public function temas()
    {
        return $this->hasMany(Tema::class, 'idCurso', 'idCurso');
    }

    public function estudiantes()
    {
        return $this->belongsToMany(Usuario::class, 'inscripciones_cursos', 'idCurso', 'idUsuarioEstudiante');
    }
}
