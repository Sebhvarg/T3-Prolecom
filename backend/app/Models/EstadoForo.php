<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoForo extends Model
{
    protected $table = 'estados_foro';

    protected $primaryKey = 'idEstadoForo';

    public $timestamps = false;

    protected $fillable = ['idEstadoForo', 'nombre'];
}
