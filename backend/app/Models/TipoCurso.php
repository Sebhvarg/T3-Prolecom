<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoCurso extends Model
{
    protected $table = 'tipos_curso';

    protected $primaryKey = 'idTipoCurso';

    public $timestamps = false;

    protected $fillable = ['idTipoCurso', 'nombre'];
}
