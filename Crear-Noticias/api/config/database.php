<?php
// Configuración de la base de datos
class Database {
    private $host = 'localhost';
    private $db_name = 'crear_noticias';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    
    public $conn;
    
    // Obtener conexión
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            echo "Error de conexión: " . $exception->getMessage();
        }
        
        return $this->conn;
    }
    
    // Ejecutar SQL para crear tablas si no existen
    public function createTables() {
        $conn = $this->getConnection();
        
        // Tabla usuarios
        $sql_usuarios = "
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario VARCHAR(50) UNIQUE NOT NULL,
                nombre VARCHAR(100) NULL,
                email VARCHAR(150) NULL,
                UNIQUE KEY uk_email (email),
                password_hash VARCHAR(255) NOT NULL,
                rol ENUM('alumno','profesor','director') NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                ciclo_lectivo YEAR NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        // Tabla noticias
        $sql_noticias = "
            CREATE TABLE IF NOT EXISTS noticias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                contenido TEXT NOT NULL,
                media_items JSON,
                created_date DATE NOT NULL,
                fecha_expiracion DATE NOT NULL,
                activa BOOLEAN DEFAULT TRUE,
                autor_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        // Tabla eventos
        $sql_eventos = "
            CREATE TABLE IF NOT EXISTS eventos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                descripcion TEXT NOT NULL,
                fecha_evento DATE NOT NULL,
                hora_evento TIME NOT NULL,
                lugar VARCHAR(255) NOT NULL,
                media_items JSON,
                created_date DATE NOT NULL,
                fecha_expiracion DATE NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                autor_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        // Tabla sesiones
        $sql_sesiones = "
            CREATE TABLE IF NOT EXISTS sesiones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                expira_en TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                INDEX idx_token (token),
                INDEX idx_expira (expira_en)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        try {
            $conn->exec($sql_usuarios);
            $conn->exec($sql_noticias);
            $conn->exec($sql_eventos);
            $conn->exec($sql_sesiones);

            // Migración suave: agregar columna nombre si la tabla ya existía
            try {
                $conn->exec("ALTER TABLE usuarios ADD COLUMN nombre VARCHAR(100) NULL AFTER usuario");
            } catch (PDOException $exception) {
                // noop
            }

            // Migración suave: agregar columna email si la tabla ya existía
            try {
                $conn->exec("ALTER TABLE usuarios ADD COLUMN email VARCHAR(150) NULL AFTER nombre");
            } catch (PDOException $exception) {
                // noop
            }

            // Migración suave: índice único para email
            try {
                $conn->exec("ALTER TABLE usuarios ADD UNIQUE KEY uk_email (email)");
            } catch (PDOException $exception) {
                // noop
            }

            // Migración suave: ampliar enum de rol para incluir director
            try {
                $conn->exec("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('alumno','profesor','director') NOT NULL");
            } catch (PDOException $exception) {
                // noop
            }

            // Setear email default para director si aún no tiene
            try {
                $conn->exec("UPDATE usuarios SET email = 'director@crear.com' WHERE usuario = 'director' AND (email IS NULL OR email = '')");
            } catch (PDOException $exception) {
                // noop
            }

            // Asegurar rol director para el usuario 'director' si existe
            try {
                $conn->exec("UPDATE usuarios SET rol = 'director' WHERE usuario = 'director'");
            } catch (PDOException $exception) {
                // noop
            }
 
        } catch(PDOException $exception) {
            echo "Error creando tablas: " . $exception->getMessage();
        }
    }
}
?>
