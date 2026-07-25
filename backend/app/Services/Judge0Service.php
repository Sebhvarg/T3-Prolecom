<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class Judge0Service
{
    protected $baseUrl;

    protected $token;

    protected $host;

    public function __construct()
    {
        $this->baseUrl = config('services.judge0.url', '');
        $this->token = config('services.judge0.url') ? config('services.judge0.token', '') : '';
        $this->host = config('services.judge0.host', 'judge0-ce.p.rapidapi.com');
    }

    /**
     * Envía el código a Judge0 para ser evaluado.
     * Si no hay URL configurada, corre en modo Simulación/Mock para facilitar pruebas locales.
     */
    public function submitCode(int $languageId, string $sourceCode, ?string $expectedOutput = null, ?string $stdin = null)
    {
        // Si no está configurada la URL de Judge0, ejecutamos el código localmente de forma inteligente
        if (empty($this->baseUrl)) {
            Log::info('Judge0Service: Corriendo en modo Simulación Inteligente.');

            return $this->ejecutarLocalmente($languageId, $sourceCode, $expectedOutput, $stdin);
        }

        $payload = [
            'language_id' => $languageId,
            'source_code' => $sourceCode,
            'enable_per_process_and_thread_memory_limit' => false,
            'enable_per_process_and_thread_time_limit' => false,
        ];

        if ($expectedOutput !== null) {
            $payload['expected_output'] = $expectedOutput;
        }

        if ($stdin !== null) {
            $payload['stdin'] = $stdin;
        }

        $result = ['error' => 'Fallo interno al compilar.'];

        try {
            $request = Http::withHeaders($this->getHeaders());

            // Petición síncrona con wait=true
            $response = $request->post($this->baseUrl.'/submissions?base64_encoded=false&wait=true', $payload);

            if ($response->successful()) {
                $result = $response->json();
            } else {
                Log::error('Error de Judge0: '.$response->body());
                $result = ['error' => 'No se pudo conectar con el motor de compilación.'];
            }

        } catch (\Exception $e) {
            Log::error('Excepción en Judge0Service: '.$e->getMessage());
        }

        return $result;
    }

    private function getHeaders()
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];

        if (str_contains($this->baseUrl, 'rapidapi.com')) {
            $headers['X-RapidAPI-Key'] = $this->token;
            $headers['X-RapidAPI-Host'] = $this->host;
        } else {
            if (! empty($this->token)) {
                $headers['X-Auth-Token'] = $this->token;
            }
        }

        return $headers;
    }

    /**
     * Evalúa el código localmente cuando no hay un servidor de Judge0 configurado.
     */
    private function ejecutarLocalmente(int $languageId, string $sourceCode, ?string $expectedOutput, ?string $stdin): array
    {
        $tmpDir = sys_get_temp_dir();
        $id = uniqid('code_');

        // Determinar lenguaje y comando
        if ($languageId === 63) { // JavaScript
            $srcFile = "{$tmpDir}/{$id}.js";
            file_put_contents($srcFile, $sourceCode);
            $cmd = 'node ' . escapeshellarg($srcFile);
            $cleanFiles = [$srcFile];
        } elseif (in_array($languageId, [48, 49, 50, 75])) { // C
            $srcFile = "{$tmpDir}/{$id}.c";
            $binFile = "{$tmpDir}/{$id}.out";
            file_put_contents($srcFile, $sourceCode);
            exec("gcc -O2 " . escapeshellarg($srcFile) . " -o " . escapeshellarg($binFile) . " 2>&1", $compileErr, $compileRes);
            if ($compileRes !== 0) {
                @unlink($srcFile);
                return [
                    'status' => ['id' => 6, 'description' => 'Compilation Error'],
                    'time' => '0.0', 'memory' => 0, 'stdout' => '',
                    'stderr' => implode("\n", $compileErr),
                ];
            }
            $cmd = escapeshellarg($binFile);
            $cleanFiles = [$srcFile, $binFile];
        } elseif (in_array($languageId, [52, 53, 54, 76])) { // C++
            $srcFile = "{$tmpDir}/{$id}.cpp";
            $binFile = "{$tmpDir}/{$id}.out";
            file_put_contents($srcFile, $sourceCode);
            exec("g++ -O2 " . escapeshellarg($srcFile) . " -o " . escapeshellarg($binFile) . " 2>&1", $compileErr, $compileRes);
            if ($compileRes !== 0) {
                @unlink($srcFile);
                return [
                    'status' => ['id' => 6, 'description' => 'Compilation Error'],
                    'time' => '0.0', 'memory' => 0, 'stdout' => '',
                    'stderr' => implode("\n", $compileErr),
                ];
            }
            $cmd = escapeshellarg($binFile);
            $cleanFiles = [$srcFile, $binFile];
        } elseif ($languageId === 62) { // Java
            $srcFile = "{$tmpDir}/Main.java";
            file_put_contents($srcFile, $sourceCode);
            exec("javac " . escapeshellarg($srcFile) . " 2>&1", $compileErr, $compileRes);
            if ($compileRes !== 0) {
                @unlink($srcFile);
                return [
                    'status' => ['id' => 6, 'description' => 'Compilation Error'],
                    'time' => '0.0', 'memory' => 0, 'stdout' => '',
                    'stderr' => implode("\n", $compileErr),
                ];
            }
            $cmd = 'java -cp ' . escapeshellarg($tmpDir) . ' Main';
            $cleanFiles = [$srcFile, "{$tmpDir}/Main.class"];
        } else { // Default Python (71, 70, etc.)
            $srcFile = "{$tmpDir}/{$id}.py";
            file_put_contents($srcFile, $sourceCode);
            $cmd = 'python3 ' . escapeshellarg($srcFile);
            $cleanFiles = [$srcFile];
        }

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $startTime = microtime(true);
        $process = proc_open($cmd, $descriptors, $pipes);

        if (is_resource($process)) {
            if ($stdin !== null) {
                fwrite($pipes[0], $stdin);
            }
            fclose($pipes[0]);

            $stdout = stream_get_contents($pipes[1]);
            fclose($pipes[1]);

            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[2]);

            $returnCode = proc_close($process);
            $executionTime = round(microtime(true) - $startTime, 2);

            foreach ($cleanFiles as $f) {
                @unlink($f);
            }

            if ($returnCode !== 0 || !empty($stderr)) {
                return [
                    'status' => [
                        'id' => 11, // Error de Ejecución
                        'description' => 'Runtime Error',
                    ],
                    'time' => (string)$executionTime,
                    'memory' => 1024,
                    'stdout' => $stdout,
                    'stderr' => $stderr ?: "Error de ejecución con código de salida $returnCode",
                ];
            }

            $trimOutput = function ($str) {
                return implode("\n", array_map('rtrim', explode("\n", trim((string)$str))));
            };

            $passed = ($expectedOutput === null) || ($trimOutput($stdout) === $trimOutput($expectedOutput));

            return [
                'status' => [
                    'id' => $passed ? 3 : 4, // 3 = Accepted, 4 = Wrong Answer
                    'description' => $passed ? 'Accepted' : 'Wrong Answer',
                ],
                'time' => (string)$executionTime,
                'memory' => 1024,
                'stdout' => $stdout,
                'stderr' => null,
            ];
        }

        foreach ($cleanFiles as $f) {
            @unlink($f);
        }

        return [
            'status' => ['id' => 13, 'description' => 'Internal Error'],
            'stdout' => null,
            'stderr' => 'No se pudo iniciar el proceso de ejecución local.',
        ];
    }
}

