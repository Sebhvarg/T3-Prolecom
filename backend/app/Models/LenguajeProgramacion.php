<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LenguajeProgramacion extends Model
{
    use HasFactory;

    protected $table = 'lenguajes_programacion';
    protected $primaryKey = 'idLenguaje';

    protected $fillable = [
        'nombre',
        'judge0_id',
        'activo',
    ];
}
