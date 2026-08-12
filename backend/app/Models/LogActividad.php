<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogActividad extends Model
{
    protected $table = 'logs_actividad';

    protected $primaryKey = 'idLog';

    protected $fillable = [
        'accion',
        'idUsuario',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }
}
