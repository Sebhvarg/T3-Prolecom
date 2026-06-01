<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tema extends Model
{
    protected $table = 'temas';
    protected $primaryKey = 'idTema';

    protected $fillable = [
        'nombre',
        'descripcion',
        'idCurso'
    ];

    public function curso()
    {
        return $this->belongsTo(Curso::class, 'idCurso', 'idCurso');
    }

    public function materiales()
    {
        return $this->hasMany(MaterialAprendizaje::class, 'idTema', 'idTema');
    }
}
