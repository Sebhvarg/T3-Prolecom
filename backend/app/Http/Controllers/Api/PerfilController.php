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

        $validator = Validator::make($request->all(), [
            'password_actual' => 'required|string',
            'password_nuevo' => 'required|string',
            'password_confirmado' => 'required|string|same:password_nuevo',
        ], [
            'password_confirmado.same' => 'La confirmación no coincide con la nueva contraseña.',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $error = $this->verifyPasswordChange($user, $request->password_actual, $request->password_nuevo);
        if ($error) {
            return response()->json(['error' => $error['message']], $error['status']);
        }

        $this->updatePasswordAndHistory($user, $request->password_nuevo);

        return response()->json([
            'message' => '¡Contraseña actualizada correctamente!',
        ]);
    }

    private function verifyPasswordChange($user, string $actual, string $nueva): ?array
    {
        if (! Hash::check($actual, $user->password)) {
            return ['message' => 'La contraseña actual es incorrecta.', 'status' => 401];
        }

        $criterioError = $this->validarCriterios($nueva);
        if ($criterioError) {
            return ['message' => $criterioError, 'status' => 422];
        }

        if ($this->checkPasswordHistory($user->idUsuario, $nueva)) {
            return [
                'message' => 'La nueva contraseña no puede ser igual a las últimas '.self::HISTORY_LIMIT.' contraseñas utilizadas.',
                'status' => 422,
            ];
        }

        return null;
    }

    private function checkPasswordHistory($idUsuario, string $nueva): bool
    {
        $historial = DB::table('password_history')
            ->where('idUsuario', $idUsuario)
            ->orderByDesc('created_at')
            ->limit(self::HISTORY_LIMIT)
            ->pluck('password_hash');

        foreach ($historial as $hashAnterior) {
            if (Hash::check($nueva, $hashAnterior)) {
                return true;
            }
        }

        return false;
    }

    private function updatePasswordAndHistory($user, string $nueva): void
    {
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

        $user->update(['password' => Hash::make($nueva)]);
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
