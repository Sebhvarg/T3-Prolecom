<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemTema extends Model
{
    use HasFactory;

    protected $table = 'items_tema';
    protected $primaryKey = 'idItemTema';

    protected $fillable = [
        'idTema',
        'itemable_type',
        'itemable_id',
        'orden',
    ];

    public function tema()
    {
        return $this->belongsTo(Tema::class, 'idTema', 'idTema');
    }

    public function itemable()
    {
        return $this->morphTo();
    }
}
