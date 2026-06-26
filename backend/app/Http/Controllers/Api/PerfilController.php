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
            return response()->json([
                'error' => $validator->errors()->first(),
            ], 400);
        }

        // 1. Verificar contraseña actual
        if (! Hash::check($request->password_actual, $user->password)) {
            return response()->json([
                'error' => 'La contraseña actual es incorrecta.',
            ], 401);
        }

        $nueva = $request->password_nuevo;

        // 2. Validar criterios de seguridad
        $criterioError = $this->validarCriterios($nueva, $user);
        if ($criterioError) {
            return response()->json(['error' => $criterioError], 422);
        }

        // 3. Verificar que no sea igual a las últimas N contraseñas
        $historial = DB::table('password_history')
            ->where('idUsuario', $user->idUsuario)
            ->orderByDesc('created_at')
            ->limit(self::HISTORY_LIMIT)
            ->pluck('password_hash');

        foreach ($historial as $hashAnterior) {
            if (Hash::check($nueva, $hashAnterior)) {
                return response()->json([
                    'error' => 'La nueva contraseña no puede ser igual a las últimas '.self::HISTORY_LIMIT.' contraseñas utilizadas.',
                ], 422);
            }
        }

        // 4. Guardar contraseña anterior en historial
        DB::table('password_history')->insert([
            'idUsuario' => $user->idUsuario,
            'password_hash' => $user->password, // hash actual antes de cambiar
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

        // 5. Actualizar la contraseña
        $user->update(['password' => Hash::make($nueva)]);

        return response()->json([
            'message' => '¡Contraseña actualizada correctamente!',
        ]);
    }

    private function validarCriterios(string $password, $user): ?string
    {
        // Sin espacios
        if ($password !== trim($password) || str_contains($password, ' ')) {
            return 'La contraseña no debe contener espacios en blanco.';
        }

        // Longitud mínima
        if (strlen($password) < 8) {
            return 'La contraseña debe tener al menos 8 caracteres.';
        }

        // Mayúscula
        if (! preg_match('/[A-Z]/', $password)) {
            return 'La contraseña debe contener al menos una letra mayúscula.';
        }

        // Minúscula
        if (! preg_match('/[a-z]/', $password)) {
            return 'La contraseña debe contener al menos una letra minúscula.';
        }

        // Número
        if (! preg_match('/[0-9]/', $password)) {
            return 'La contraseña debe contener al menos un número.';
        }

        // Carácter especial
        if (! preg_match('/[$@!#%*_~^&+\-\/\\\\]/', $password)) {
            return 'La contraseña debe contener al menos un carácter especial ($@!#%*_~^&).';
        }

        // Secuencias comunes — un solo pase con regex en lugar de foreach
        if (preg_match(self::COMMON_SEQUENCES_RE, $password)) {
            return 'La contraseña no debe contener secuencias comunes (123456, qwerty, password…).';
        }

        return null; // Todo OK
    }
}
