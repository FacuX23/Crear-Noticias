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

// Obtener token del header Authorization
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
    $database->createTables();
    $conn = $database->conn;
    if (!$conn) {
        $conn = $database->getConnection();
    }
    
    // Verificar token y obtener usuario
    try {
        $stmt = $conn->prepare("
            SELECT s.token, s.expira_en, u.id, u.usuario, u.email, u.nombre, u.rol, u.activo 
            FROM sesiones s 
            JOIN usuarios u ON s.usuario_id = u.id 
            WHERE s.token = ? AND s.expira_en > NOW()
        ");
        $stmt->execute([$token]);
        $session = $stmt->fetch();
    } catch(PDOException $exception) {
        if ($exception->getCode() !== '42S22') {
            throw $exception;
        }
        $stmt = $conn->prepare("
            SELECT s.token, s.expira_en, u.id, u.usuario, u.rol, u.activo 
            FROM sesiones s 
            JOIN usuarios u ON s.usuario_id = u.id 
            WHERE s.token = ? AND s.expira_en > NOW()
        ");
        $stmt->execute([$token]);
        $session = $stmt->fetch();
        if ($session) {
            $session['nombre'] = null;
            $session['email'] = null;
        }
    }
    
    if (!$session) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido o expirado']);
        exit;
    }
    
    if (!$session['activo']) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario inactivo']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'usuario' => [
            'id' => $session['id'],
            'usuario' => $session['usuario'],
            'email' => $session['email'],
            'nombre' => $session['nombre'],
            'rol' => $session['rol']
        ],
        'expira_en' => $session['expira_en']
    ]);
    
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
