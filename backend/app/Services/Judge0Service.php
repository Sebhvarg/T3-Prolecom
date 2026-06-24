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
        $this->baseUrl = env('JUDGE0_URL', '');
        $this->token = env('JUDGE0_TOKEN', '');
        $this->host = env('JUDGE0_HOST', 'judge0-ce.p.rapidapi.com');
    }

    /**
     * Envía el código a Judge0 para ser evaluado.
     * Si no hay URL configurada, corre en modo Simulación/Mock para facilitar pruebas locales.
     */
    public function submitCode(int $languageId, string $sourceCode, ?string $expectedOutput = null, ?string $stdin = null)
    {
        // Si no está configurada la URL de Judge0, simulamos una compilación exitosa
        if (empty($this->baseUrl)) {
            Log::info('Judge0Service: Corriendo en modo Simulación (sin JUDGE0_URL).');

            return [
                'status' => [
                    'id' => 3, // 3 = Accepted
                    'description' => 'Accepted',
                ],
                'time' => '0.05',
                'memory' => 1250,
                'stdout' => $expectedOutput ?? "OK\n",
                'stderr' => null,
            ];
        }

        $payload = [
            'language_id' => $languageId,
            'source_code' => $sourceCode,
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
}
