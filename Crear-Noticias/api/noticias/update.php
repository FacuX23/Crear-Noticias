<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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
    
    // Obtener ID de la noticia desde la URL
    $noticia_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if ($noticia_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de noticia inválido']);
        exit;
    }
    
    // Verificar que la noticia existe
    $stmt = $conn->prepare("SELECT id FROM noticias WHERE id = ?");
    $stmt->execute([$noticia_id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Noticia no encontrada']);
        exit;
    }
    
    // Obtener datos del PUT
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['titulo']) || !isset($data['contenido'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Título y contenido son requeridos']);
        exit;
    }
    
    $titulo = trim($data['titulo']);
    $contenido = trim($data['contenido']);
    $media_items = isset($data['media_items']) ? json_encode($data['media_items']) : null;
    $dias_visibilidad = intval($data['dias_visibilidad'] ?? 30);
    
    // Calcular nueva fecha de expiración
    $fecha_expiracion = date('Y-m-d', strtotime("+$dias_visibilidad days"));
    
    // Actualizar noticia
    $stmt = $conn->prepare("
        UPDATE noticias 
        SET titulo = ?, contenido = ?, media_items = ?, fecha_expiracion = ?, created_date = CURDATE(), created_at = NOW()
        WHERE id = ?
    ");
    
    $stmt->execute([$titulo, $contenido, $media_items, $fecha_expiracion, $noticia_id]);
    
    // Obtener noticia actualizada para devolverla
    $stmt = $conn->prepare("
        SELECT n.id, n.titulo, n.contenido, n.media_items, n.created_date, n.created_at, n.fecha_expiracion, n.activa,
               u.usuario as autor_nombre, u.rol as autor_rol
        FROM noticias n 
        JOIN usuarios u ON n.autor_id = u.id 
        WHERE n.id = ?
    ");
    
    $stmt->execute([$noticia_id]);
    $noticia = $stmt->fetch();
    
    if ($noticia) {
        $created_at = $noticia['created_at'] ?? null;
        $hora_publicacion = null;
        if ($created_at) {
            $hora_publicacion = date('H:i', strtotime($created_at));
        }

        $media_items_decoded = [];
        if ($noticia['media_items']) {
            $media_items_decoded = json_decode($noticia['media_items'], true) ?: [];
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Noticia actualizada correctamente',
            'data' => [
                'id' => $noticia['id'],
                'titulo' => $noticia['titulo'],
                'contenido' => $noticia['contenido'],
                'descripcion' => $noticia['contenido'],
                'media_items' => $media_items_decoded,
                'imagen' => null,
                'imagen_url' => null,
                'created_date' => $noticia['created_date'],
                'created_at' => $created_at,
                'fecha_publicacion' => $noticia['created_date'],
                'hora_publicacion' => $hora_publicacion,
                'fecha_expiracion' => $noticia['fecha_expiracion'],
                'activa' => (bool)$noticia['activa'],
                'autor' => [
                    'nombre' => $noticia['autor_nombre'],
                    'rol' => $noticia['autor_rol']
                ]
            ]
        ]);
    } else {
        echo json_encode(['success' => true, 'message' => 'Noticia actualizada correctamente']);
    }
    
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
