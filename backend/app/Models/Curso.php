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
        'idCategoria',
        'idProfeCreador',
    ];

    public function creador()
    {
        return $this->belongsTo(User::class, 'idProfeCreador', 'idUsuario');
    }

    public function categoria()
    {
        return $this->belongsTo(CategoriaCurso::class, 'idCategoria', 'idCategoria');
    }

    public function estudiantes()
    {
        return $this->belongsToMany(User::class, 'inscripciones_cursos', 'idCurso', 'idUsuarioEstudiante')
            ->withPivot('fechaInscripcion');
    }

    public function ayudantes()
    {
        return $this->belongsToMany(User::class, 'ayudantes_cursos', 'idCurso', 'idUsuarioAyudante')
            ->withTimestamps();
    }

    public function moderadores()
    {
        return $this->belongsToMany(User::class, 'moderadores_cursos', 'idCurso', 'idUsuarioModerador')
            ->withTimestamps();
    }

    public function temas()
    {
        return $this->hasMany(Tema::class, 'idCurso', 'idCurso');
    }
}
