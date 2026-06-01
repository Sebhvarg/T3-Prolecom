<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Solucion extends Model
{
    protected $table = 'soluciones';
    protected $primaryKey = 'idSolucion';

    protected $fillable = [
        'codigoFuente',
        'fechaEntrega',
        'estado',
        'idEstudiante',
        'idDesafio'
    ];

    public function estudiante()
    {
        return $this->belongsTo(Usuario::class, 'idEstudiante', 'idUsuario');
    }

    public function desafio()
    {
        return $this->belongsTo(Desafio::class, 'idDesafio', 'idDesafio');
    }
}
