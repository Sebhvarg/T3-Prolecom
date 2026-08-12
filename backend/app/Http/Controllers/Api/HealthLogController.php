<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogActividad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class HealthLogController extends Controller
{
    public function index(Request $request)
    {
        // 1. Verificar salud del sistema (sin métrica de almacenamiento)
        $dbStatus = 'OK';
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            $dbStatus = 'Error: '.$e->getMessage();
        }

        $health = [
            'database' => $dbStatus,
            'php_version' => PHP_VERSION,
            'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2).' MB',
            'server_time' => now()->toIso8601String(),
        ];

        // 2. Logs de actividad de usuarios desde la BASE DE DATOS (logs_actividad)
        $dbActivityLogs = LogActividad::with('usuario:idUsuario,nombreCompleto,usuario,email')
            ->orderBy('idLog', 'desc')
            ->take(50)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->idLog,
                    'accion' => $log->accion,
                    'usuario' => $log->usuario->nombreCompleto ?? 'Usuario General',
                    'username' => $log->usuario->usuario ?? 'N/A',
                    'email' => $log->usuario->email ?? 'N/A',
                    'created_at' => $log->created_at ? $log->created_at->toDateTimeString() : now()->toDateTimeString(),
                    'time' => $log->created_at ? $log->created_at->diffForHumans() : 'Recientemente',
                ];
            });

        // 3. Leer y procesar logs del sistema (laravel.log)
        $logPath = storage_path('logs/laravel.log');
        $systemLogs = [];
        $summary = [
            'errors' => 0,
            'warnings' => 0,
            'info' => 0,
            'total' => count($dbActivityLogs),
        ];

        if (File::exists($logPath)) {
            $content = File::get($logPath);
            $lines = array_reverse(array_filter(explode("\n", $content)));

            $idCounter = 1;
            foreach ($lines as $line) {
                if (empty(trim($line))) {
                    continue;
                }

                if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s+([\w\-]+)\.(\w+):\s+(.*)$/', $line, $matches)) {
                    $timestamp = $matches[1];
                    $env = $matches[2];
                    $level = strtoupper($matches[3]);
                    $message = $matches[4];

                    if (str_contains($level, 'ERR') || str_contains($level, 'CRIT') || str_contains($level, 'EMERG')) {
                        $summary['errors']++;
                        $color = 'bg-red-600';
                    } elseif (str_contains($level, 'WARN')) {
                        $summary['warnings']++;
                        $color = 'bg-yellow-500';
                    } else {
                        $summary['info']++;
                        $color = 'bg-blue-600';
                    }

                    if (count($systemLogs) < 50) {
                        $systemLogs[] = [
                            'id' => $idCounter++,
                            'timestamp' => $timestamp,
                            'env' => $env,
                            'level' => $level,
                            'message' => Str::limit($message, 250),
                            'title' => "[{$level}] ".Str::limit($message, 120),
                            'time' => $timestamp,
                            'color' => $color,
                        ];
                    }
                }
            }
        }

        return response()->json([
            'health' => $health,
            'summary' => $summary,
            'activity_logs' => $dbActivityLogs,
            'system_logs' => $systemLogs,
            'logs' => $systemLogs, // Retrocompatibilidad
        ]);
    }
}
