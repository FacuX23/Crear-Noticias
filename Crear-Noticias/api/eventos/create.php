<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Verificar autenticación
$headers = getallheaders();
$auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (!$auth_header || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Token no proporcionado']);
    exit;
}

$token = $matches[1];

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Verificar token y obtener usuario
    $stmt = $conn->prepare("SELECT usuario_id FROM sesiones WHERE token = ? AND expira_en > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();
    
    if (!$session) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido o expirado']);
        exit;
    }
    
    $usuario_id = $session['usuario_id'];
    
    // Obtener datos del POST
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['titulo']) || !isset($data['descripcion'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Título y descripción son requeridos']);
        exit;
    }
    
    $titulo = trim($data['titulo']);
    $descripcion = trim($data['descripcion']);
    $fecha_evento = $data['fecha_evento'] ?? null;
    $hora_evento = $data['hora_evento'] ?? null;
    if ($hora_evento === null || trim((string)$hora_evento) === '') {
        $hora_evento = '14:00';
    }
    $lugar = trim($data['lugar'] ?? '');
    $media_items = isset($data['media_items']) ? json_encode($data['media_items']) : null;
    $dias_visibilidad = intval($data['dias_visibilidad'] ?? 30);
    
    // Validar fecha de evento
    if (!$fecha_evento) {
        http_response_code(400);
        echo json_encode(['error' => 'Fecha del evento es requerida']);
        exit;
    }
    
    // Calcular fecha de expiración
    $created_date = date('Y-m-d');
    $fecha_expiracion = date('Y-m-d', strtotime("+$dias_visibilidad days"));
    
    // Insertar evento
    $stmt = $conn->prepare("
        INSERT INTO eventos (titulo, descripcion, fecha_evento, hora_evento, lugar, media_items, created_date, fecha_expiracion, activo, autor_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    ");
    
    $stmt->execute([$titulo, $descripcion, $fecha_evento, $hora_evento, $lugar, $media_items, $created_date, $fecha_expiracion, $usuario_id]);
    
    $evento_id = $conn->lastInsertId();
    
    // Obtener evento creado para devolverlo
    $stmt = $conn->prepare("
        SELECT e.id, e.titulo, e.descripcion, e.fecha_evento, e.hora_evento, e.lugar, 
               e.media_items, e.created_date, e.fecha_expiracion, e.activo,
               u.usuario as autor_nombre, u.rol as autor_rol
        FROM eventos e 
        JOIN usuarios u ON e.autor_id = u.id 
        WHERE e.id = ?
    ");
    
    $stmt->execute([$evento_id]);
    $evento = $stmt->fetch();
    
    if ($evento) {
        $media_items_decoded = [];
        if ($evento['media_items']) {
            $media_items_decoded = json_decode($evento['media_items'], true) ?: [];
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Evento creado correctamente',
            'data' => [
                'id' => $evento['id'],
                'titulo' => $evento['titulo'],
                'descripcion' => $evento['descripcion'],
                'media_items' => $media_items_decoded,
                'imagen' => null,
                'imagen_url' => null,
                'fecha_evento' => $evento['fecha_evento'],
                'hora_evento' => $evento['hora_evento'],
                'lugar' => $evento['lugar'],
                'created_date' => $evento['created_date'],
                'fecha_expiracion' => $evento['fecha_expiracion'],
                'activo' => (bool)$evento['activo'],
                'autor' => [
                    'nombre' => $evento['autor_nombre'],
                    'rol' => $evento['autor_rol']
                ]
            ]
        ]);
    } else {
        echo json_encode(['success' => true, 'message' => 'Evento creado correctamente']);
    }
    
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
