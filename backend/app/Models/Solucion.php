<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Solucion extends Model
{
    use HasFactory;

    protected $table = 'soluciones';

    protected $primaryKey = 'idSolucion';

    protected $fillable = [
        'codigoFuente',
        'estado',
        'idEstudiante',
        'idDesafio',
        'idLenguaje',
        'casos_pasados',
        'casos_totales',
        'tiempo_ejecucion_ms',
        'memoria_ejecucion_kb',
        'stdout',
        'stderr',
        'puntos_otorgados',
    ];

    public function estudiante()
    {
        return $this->belongsTo(User::class, 'idEstudiante', 'idUsuario');
    }

    public function desafio()
    {
        return $this->belongsTo(Desafio::class, 'idDesafio', 'idDesafio');
    }

    public function lenguaje()
    {
        return $this->belongsTo(LenguajeProgramacion::class, 'idLenguaje', 'idLenguaje');
    }
}
