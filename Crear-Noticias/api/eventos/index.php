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

    // Limpieza automática: eliminar eventos vencidos (fecha_expiracion < hoy)
    try {
        $conn->exec("DELETE FROM eventos WHERE fecha_expiracion IS NOT NULL AND fecha_expiracion < CURDATE()");
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
        
        // Con token válido: obtener todos los eventos (activos e inactivos)
        $stmt = $conn->prepare("
            SELECT e.id, e.titulo, e.descripcion, e.fecha_evento, e.hora_evento, e.lugar, 
                   e.media_items, e.created_date, e.created_at, e.fecha_expiracion, e.activo,
                   COALESCE(u.nombre, u.usuario) as autor_nombre, u.rol as autor_rol
            FROM eventos e 
            JOIN usuarios u ON e.autor_id = u.id 
            WHERE e.fecha_expiracion IS NULL OR e.fecha_expiracion >= CURDATE()
            ORDER BY e.created_at DESC, e.id DESC
        ");
    } else {
        // Sin token: solo eventos activos públicos
        $stmt = $conn->prepare("
            SELECT e.id, e.titulo, e.descripcion, e.fecha_evento, e.hora_evento, e.lugar, 
                   e.media_items, e.created_date, e.created_at, e.fecha_expiracion, e.activo,
                   COALESCE(u.nombre, u.usuario) as autor_nombre, u.rol as autor_rol
            FROM eventos e 
            JOIN usuarios u ON e.autor_id = u.id 
            WHERE e.activo = 1 AND (e.fecha_expiracion IS NULL OR e.fecha_expiracion >= CURDATE())
            ORDER BY e.created_at DESC, e.id DESC
        ");
    }
    $stmt->execute();
    $eventos = $stmt->fetchAll();
    
    // Formatear respuesta
    $result = [];
    foreach ($eventos as $evento) {
        $media_items = [];
        if ($evento['media_items']) {
            $media_items = json_decode($evento['media_items'], true) ?: [];
        }
        
        $result[] = [
            'id' => $evento['id'],
            'titulo' => $evento['titulo'],
            'descripcion' => $evento['descripcion'],
            'media_items' => $media_items,
            'imagen' => null, // Para compatibilidad, se usa media_items
            'imagen_url' => null, // Para compatibilidad, se usa media_items
            'fecha_evento' => $evento['fecha_evento'],
            'hora_evento' => $evento['hora_evento'],
            'lugar' => $evento['lugar'],
            'created_date' => $evento['created_date'],
            'created_at' => $evento['created_at'] ?? null,
            'fecha_expiracion' => $evento['fecha_expiracion'],
            'activo' => (bool)$evento['activo'],
            'autor' => [
                'nombre' => $evento['autor_nombre'],
                'rol' => $evento['autor_rol']
            ]
        ];
    }
    
    echo json_encode($result);
    
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
