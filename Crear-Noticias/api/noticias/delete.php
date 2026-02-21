<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
    
    // Eliminar noticia (hard delete)
    $stmt = $conn->prepare("DELETE FROM noticias WHERE id = ?");
    $stmt->execute([$noticia_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Noticia eliminada correctamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No se pudo eliminar la noticia'
        ]);
    }
    
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
