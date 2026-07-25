<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class Judge0Service
{
    private const REDIRECT_STDERR = ' 2>&1';

    private const COMPILATION_ERROR = 'Compilation Error';

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
        } elseif (! empty($this->token)) {
            $headers['X-Auth-Token'] = $this->token;
        }

        return $headers;
    }

    /**
     * Prepara y compila el código fuente para ejecución local.
     */
    private function prepararComandoLocal(int $languageId, string $sourceCode, string $tmpDir, string $id): array
    {
        $result = [];

        if ($languageId === 63) { // JavaScript
            $srcFile = "{$tmpDir}/{$id}.js";
            file_put_contents($srcFile, $sourceCode);
            $result = ['cmd' => 'node '.escapeshellarg($srcFile), 'cleanFiles' => [$srcFile], 'err' => null];
        } elseif (in_array($languageId, [48, 49, 50, 75])) { // C
            $result = $this->compilarCCpp('gcc', 'c', $sourceCode, $tmpDir, $id);
        } elseif (in_array($languageId, [52, 53, 54, 76])) { // C++
            $result = $this->compilarCCpp('g++', 'cpp', $sourceCode, $tmpDir, $id);
        } elseif ($languageId === 62) { // Java
            $result = $this->compilarJava($sourceCode, $tmpDir);
        } else { // Default Python (71, 70, etc.)
            $srcFile = "{$tmpDir}/{$id}.py";
            file_put_contents($srcFile, $sourceCode);
            $result = ['cmd' => 'python3 '.escapeshellarg($srcFile), 'cleanFiles' => [$srcFile], 'err' => null];
        }

        return $result;
    }

    private function compilarJava(string $sourceCode, string $tmpDir): array
    {
        $srcFile = "{$tmpDir}/Main.java";
        file_put_contents($srcFile, $sourceCode);
        exec('javac '.escapeshellarg($srcFile).self::REDIRECT_STDERR, $compileErr, $compileRes);
        if ($compileRes !== 0) {
            @unlink($srcFile);

            return ['cmd' => '', 'cleanFiles' => [], 'err' => $this->buildCompileErrorResult($compileErr)];
        }

        return ['cmd' => 'java -cp '.escapeshellarg($tmpDir).' Main', 'cleanFiles' => [$srcFile, "{$tmpDir}/Main.class"], 'err' => null];
    }

    private function compilarCCpp(string $compiler, string $ext, string $sourceCode, string $tmpDir, string $id): array
    {
        $srcFile = "{$tmpDir}/{$id}.{$ext}";
        $binFile = "{$tmpDir}/{$id}.out";
        file_put_contents($srcFile, $sourceCode);
        exec("{$compiler} -O2 ".escapeshellarg($srcFile).' -o '.escapeshellarg($binFile).self::REDIRECT_STDERR, $compileErr, $compileRes);
        if ($compileRes !== 0) {
            @unlink($srcFile);

            return ['cmd' => '', 'cleanFiles' => [], 'err' => $this->buildCompileErrorResult($compileErr)];
        }

        return ['cmd' => escapeshellarg($binFile), 'cleanFiles' => [$srcFile, $binFile], 'err' => null];
    }

    private function buildCompileErrorResult(array $compileErr): array
    {
        return [
            'status' => ['id' => 6, 'description' => self::COMPILATION_ERROR],
            'time' => '0.0',
            'memory' => 0,
            'stdout' => '',
            'stderr' => implode("\n", $compileErr),
        ];
    }

    /**
     * Evalúa el código localmente cuando no hay un servidor de Judge0 configurado.
     */
    private function ejecutarLocalmente(int $languageId, string $sourceCode, ?string $expectedOutput, ?string $stdin): array
    {
        $tmpDir = sys_get_temp_dir();
        $id = uniqid('code_');

        $prepared = $this->prepararComandoLocal($languageId, $sourceCode, $tmpDir, $id);
        if ($prepared['err'] !== null) {
            return $prepared['err'];
        }

        $result = $this->ejecutarProcesoComando($prepared['cmd'], $expectedOutput, $stdin);

        foreach ($prepared['cleanFiles'] as $f) {
            @unlink($f);
        }

        return $result;
    }

    private function ejecutarProcesoComando(string $cmd, ?string $expectedOutput, ?string $stdin): array
    {
        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $startTime = microtime(true);
        $process = proc_open($cmd, $descriptors, $pipes);

        if (! is_resource($process)) {
            return [
                'status' => ['id' => 13, 'description' => 'Internal Error'],
                'stdout' => null,
                'stderr' => 'No se pudo iniciar el proceso de ejecución local.',
            ];
        }

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

        if ($returnCode !== 0 || ! empty($stderr)) {
            return [
                'status' => [
                    'id' => 11,
                    'description' => 'Runtime Error',
                ],
                'time' => (string) $executionTime,
                'memory' => 1024,
                'stdout' => $stdout,
                'stderr' => $stderr ?: "Error de ejecución con código de salida $returnCode",
            ];
        }

        $trimOutput = function ($str) {
            return implode("\n", array_map('rtrim', explode("\n", trim((string) $str))));
        };

        $passed = ($expectedOutput === null) || ($trimOutput($stdout) === $trimOutput($expectedOutput));

        return [
            'status' => [
                'id' => $passed ? 3 : 4,
                'description' => $passed ? 'Accepted' : 'Wrong Answer',
            ],
            'time' => (string) $executionTime,
            'memory' => 1024,
            'stdout' => $stdout,
            'stderr' => null,
        ];
    }
}
