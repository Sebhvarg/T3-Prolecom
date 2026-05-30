-- =============================================
-- CREACIÓN DE LA BASE DE DATOS
-- =============================================
CREATE DATABASE IF NOT EXISTS prolecom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prolecom;

-- =============================================
-- 1. TABLAS DE ROLES Y ESTADOS
-- =============================================
CREATE TABLE roles(
    idRol INT AUTO_INCREMENT PRIMARY KEY,
    rol VARCHAR(50) NOT NULL
);

INSERT INTO roles (idRol, rol) VALUES
(1, 'Administrador'),
(2, 'Moderador'),
(3, 'Profesor'),
(4, 'Soporte'),
(5, 'Ayudante'),
(6, 'Estudiante');

CREATE TABLE estadosCuenta(
    idEstado INT AUTO_INCREMENT PRIMARY KEY,
    estado VARCHAR(50) NOT NULL
);

INSERT INTO estadosCuenta (idEstado, estado) VALUES
(1, 'Activo'),
(2, 'Inactivo'),
(3, 'Suspendido'),
(4, 'Baneado');

CREATE TABLE rutas(
id INT AUTO_INCREMENT PRIMARY KEY,
idRol INT NOT NULL,
ruta VARCHAR(100) UNIQUE,
CONSTRAINT fk_RolRuta FOREIGN KEY (idRol) References roles(idRol) ON DELETE RESTRICT
);
-- =============================================
-- 2. TABLA MAESTRA DE USUARIOS
-- =============================================
-- CORRECCIÓN: El estado ahora pertenece directamente al usuario (1:1), optimizando consultas.
CREATE TABLE usuarios(
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombreCompleto VARCHAR(500) NOT NULL,
    usuario VARCHAR(120) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fechaDeNacimiento DATE,
    fechaDeRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idEstado INT NOT NULL DEFAULT 1, 
    CONSTRAINT fk_UsuarioEstado FOREIGN KEY (idEstado) REFERENCES estadosCuenta(idEstado) ON DELETE RESTRICT
);

CREATE TABLE rolUsuario(
    idUsuario INT NOT NULL,
    idRol INT NOT NULL,
    PRIMARY KEY (idUsuario, idRol),
    CONSTRAINT fk_Usuario FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE,
    CONSTRAINT fk_Rol FOREIGN KEY (idRol) REFERENCES roles(idRol) ON DELETE CASCADE
);

-- =============================================
-- 3. TABLAS DE EXTENSIÓN DE ROLES
-- =============================================
CREATE TABLE estudiantes_metadata (
    idUsuario INT PRIMARY KEY,
    puntosExperiencia INT DEFAULT 0,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
);

CREATE TABLE profesores_metadata (
    idUsuario INT PRIMARY KEY,
    especialidad VARCHAR(150) NULL,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
);

-- =============================================
-- 4. TABLA DE CURSOS
-- =============================================
CREATE TABLE cursos (
    idCurso INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    lp VARCHAR(50) NOT NULL,
    tipo ENUM('público', 'privado') DEFAULT 'público',
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idProfeCreador INT NOT NULL,
    FOREIGN KEY (idProfeCreador) REFERENCES usuarios(idUsuario) ON UPDATE CASCADE
    -- NOTA: Por defecto MySQL aplica ON DELETE RESTRICT. No se borrará un curso si su profesor es eliminado.
);

-- =============================================
-- 5. TABLAS INTERMEDIAS (Muchos a Muchos)
-- =============================================
CREATE TABLE inscripciones_cursos (
    idUsuarioEstudiante INT NOT NULL,
    idCurso INT NOT NULL,
    fechaInscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idUsuarioEstudiante, idCurso),
    FOREIGN KEY (idUsuarioEstudiante) REFERENCES usuarios(idUsuario) ON DELETE CASCADE,
    FOREIGN KEY (idCurso) REFERENCES cursos(idCurso) ON DELETE CASCADE
);

