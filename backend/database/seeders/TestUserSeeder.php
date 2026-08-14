<?php

namespace Database\Seeders;

use App\Models\Desafio;
use App\Models\Foro;
use App\Models\MaterialAprendizaje;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            LenguajesProgramacionSeeder::class,
            RolesAndStatesSeeder::class,
        ]);

        // 1. Core Users (Admin, Profesor, Ayudante, Estudiantes)
        $users = $this->seedCoreUsers();

        // 2. Courses
        $courses = $this->seedCourses($users['profesor']);

        // 3. Enroll students
        $this->enrollStudents($courses['course1'], $courses['course2'], $users);

        // 4. Topics (Temas/Módulos) for Course 1
        $temas = $this->seedTopics($courses['course1']);

        // 5. Materials (PDFs / Videos) + items_tema
        $this->seedMaterials($users['profesor'], $temas['tema1'], $temas['tema2']);

        // 6. Challenges (Desafíos) + items_tema
        $this->seedChallenges($users['profesor'], $courses['course1'], $temas['tema1'], $temas['tema2']);

        // 7. Foros (Itemable) + items_tema
        $foros = $this->seedForos($users['profesor'], $users['ayudante'], $temas['tema1'], $temas['tema2'], $temas['tema3']);

        // 8. Questions & Answers in Foros
        $this->seedQuestionsAndAnswers($foros, $users);

        // 9. Quizzes de prueba (PB19-Quizzes)
        $this->seedQuizzes($users, $courses['course1'], $temas['tema1']);

        // 10. Extra students to reach ~35 students
        $this->seedExtraStudents($courses['course1'], $courses['course2']);
    }

    private function seedCoreUsers(): array
    {
        // 1. Admin Global
        $adminId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Administrador Global',
            'usuario' => 'admin',
            'email' => 'admin@prolecom.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '1990-01-01',
            'idEstado' => 1,
            'xp' => 1500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $adminId, 'idRol' => 1]); // Admin

        // 2. Profesor
        $profesorId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Dra. María Pérez',
            'usuario' => 'profesor',
            'email' => 'profesor@espol.edu.ec',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '1985-05-15',
            'idEstado' => 1,
            'xp' => 800,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $profesorId, 'idRol' => 3]); // Profesor

        // 3. Ayudante (TA)
        $ayudanteId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Ing. Carlos Mendoza',
            'usuario' => 'ayudante',
            'email' => 'ayudante@espol.edu.ec',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '1998-03-20',
            'idEstado' => 1,
            'xp' => 450,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $ayudanteId, 'idRol' => 5]); // Ayudante

        // 4. Estudiante principal
        $estudianteId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Estudiante Autodidacta',
            'usuario' => 'estudiante',
            'email' => 'estudiante@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2002-08-07',
            'idEstado' => 1,
            'xp' => 200,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $estudianteId, 'idRol' => 6]); // Estudiante

        // 5. Estudiantes adicionales
        $juanId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Juan Silva',
            'usuario' => 'juan',
            'email' => 'juan@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2002-01-10',
            'idEstado' => 1,
            'xp' => 320,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $juanId, 'idRol' => 6]); // Estudiante

        $karlaId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Karla Gómez',
            'usuario' => 'karla',
            'email' => 'karla@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2001-07-22',
            'idEstado' => 1,
            'xp' => 510,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $karlaId, 'idRol' => 6]);

        $alexId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Alex Torres',
            'usuario' => 'alex',
            'email' => 'alex@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2002-11-05',
            'idEstado' => 1,
            'xp' => 180,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $alexId, 'idRol' => 6]);

        $teresaId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Teresa Ríos',
            'usuario' => 'teresa',
            'email' => 'teresa@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2001-04-14',
            'idEstado' => 1,
            'xp' => 290,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $teresaId, 'idRol' => 6]);

        // 6. Moderador
        $moderadorId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Lic. Roberto Moderador',
            'usuario' => 'moderador',
            'email' => 'moderador@prolecom.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '1988-09-12',
            'idEstado' => 1,
            'xp' => 600,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $moderadorId, 'idRol' => 2]); // Moderador

        return [
            'admin' => $adminId,
            'profesor' => $profesorId,
            'ayudante' => $ayudanteId,
            'estudiante' => $estudianteId,
            'juan' => $juanId,
            'karla' => $karlaId,
            'alex' => $alexId,
            'teresa' => $teresaId,
            'moderador' => $moderadorId,
        ];
    }

    private function seedCourses(int $profesorId): array
    {
        $course1Id = DB::table('cursos')->insertGetId([
            'titulo' => 'Fundamentos de Programación con Python',
            'descripcion' => 'Aprende los conceptos fundamentales de la programación estructurada y orientada a objetos en Python.',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $profesorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $course2Id = DB::table('cursos')->insertGetId([
            'titulo' => 'Estructuras de Datos y Algoritmos en C++',
            'descripcion' => 'Curso avanzado de estructuras lineales, árboles y grafos optimizados.',
            'lp' => 'C++',
            'tipo' => 'público',
            'idProfeCreador' => $profesorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['course1' => $course1Id, 'course2' => $course2Id];
    }

    private function enrollStudents(int $c1, int $c2, array $users): void
    {
        foreach (['estudiante', 'juan', 'karla', 'alex', 'teresa'] as $stKey) {
            DB::table('inscripciones_cursos')->insertOrIgnore([
                'idUsuarioEstudiante' => $users[$stKey],
                'idCurso' => $c1,
                'fechaInscripcion' => now(),
            ]);
            DB::table('inscripciones_cursos')->insertOrIgnore([
                'idUsuarioEstudiante' => $users[$stKey],
                'idCurso' => $c2,
                'fechaInscripcion' => now(),
            ]);
        }
    }

    private function seedTopics(int $courseId): array
    {
        $t1 = DB::table('temas')->insertGetId([
            'nombre' => 'Tema 1: Sintaxis y Control de Flujo',
            'descripcion' => 'Variables, condicionales if/else, bucles for y while.',
            'idCurso' => $courseId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $t2 = DB::table('temas')->insertGetId([
            'nombre' => 'Tema 2: Funciones y Modularidad',
            'descripcion' => 'Parámetros, retornos, scope de variables y lambda expressions.',
            'idCurso' => $courseId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $t3 = DB::table('temas')->insertGetId([
            'nombre' => 'Tema 3: Recursión y Algoritmos Clásicos',
            'descripcion' => 'Casos base, recursión simple y doble, fibonacci y torres de hanoi.',
            'idCurso' => $courseId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['tema1' => $t1, 'tema2' => $t2, 'tema3' => $t3];
    }

    private function seedMaterials(int $profesorId, int $t1, int $t2): void
    {
        // PDF Tema 1
        $mat1Id = DB::table('materiales_aprendizaje')->insertGetId([
            'titulo' => 'Guía Completa de Bucles y Condicionales',
            'descripcion' => 'Documento guía explicativo con diagramas de flujo y ejemplos.',
            'tipo' => 'PDF',
            'enlaceArchivo' => 'materials/guia_bucles.pdf',
            'idUsuarioCreador' => $profesorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('items_tema')->insert([
            'idTema' => $t1,
            'itemable_type' => MaterialAprendizaje::class,
            'itemable_id' => $mat1Id,
            'orden' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Video Tema 2
        $mat2Id = DB::table('materiales_aprendizaje')->insertGetId([
            'titulo' => 'Clase Grabada: Funciones y Scope',
            'descripcion' => 'Explicación paso a paso del ámbito de variables y funciones puras.',
            'tipo' => 'video',
            'enlaceArchivo' => 'materials/clase_funciones.mp4',
            'idUsuarioCreador' => $profesorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('items_tema')->insert([
            'idTema' => $t2,
            'itemable_type' => MaterialAprendizaje::class,
            'itemable_id' => $mat2Id,
            'orden' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedChallenges(int $profesorId, int $c1, int $t1, int $t2): array
    {
        $d1Id = DB::table('desafios')->insertGetId([
            'titulo' => 'Invertir una Cadena de Texto',
            'descripcionProblema' => 'Escribe una función que tome una cadena de texto y la devuelva invertida sin usar slicing directo [::-1].',
            'dificultad' => 'Easy',
            'testCases' => json_encode([
                ['input' => 'hola', 'expected_output' => 'aloh', 'is_hidden' => false],
                ['input' => 'python', 'expected_output' => 'nohtyp', 'is_hidden' => true],
            ]),
            'salidaEsperada' => 'OK',
            'estado' => 'publicado',
            'idCreador' => $profesorId,
            'idCurso' => $c1,
            'puntos' => 10,
            'starter_code' => "def invertir_cadena(s):\n    # Tu código aquí\n    pass\n",
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('items_tema')->insert([
            'idTema' => $t1,
            'itemable_type' => Desafio::class,
            'itemable_id' => $d1Id,
            'orden' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $d2Id = DB::table('desafios')->insertGetId([
            'titulo' => 'Contador de Palabras Clave',
            'descripcionProblema' => 'Dada una lista de frases, cuenta cuántas veces aparece cada palabra clave.',
            'dificultad' => 'Medium',
            'testCases' => json_encode([
                ['input' => '["hola mundo", "hola espol"]', 'expected_output' => '{"hola": 2, "mundo": 1, "espol": 1}', 'is_hidden' => false],
            ]),
            'salidaEsperada' => 'OK',
            'estado' => 'publicado',
            'idCreador' => $profesorId,
            'idCurso' => $c1,
            'puntos' => 20,
            'starter_code' => "def contar_palabras(frases):\n    # Tu código aquí\n    pass\n",
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('items_tema')->insert([
            'idTema' => $t2,
            'itemable_type' => Desafio::class,
            'itemable_id' => $d2Id,
            'orden' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('soluciones')->insert([
            [
                'idDesafio' => $d1Id,
                'idEstudiante' => $users['teresa'],
                'codigoEnviado' => "def invertir_cadena(s):\n    return s[::-1]\n",
                'estado' => 'aprobado',
                'resultadoEjecucion' => 'Todos los casos de prueba pasaron correctamente.',
                'puntosOtorgados' => 10,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
            [
                'idDesafio' => $d2Id,
                'idEstudiante' => $users['karla'],
                'codigoEnviado' => "def contar_palabras(frases):\n    return {'hola': 2}\n",
                'estado' => 'aprobado',
                'resultadoEjecucion' => 'Todos los casos de prueba pasaron correctamente.',
                'puntosOtorgados' => 20,
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1),
            ],
        ]);

        return ['d1' => $d1Id, 'd2' => $d2Id];
    }

    private function seedForos(int $profesorId, int $ayudanteId, int $t1, int $t2, int $t3): array
    {
        // Foro 1 en Tema 1
        $f1Id = DB::table('foros')->insertGetId([
            'titulo' => '💬 Foro: Consultas sobre Bucles y Condicionales',
            'descripcion' => 'Espacio para resolver cualquier duda sobre el primer tema. Pregunta sin miedo.',
            'idUsuarioCreador' => $profesorId,
            'estado' => 'abierto',
            'created_at' => now()->subDays(5),
            'updated_at' => now()->subDays(5),
        ]);
        DB::table('items_tema')->insert([
            'idTema' => $t1,
            'itemable_type' => Foro::class,
            'itemable_id' => $f1Id,
            'orden' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Foro 2 en Tema 2
        $f2Id = DB::table('foros')->insertGetId([
            'titulo' => '💬 Foro: Dudas de Funciones y Ámbito de Variables',
            'descripcion' => 'Resuelve aquí tus dudas sobre funciones, paso de argumentos por valor/referencia y scopes.',
            'idUsuarioCreador' => $ayudanteId,
            'estado' => 'abierto',
            'created_at' => now()->subDays(3),
            'updated_at' => now()->subDays(3),
        ]);
        DB::table('items_tema')->insert([
            'idTema' => $t2,
            'itemable_type' => Foro::class,
            'itemable_id' => $f2Id,
            'orden' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Foro 3 en Tema 3
        $f3Id = DB::table('foros')->insertGetId([
            'titulo' => '💬 Foro: Q&A Recursión y Casos Base',
            'descripcion' => 'Comparte tus razonamientos sobre casos base y casos recursivos.',
            'idUsuarioCreador' => $profesorId,
            'estado' => 'abierto',
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);
        DB::table('items_tema')->insert([
            'idTema' => $t3,
            'itemable_type' => Foro::class,
            'itemable_id' => $f3Id,
            'orden' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['f1' => $f1Id, 'f2' => $f2Id, 'f3' => $f3Id];
    }

    private function seedQuestionsAndAnswers(array $foros, array $users): void
    {
        // ─────────────────────────────────────────────────────────────────
        // Pregunta 1 (Fijada/Pinned por el profesor en Foro 1)
        // ─────────────────────────────────────────────────────────────────
        $p1Id = DB::table('preguntas')->insertGetId([
            'titulo' => '📌 Instrucciones y Preguntas Frecuentes del Foro de Bucles',
            'descripcion' => "Bienvenidos al foro del Tema 1. Recuerden seguir el formato académico:\n\n```python\n# Siempre adjunten snippets de su código en este formato\nfor i in range(10):\n    print(i)\n```\n\n¿Tienes dudas sobre `range()` o `while`? ¡Haz tu consulta abajo!",
            'idUsuarioCreador' => $users['profesor'],
            'idForo' => $foros['f1'],
            'estado' => 'resuelta',
            'fijada' => true,
            'vistas' => 142,
            'created_at' => now()->subDays(4),
            'updated_at' => now()->subDays(4),
        ]);

        // Respuestas a Pregunta 1
        $r1Id = DB::table('respuestas')->insertGetId([
            'contenido' => "Excelente iniciativa profesora. Una duda común de mis compañeros es la diferencia entre `range(10)` y `range(1, 11)`.\n\nEn Python `range(a, b)` genera valores desde `a` hasta `b - 1` (exclusivo). Por ejemplo:\n```python\nprint(list(range(1, 6)))\n# Salida: [1, 2, 3, 4, 5]\n```",
            'idUsuario' => $users['ayudante'],
            'idPregunta' => $p1Id,
            'validada' => true, // Respuesta oficial
            'created_at' => now()->subDays(4)->addHours(2),
            'updated_at' => now()->subDays(4)->addHours(2),
        ]);

        // Votos en r1
        DB::table('votos_respuestas')->insert([
            ['idUsuario' => $users['juan'], 'idRespuesta' => $r1Id, 'valor' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['idUsuario' => $users['karla'], 'idRespuesta' => $r1Id, 'valor' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['idUsuario' => $users['alex'], 'idRespuesta' => $r1Id, 'valor' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ─────────────────────────────────────────────────────────────────
        // Pregunta 2 (Por el estudiante Juan en Foro 1)
        // ─────────────────────────────────────────────────────────────────
        $p2Id = DB::table('preguntas')->insertGetId([
            'titulo' => '¿Por qué mi bucle while se queda colgado infinitamente?',
            'descripcion' => "Hola a todos, estoy intentando sumar los números del 1 al 10 pero el programa se queda en bucle infinito:\n\n```python\ni = 1\nsuma = 0\nwhile i <= 10:\n    suma += i\n    # ¿Falta algo aquí?\nprint('La suma es:', suma)\n```\n\n¿Alguien me ayuda a encontrar el error?",
            'idUsuarioCreador' => $users['juan'],
            'idForo' => $foros['f1'],
            'estado' => 'resuelta',
            'fijada' => false,
            'vistas' => 58,
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        // Respuesta 1 a Pregunta 2 (Karla)
        $r2aId = DB::table('respuestas')->insertGetId([
            'contenido' => "¡Hola Juan! Te falta incrementar la variable de control `i` dentro del cuerpo del `while`. Si no la incrementas, `i` siempre vale `1`, por lo que `i <= 10` siempre será verdadero.\n\nSolo agrega `i += 1` al final del bucle:\n```python\ni = 1\nsuma = 0\nwhile i <= 10:\n    suma += i\n    i += 1  # Incremento necesario\nprint('La suma es:', suma)\n```",
            'idUsuario' => $users['karla'],
            'idPregunta' => $p2Id,
            'validada' => true, // Respuesta Oficial validada por la profesora
            'created_at' => now()->subDays(2)->addHours(1),
            'updated_at' => now()->subDays(2)->addHours(1),
        ]);

        // Votos en r2a
        DB::table('votos_respuestas')->insert([
            ['idUsuario' => $users['alex'], 'idRespuesta' => $r2aId, 'valor' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['idUsuario' => $users['teresa'], 'idRespuesta' => $r2aId, 'valor' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['idUsuario' => $users['ayudante'], 'idRespuesta' => $r2aId, 'valor' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ─────────────────────────────────────────────────────────────────
        // Pregunta 3 (Por el estudiante Alex en Foro 3 — Recursión)
        // ─────────────────────────────────────────────────────────────────
        $p3Id = DB::table('preguntas')->insertGetId([
            'titulo' => 'Duda con el Caso Base en Recursión: RecursionError: maximum recursion depth exceeded',
            'descripcion' => "Hola Dra. María, estoy haciendo la función del factorial recursivo pero me sale un error de profundidad de recursión sobrepasada:\n\n```python\ndef factorial(n):\n    return n * factorial(n - 1)\n\nprint(factorial(5))\n```\n\n¿Por qué sucede este desbordamiento si estoy restando `n - 1`?",
            'idUsuarioCreador' => $users['alex'],
            'idForo' => $foros['f3'],
            'estado' => 'abierta',
            'fijada' => false,
            'vistas' => 31,
            'created_at' => now()->subHours(5),
            'updated_at' => now()->subHours(5),
        ]);

        // Respuesta del profesor en Pregunta 3
        $r3Id = DB::table('respuestas')->insertGetId([
            'contenido' => "¡Hola Alex! Tu función sigue restando `n - 1` indefinidamente (5, 4, 3, 2, 1, 0, -1, -2...) porque **no definiste un Caso Base** para detener la recursión.\n\nToda función recursiva debe tener al menos una condición de parada (el caso base). Para el factorial, sabemos que `0! = 1` y `1! = 1`:\n\n```python\ndef factorial(n):\n    if n <= 1:\n        return 1  # Caso Base\n    return n * factorial(n - 1)  # Caso Recursivo\n\nprint(factorial(5)) # Devuelve 120\n```",
            'idUsuario' => $users['profesor'],
            'idPregunta' => $p3Id,
            'validada' => true,
            'created_at' => now()->subHours(3),
            'updated_at' => now()->subHours(3),
        ]);

        // Votos en r3
        DB::table('votos_respuestas')->insert([
            ['idUsuario' => $users['juan'], 'idRespuesta' => $r3Id, 'valor' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['idUsuario' => $users['karla'], 'idRespuesta' => $r3Id, 'valor' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['idUsuario' => $users['alex'], 'idRespuesta' => $r3Id, 'valor' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['idUsuario' => $users['teresa'], 'idRespuesta' => $r3Id, 'valor' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ─────────────────────────────────────────────────────────────────
        // Seed Notificaciones de demostración
        // ─────────────────────────────────────────────────────────────────
        DB::table('notificaciones')->insert([
            [
                'idUsuario' => $users['alex'],
                'tipo' => 'respuesta_validada',
                'titulo' => '¡Tu respuesta fue marcada como Oficial! ✅',
                'mensaje' => 'La Dra. María Pérez marcó tu respuesta como Respuesta Oficial.',
                'leida' => false,
                'datos' => json_encode(['idPregunta' => $p3Id, 'idForo' => $foros['f3']]),
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHours(3),
            ],
            [
                'idUsuario' => $users['juan'],
                'tipo' => 'nueva_respuesta',
                'titulo' => 'Nueva respuesta en tu pregunta',
                'mensaje' => 'Karla Gómez respondió a tu pregunta: "¿Por qué mi bucle while se queda colgado...?"',
                'leida' => true,
                'datos' => json_encode(['idPregunta' => $p2Id, 'idForo' => $foros['f1']]),
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
        ]);
    }

    private function seedExtraStudents(int $course1Id, int $course2Id): void
    {
        for ($i = 5; $i <= 35; $i++) {
            $studentId = DB::table('usuarios')->insertGetId([
                'nombreCompleto' => "Estudiante Demo {$i}",
                'usuario' => "estudiante{$i}",
                'email' => "estudiante{$i}@espol.edu.ec",
                'password' => Hash::make('password123'),
                'fechaDeNacimiento' => '2001-01-01',
                'idEstado' => 1,
                'xp' => random_int(10, 300),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('rolUsuario')->insert([
                'idUsuario' => $studentId,
                'idRol' => 6, // Estudiante
            ]);

            DB::table('inscripciones_cursos')->insert([
                'idUsuarioEstudiante' => $studentId,
                'idCurso' => $course1Id,
                'fechaInscripcion' => now(),
            ]);

            DB::table('inscripciones_cursos')->insert([
                'idUsuarioEstudiante' => $studentId,
                'idCurso' => $course2Id,
                'fechaInscripcion' => now(),
            ]);
        }
    }

    private function seedQuizzes(array $users, int $courseId, int $temaId): void
    {
        $quizId = DB::table('quizzes')->insertGetId([
            'titulo' => 'Evaluación Diagnóstica: Variables y Sintaxis Python',
            'descripcion' => 'Cuestionario interactivo de opción múltiple sobre conceptos fundamentales de Python.',
            'idCurso' => $courseId,
            'idTema' => $temaId,
            'idCreador' => $users['profesor'],
            'limite_tiempo_minutos' => 15,
            'intentos_maximos' => 3,
            'calificacion_maxima' => 20.00,
            'mostrar_retroalimentacion' => true,
            'estado' => 'publicado',
            'asignar_a_todos' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('items_tema')->insert([
            'idTema' => $temaId,
            'itemable_type' => 'App\Models\Quiz',
            'itemable_id' => $quizId,
            'orden' => 4,
        ]);

        $q1Id = DB::table('quiz_preguntas')->insertGetId([
            'idQuiz' => $quizId,
            'enunciado' => '¿Cuál de las siguientes es la función estándar de Python para imprimir en consola?',
            'puntos' => 10.00,
            'explicacion' => 'print() es la función incorporada estándar de Python.',
            'orden' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('quiz_opciones')->insert([
            ['idPreguntaQuiz' => $q1Id, 'texto_opcion' => 'print()', 'es_correcta' => true, 'orden' => 1],
            ['idPreguntaQuiz' => $q1Id, 'texto_opcion' => 'console.log()', 'es_correcta' => false, 'orden' => 2],
            ['idPreguntaQuiz' => $q1Id, 'texto_opcion' => 'System.out.println()', 'es_correcta' => false, 'orden' => 3],
        ]);

        $q2Id = DB::table('quiz_preguntas')->insertGetId([
            'idQuiz' => $quizId,
            'enunciado' => '¿Qué símbolo se utiliza para iniciar un comentario de una sola línea en Python?',
            'puntos' => 10.00,
            'explicacion' => 'El símbolo numeral # inicia un comentario en Python.',
            'orden' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('quiz_opciones')->insert([
            ['idPreguntaQuiz' => $q2Id, 'texto_opcion' => '#', 'es_correcta' => true, 'orden' => 1],
            ['idPreguntaQuiz' => $q2Id, 'texto_opcion' => '//', 'es_correcta' => false, 'orden' => 2],
            ['idPreguntaQuiz' => $q2Id, 'texto_opcion' => '/*', 'es_correcta' => false, 'orden' => 3],
        ]);
    }
}
