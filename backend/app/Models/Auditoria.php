<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Auditoria extends Model
{
    use HasFactory;

    protected $table = 'auditorias';

    protected $primaryKey = 'idAuditoria';

    protected $fillable = [
        'idUsuario',
        'nombreUsuario',
        'rolUsuario',
        'accion',
        'entidad',
        'entidad_id',
        'detalles',
        'ip_address',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }
}