CREATE TABLE curso_tas (
    idUsuarioTA INT NOT NULL,
    idCurso INT NOT NULL,
    estado_validacion ENUM('pendiente', 'validado') DEFAULT 'pendiente',
    PRIMARY KEY (idUsuarioTA, idCurso),
    FOREIGN KEY (idUsuarioTA) REFERENCES usuarios(idUsuario) ON DELETE CASCADE,
    FOREIGN KEY (idCurso) REFERENCES cursos(idCurso) ON DELETE CASCADE
);

-- =============================================
-- 6. CONTENIDO ACADÉMICO
-- =============================================
CREATE TABLE temas (
    idTema INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    idCurso INT NOT NULL,
    FOREIGN KEY (idCurso) REFERENCES cursos(idCurso) ON DELETE CASCADE
);

CREATE TABLE materiales_aprendizaje (
    idMaterial INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    tipo ENUM('PDF', 'video') NOT NULL,
    enlaceArchivo VARCHAR(255) NOT NULL,
    fechaSubida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idTema INT NOT NULL,
    idUsuarioCreador INT NOT NULL,
    FOREIGN KEY (idTema) REFERENCES temas(idTema) ON DELETE CASCADE,
    FOREIGN KEY (idUsuarioCreador) REFERENCES usuarios(idUsuario) ON UPDATE CASCADE
);

-- =============================================
-- 7. FORO Q&A
-- =============================================
CREATE TABLE preguntas (
    idPregunta INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    fechaPublicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idUsuarioCreador INT NOT NULL,
    idCurso INT NOT NULL,
    estado ENUM('abierta', 'resuelta', 'oculta') DEFAULT 'abierta',
    FOREIGN KEY (idUsuarioCreador) REFERENCES usuarios(idUsuario) ON UPDATE CASCADE,
    FOREIGN KEY (idCurso) REFERENCES cursos(idCurso) ON DELETE CASCADE
);

CREATE TABLE respuestas (
    idRespuesta INT AUTO_INCREMENT PRIMARY KEY,
    contenido TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idUsuario INT NOT NULL,
    idPregunta INT NOT NULL,
    validada BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON UPDATE CASCADE,
    FOREIGN KEY (idPregunta) REFERENCES preguntas(idPregunta) ON DELETE CASCADE
);

-- =============================================
-- 8. DESAFÍOS DE PROGRAMACIÓN e IDE
-- =============================================
CREATE TABLE desafios (
    idDesafio INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcionProblema TEXT NOT NULL,
    dificultad ENUM('Easy', 'Medium', 'Hard') NOT NULL,
    testCases JSON NOT NULL,
    salidaEsperada TEXT NOT NULL,
    estado ENUM('pendiente', 'publicado') DEFAULT 'pendiente',
    idCreador INT NOT NULL,
    idCurso INT NOT NULL,
    FOREIGN KEY (idCreador) REFERENCES usuarios(idUsuario) ON UPDATE CASCADE,
    FOREIGN KEY (idCurso) REFERENCES cursos(idCurso) ON DELETE CASCADE
);

CREATE TABLE soluciones (
    idSolucion INT AUTO_INCREMENT PRIMARY KEY,
    codigoFuente TEXT NOT NULL,
    fechaEntrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('enviado', 'aprobado', 'rechazado') DEFAULT 'enviado',
    idEstudiante INT NOT NULL,
    idDesafio INT NOT NULL,
    FOREIGN KEY (idEstudiante) REFERENCES usuarios(idUsuario) ON UPDATE CASCADE,
    FOREIGN KEY (idDesafio) REFERENCES desafios(idDesafio) ON DELETE CASCADE
);

CREATE TABLE feedback (
    idFeedback INT AUTO_INCREMENT PRIMARY KEY,
    comentario TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idAutor INT NOT NULL,
    idSolucion INT NOT NULL,
    FOREIGN KEY (idAutor) REFERENCES usuarios(idUsuario) ON UPDATE CASCADE,
    FOREIGN KEY (idSolucion) REFERENCES soluciones(idSolucion) ON DELETE CASCADE
);

-- =============================================
-- 9. EVALUACIONES Y FLASHCARDS
-- =============================================
CREATE TABLE quizzes (
    idQuiz INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    idCurso INT NOT NULL,
    idCreador INT NOT NULL,
    FOREIGN KEY (idCurso) REFERENCES cursos(idCurso) ON DELETE CASCADE,
    FOREIGN KEY (idCreador) REFERENCES usuarios(idUsuario) ON UPDATE CASCADE
);

