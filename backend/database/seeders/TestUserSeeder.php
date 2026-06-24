<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Core Users (Admin, Profesor, Estudiante autodidacta)
        [$adminId, $profesorId, $estudianteId] = $this->seedCoreUsers();

        // 2. Courses
        [$course1Id, $course2Id] = $this->seedCourses($profesorId);

        // 3. Specific students with enrollments
        $studentIds = $this->seedSpecificStudents($course1Id);

        // 4. Challenges (Desafíos)
        $desafioIds = $this->seedChallenges($profesorId, $course1Id);

        // 5. Forum questions (Preguntas)
        $this->seedForumQuestions($course1Id, $studentIds);

        // 6. Solutions
        $this->seedSolutions($desafioIds, $studentIds);

        // 7. Extra students to complete 40
        $this->seedExtraStudents($course1Id, $course2Id);
    }

    private function seedCoreUsers(): array
    {
        return $this->createGlobalAccounts();
    }

    private function createGlobalAccounts(): array
    {
        // 1. Administrador Global
        $adminId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Administrador Global',
            'usuario' => 'admin',
            'email' => 'admin@prolecom.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '1990-01-01',
            'idEstado' => 1,
            'xp' => 1000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('rolUsuario')->insert([
            'idUsuario' => $adminId,
            'idRol' => 1, // Administrador
        ]);

        // 2. Profesor Python
        $profesorId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'María Pérez',
            'usuario' => 'profesor',
            'email' => 'profesor@espol.edu.ec',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '1985-05-15',
            'idEstado' => 1,
            'xp' => 500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('rolUsuario')->insert([
            'idUsuario' => $profesorId,
            'idRol' => 3, // Profesor
        ]);

        // 3. Estudiante Autodidacta
        $estudianteId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Estudiante Autodidacta',
            'usuario' => 'estudiante',
            'email' => 'estudiante@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2002-08-07',
            'idEstado' => 1,
            'xp' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('rolUsuario')->insert([
            'idUsuario' => $estudianteId,
            'idRol' => 6, // Estudiante
        ]);

        return [$adminId, $profesorId, $estudianteId];
    }

    private function seedCourses(int $profesorId): array
    {
        $course1Id = DB::table('cursos')->insertGetId([
            'titulo' => 'Fundamentos de Python',
            'descripcion' => 'Aprende Python desde las bases',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $profesorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $course2Id = DB::table('cursos')->insertGetId([
            'titulo' => 'Fundamentos de Python',
            'descripcion' => 'Aprende Python desde las bases (Paralelo 10)',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => $profesorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$course1Id, $course2Id];
    }

    private function seedSpecificStudents(int $course1Id): array
    {
        $juanId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Juan Pérez',
            'usuario' => 'juan',
            'email' => 'juan@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2001-01-01',
            'idEstado' => 1,
            'xp' => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $juanId, 'idRol' => 6]);
        DB::table('inscripciones_cursos')->insert(['idUsuarioEstudiante' => $juanId, 'idCurso' => $course1Id, 'fechaInscripcion' => now()]);

        $karlaId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Karla Gómez',
            'usuario' => 'karla',
            'email' => 'karla@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2001-02-02',
            'idEstado' => 1,
            'xp' => 120,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $karlaId, 'idRol' => 6]);
        DB::table('inscripciones_cursos')->insert(['idUsuarioEstudiante' => $karlaId, 'idCurso' => $course1Id, 'fechaInscripcion' => now()]);

        $alexId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Alex Torres',
            'usuario' => 'alex',
            'email' => 'alex@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2001-03-03',
            'idEstado' => 1,
            'xp' => 80,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $alexId, 'idRol' => 6]);
        DB::table('inscripciones_cursos')->insert(['idUsuarioEstudiante' => $alexId, 'idCurso' => $course1Id, 'fechaInscripcion' => now()]);

        $teresaId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Teresa Mendoza',
            'usuario' => 'teresa',
            'email' => 'teresa@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2001-04-04',
            'idEstado' => 1,
            'xp' => 150,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('rolUsuario')->insert(['idUsuario' => $teresaId, 'idRol' => 6]);
        DB::table('inscripciones_cursos')->insert(['idUsuarioEstudiante' => $teresaId, 'idCurso' => $course1Id, 'fechaInscripcion' => now()]);

        return [
            'juan' => $juanId,
            'karla' => $karlaId,
            'alex' => $alexId,
            'teresa' => $teresaId,
        ];
    }

    private function seedChallenges(int $profesorId, int $course1Id): array
    {
        $desafio1Id = DB::table('desafios')->insertGetId([
            'titulo' => 'Estructura de Control',
            'descripcionProblema' => 'Resuelve el problema usando estructuras de control.',
            'dificultad' => 'Easy',
            'testCases' => json_encode([]),
            'salidaEsperada' => 'OK',
            'estado' => 'publicado',
            'idCreador' => $profesorId,
            'idCurso' => $course1Id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $desafio2Id = DB::table('desafios')->insertGetId([
            'titulo' => 'Invertir cadena',
            'descripcionProblema' => 'Invierte la cadena recibida.',
            'dificultad' => 'Easy',
            'testCases' => json_encode([]),
            'salidaEsperada' => 'OK',
            'estado' => 'publicado',
            'idCreador' => $profesorId,
            'idCurso' => $course1Id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$desafio1Id, $desafio2Id];
    }

    private function seedForumQuestions(int $course1Id, array $studentIds): void
    {
        DB::table('preguntas')->insert([
            'titulo' => 'Duda en bucles for',
            'descripcion' => '¿Cómo funciona la indexación inversa?',
            'idUsuarioCreador' => $studentIds['juan'],
            'idCurso' => $course1Id,
            'estado' => 'abierta',
            'created_at' => now()->subHours(2),
            'updated_at' => now()->subHours(2),
        ]);

        DB::table('preguntas')->insert([
            'titulo' => 'Problema con arrays',
            'descripcion' => 'No logro entender cómo definir matrices en python.',
            'idUsuarioCreador' => $studentIds['alex'],
            'idCurso' => $course1Id,
            'estado' => 'abierta',
            'created_at' => '2025-11-04 14:00:00',
            'updated_at' => '2025-11-04 14:00:00',
        ]);
    }

    private function seedSolutions(array $desafioIds, array $studentIds): void
    {
        DB::table('soluciones')->insert([
            'codigoFuente' => 'print("Hola")',
            'estado' => 'aprobado',
            'idEstudiante' => $studentIds['karla'],
            'idDesafio' => $desafioIds[0],
            'created_at' => now()->subDay()->setTime(23, 50, 0),
            'updated_at' => now()->subDay()->setTime(23, 50, 0),
        ]);

        DB::table('soluciones')->insert([
            'codigoFuente' => 'print("Invertir")',
            'estado' => 'aprobado',
            'idEstudiante' => $studentIds['teresa'],
            'idDesafio' => $desafioIds[1],
            'created_at' => now()->subDay()->setTime(19, 30, 0),
            'updated_at' => now()->subDay()->setTime(19, 30, 0),
        ]);
    }

    private function seedExtraStudents(int $course1Id, int $course2Id): void
    {
        for ($i = 5; $i <= 40; $i++) {
            $studentId = DB::table('usuarios')->insertGetId([
                'nombreCompleto' => "Estudiante {$i}",
                'usuario' => "estudiante{$i}",
                'email' => "estudiante{$i}@gmail.com",
                'password' => Hash::make('password123'),
                'fechaDeNacimiento' => '2000-01-01',
                'idEstado' => 1,
                'xp' => 10,
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
}
