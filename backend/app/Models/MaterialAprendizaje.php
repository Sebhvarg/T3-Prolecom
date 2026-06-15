<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaterialAprendizaje extends Model
{
    use HasFactory;

    protected $table = 'materiales_aprendizaje';
    protected $primaryKey = 'idMaterial';

    protected $fillable = [
        'titulo',
        'descripcion',
        'tipo',
        'enlaceArchivo',
        'idTema',
        'idUsuarioCreador',
    ];

    public function tema()
    {
        return $this->belongsTo(Tema::class, 'idTema', 'idTema');
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'idUsuarioCreador', 'idUsuario');
    }
}
