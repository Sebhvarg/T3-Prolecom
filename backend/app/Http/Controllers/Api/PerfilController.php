<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class PerfilController extends Controller
{
    // Cuántas contraseñas anteriores recordar
    const HISTORY_LIMIT = 3;

    // Compilada una sola vez por el motor de PHP.
    // Las alternativas más largas van primero para que el motor las evalúe
    // antes que sus prefijos (ej. '12345678' antes que '1234567' antes que '123456').
    const COMMON_SEQUENCES_RE = '/123456789|12345678|1234567|123456|qwerty123|qwerty|asdfgh|zxcvbn|abcdef|contraseña|password|letmein|welcome|admin/i';

    public function cambiarPassword(Request $request)
    {
        $user = $request->user();
        $error = null;
        $status = 400;

        $validator = Validator::make($request->all(), [
            'password_actual' => 'required|string',
            'password_nuevo' => 'required|string',
            'password_confirmado' => 'required|string|same:password_nuevo',
        ], [
            'password_confirmado.same' => 'La confirmación no coincide con la nueva contraseña.',
        ]);

        if ($validator->fails()) {
            $error = $validator->errors()->first();
            $status = 400;
        } elseif (! Hash::check($request->password_actual, $user->password)) {
            $error = 'La contraseña actual es incorrecta.';
            $status = 401;
        } else {
            $nueva = $request->password_nuevo;
            $criterioError = $this->validarCriterios($nueva);
            if ($criterioError) {
                $error = $criterioError;
                $status = 422;
            } else {
                $historial = DB::table('password_history')
                    ->where('idUsuario', $user->idUsuario)
                    ->orderByDesc('created_at')
                    ->limit(self::HISTORY_LIMIT)
                    ->pluck('password_hash');

                foreach ($historial as $hashAnterior) {
                    if (Hash::check($nueva, $hashAnterior)) {
                        $error = 'La nueva contraseña no puede ser igual a las últimas '.self::HISTORY_LIMIT.' contraseñas utilizadas.';
                        $status = 422;
                        break;
                    }
                }

                if (! $error) {
                    // Guardar contraseña anterior en historial
                    DB::table('password_history')->insert([
                        'idUsuario' => $user->idUsuario,
                        'password_hash' => $user->password,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Mantener solo los últimos N registros por usuario
                    $idsAEliminar = DB::table('password_history')
                        ->where('idUsuario', $user->idUsuario)
                        ->orderByDesc('created_at')
                        ->skip(self::HISTORY_LIMIT)
                        ->pluck('id');

                    if ($idsAEliminar->isNotEmpty()) {
                        DB::table('password_history')->whereIn('id', $idsAEliminar)->delete();
                    }

                    // Actualizar la contraseña
                    $user->update(['password' => Hash::make($nueva)]);
                }
            }
        }

        if ($error !== null) {
            return response()->json(['error' => $error], $status);
        }

        return response()->json([
            'message' => '¡Contraseña actualizada correctamente!',
        ]);
    }

    private function validarCriterios(string $password): ?string
    {
        $reglas = [
            [
                'cumple' => $password === trim($password) && ! str_contains($password, ' '),
                'error' => 'La contraseña no debe contener espacios en blanco.',
            ],
            [
                'cumple' => strlen($password) >= 8,
                'error' => 'La contraseña debe tener al menos 8 caracteres.',
            ],
            [
                'cumple' => preg_match('/[A-Z]/', $password),
                'error' => 'La contraseña debe contener al menos una letra mayúscula.',
            ],
            [
                'cumple' => preg_match('/[a-z]/', $password),
                'error' => 'La contraseña debe contener al menos una letra minúscula.',
            ],
            [
                'cumple' => preg_match('/\d/', $password),
                'error' => 'La contraseña debe contener al menos un número.',
            ],
            [
                'cumple' => preg_match('/[$@!#%*_~^&+\-\/\\\\]/', $password),
                'error' => 'La contraseña debe contener al menos un carácter especial ($@!#%*_~^&).',
            ],
            [
                'cumple' => ! preg_match(self::COMMON_SEQUENCES_RE, $password),
                'error' => 'La contraseña no debe contener secuencias comunes (123456, qwerty, password…)..',
            ],
        ];

        foreach ($reglas as $regla) {
            if (! $regla['cumple']) {
                return $regla['error'];
            }
        }

        return null; // Válido
    }
}
