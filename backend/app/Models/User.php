<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected $table = 'usuarios';
    protected $primaryKey = 'idUsuario';

    protected $fillable = [
        'nombreCompleto',
        'usuario',
        'email',
        'password',
        'fechaDeNacimiento',
        'idEstado',
        'avatar_path',
        'xp',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function roles()
    {
        return $this->belongsToMany(Rol::class, 'rolUsuario', 'idUsuario', 'idRol');
    }

    public function estado()
    {
        return $this->belongsTo(EstadoCuenta::class, 'idEstado', 'idEstado');
    }

    public function cursosInscritos()
    {
        return $this->belongsToMany(Curso::class, 'inscripciones_cursos', 'idUsuarioEstudiante', 'idCurso')
                    ->withPivot('fechaInscripcion');
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
