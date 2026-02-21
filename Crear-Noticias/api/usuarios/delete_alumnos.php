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

    $stmt = $conn->prepare("SELECT s.usuario_id, u.usuario, u.rol FROM sesiones s JOIN usuarios u ON s.usuario_id = u.id WHERE s.token = ? AND s.expira_en > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido o expirado']);
        exit;
    }

    $usuarioSesion = strtolower($session['usuario'] ?? '');
    $rolSesion = strtolower($session['rol'] ?? '');
    if ($usuarioSesion !== 'director' && $rolSesion !== 'director') {
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM usuarios WHERE rol = 'alumno'");
    $stmt->execute();

    echo json_encode([
        'success' => true,
    ]);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
