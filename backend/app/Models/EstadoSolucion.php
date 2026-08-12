<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoSolucion extends Model
{
    protected $table = 'estados_solucion';

    protected $primaryKey = 'idEstadoSolucion';

    public $timestamps = false;

    protected $fillable = ['idEstadoSolucion', 'nombre'];
}