-- CORRECCIÓN: Se añadió idCurso para poder filtrar flashcards por materia
CREATE TABLE flashcards (
    idFlashcard INT AUTO_INCREMENT PRIMARY KEY,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    idEstudiante INT NOT NULL,
    idCurso INT NOT NULL, 
    FOREIGN KEY (idEstudiante) REFERENCES usuarios(idUsuario) ON DELETE CASCADE,
    FOREIGN KEY (idCurso) REFERENCES cursos(idCurso) ON DELETE CASCADE 
);

-- =============================================
-- 10. SEGURIDAD, MODERACIÓN Y AUDITORÍA
-- =============================================
-- NOTA BACKEND: Al borrar preguntas/respuestas/materiales, recuerda borrar sus reportes en el código.
CREATE TABLE reportes (
    idReporte INT AUTO_INCREMENT PRIMARY KEY,
    motivo VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idUsuarioReportador INT NOT NULL,
    tipoPublicacion ENUM('pregunta', 'respuesta', 'material') NOT NULL,
    idPublicacionReportada INT NOT NULL,
    estado ENUM('pendiente', 'resuelto', 'escalado') DEFAULT 'pendiente',
    FOREIGN KEY (idUsuarioReportador) REFERENCES usuarios(idUsuario)
);

CREATE TABLE logs_actividad (
    idLog INT AUTO_INCREMENT PRIMARY KEY,
    accion VARCHAR(255) NOT NULL,
    fechaHora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idUsuario INT NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
);

-- =============================================
-- 11. SESIONES ACTIVAS
-- =============================================
CREATE TABLE sesiones (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    token_sesion VARCHAR(255) NOT NULL UNIQUE,
    dispositivo VARCHAR(255) NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
);

-- =============================================
-- INSERT DE USUARIO DE PRUEBA
-- =============================================
-- Ya no necesitamos insertar en estadoUsuario, se define en la misma creación
INSERT INTO usuarios (nombreCompleto, usuario, email, password, fechaDeNacimiento, fechaDeRegistro, idEstado) 
VALUES ('Usuario Prueba', 'user', 'user@espol.edu.ec', '$2y$12$.dy3NBN5.o9hXhXH6G3qbu69RWapC1yDlYkpjM5/3QbrGzr5WtY5e', '2002-08-07', '2026-05-25 22:06:58', 1);

SET @last_id = LAST_INSERT_ID();

-- Asignar rol (6 = Estudiante)
INSERT INTO rolUsuario (idUsuario, idRol) VALUES (@last_id, 1);
INSERT INTO rutas(id, idRol, ruta) VALUES (1, 1, '/admin');
INSERT INTO rutas(id, idRol, ruta) VALUES (2, 1, '/administrar-cursos');
INSERT INTO rutas(id, idRol, ruta) VALUES (3, 6, '/dashboard');
-- =============================================
-- SP loginUsuario
-- =============================================
DELIMITER $$

CREATE PROCEDURE `loginUsuario`(
    IN p_login VARCHAR(120)
)
BEGIN
    SELECT
        u.idUsuario,
        u.usuario,
        u.email,
        u.password,
        r.rol,
        ec.estado,
        GROUP_CONCAT(rua.ruta ORDER BY rua.ruta SEPARATOR ';') AS rutas
    FROM usuarios u
        INNER JOIN rolUsuario     ru  ON u.idUsuario = ru.idUsuario
        INNER JOIN roles           r  ON r.idRol     = ru.idRol
        INNER JOIN estadosCuenta  ec  ON ec.idEstado  = u.idEstado
        INNER JOIN rutas          rua ON rua.idRol    = r.idRol
    WHERE
        ec.estado = 'Activo'
        AND (u.email = p_login OR u.usuario = p_login)
    GROUP BY
        u.idUsuario,
        u.usuario,
        u.email,
        u.password,
        r.rol,
        ec.estado;  

END$$

DELIMITER ;