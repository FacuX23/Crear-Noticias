<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Verificar autenticación (opcional para acceso público)
$headers = getallheaders();
$auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = null;

if ($auth_header && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
    $token = $matches[1];
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Limpieza automática: eliminar noticias vencidas (fecha_expiracion < hoy)
    try {
        $conn->exec("DELETE FROM noticias WHERE fecha_expiracion IS NOT NULL AND fecha_expiracion < CURDATE()");
    } catch (PDOException $exception) {
        // noop
    }
    
    // Verificar token si se proporciona
    if ($auth_header) {
        $stmt = $conn->prepare("SELECT usuario_id FROM sesiones WHERE token = ? AND expira_en > NOW()");
        $stmt->execute([$token]);
        $session = $stmt->fetch();
        
        if (!$session) {
            http_response_code(401);
            echo json_encode(['error' => 'Token inválido o expirado']);
            exit;
        }
        
        // Con token válido: obtener todas las noticias (activas e inactivas)
        $stmt = $conn->prepare("
            SELECT n.id, n.titulo, n.contenido, n.media_items, n.created_date, n.created_at, n.fecha_expiracion, n.activa,
                   COALESCE(u.nombre, u.usuario) as autor_nombre, u.rol as autor_rol
            FROM noticias n 
            JOIN usuarios u ON n.autor_id = u.id 
            WHERE n.fecha_expiracion IS NULL OR n.fecha_expiracion >= CURDATE()
            ORDER BY n.created_at DESC, n.id DESC
        ");
    } else {
        // Sin token: solo noticias activas públicas
        $stmt = $conn->prepare("
            SELECT n.id, n.titulo, n.contenido, n.media_items, n.created_date, n.created_at, n.fecha_expiracion, n.activa,
                   COALESCE(u.nombre, u.usuario) as autor_nombre, u.rol as autor_rol
            FROM noticias n 
            JOIN usuarios u ON n.autor_id = u.id 
            WHERE n.activa = 1 AND (n.fecha_expiracion IS NULL OR n.fecha_expiracion >= CURDATE())
            ORDER BY n.created_at DESC, n.id DESC
        ");
    }
    $stmt->execute();
    $noticias = $stmt->fetchAll();
    
    // Formatear respuesta
    $result = [];
    foreach ($noticias as $noticia) {
        $media_items = [];
        if ($noticia['media_items']) {
            $media_items = json_decode($noticia['media_items'], true) ?: [];
        }
        
        $created_at = $noticia['created_at'] ?? null;
        $hora_publicacion = null;
        if ($created_at) {
            $hora_publicacion = date('H:i', strtotime($created_at));
        }

        $result[] = [
            'id' => $noticia['id'],
            'titulo' => $noticia['titulo'],
            'contenido' => $noticia['contenido'],
            'descripcion' => $noticia['contenido'], // Para compatibilidad
            'media_items' => $media_items,
            'imagen' => null, // Para compatibilidad, se usa media_items
            'imagen_url' => null, // Para compatibilidad, se usa media_items
            'created_date' => $noticia['created_date'],
            'created_at' => $created_at,
            'fecha_publicacion' => $noticia['created_date'], // Para compatibilidad
            'hora_publicacion' => $hora_publicacion,
            'fecha_expiracion' => $noticia['fecha_expiracion'],
            'activa' => (bool)$noticia['activa'],
            'activo' => (bool)$noticia['activa'], // Para compatibilidad
            'autor' => [
                'nombre' => $noticia['autor_nombre'],
                'rol' => $noticia['autor_rol']
            ]
        ];
    }
    
    echo json_encode($result);
    
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
