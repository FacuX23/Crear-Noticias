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

    $stmt = $conn->prepare("SELECT s.usuario_id FROM sesiones s WHERE s.token = ? AND s.expira_en > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido o expirado']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $nombre = isset($data['nombre']) ? trim($data['nombre']) : '';

    if ($nombre === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre inválido']);
        exit;
    }

    $usuarioId = (int)$session['usuario_id'];

    $nombreLower = strtolower($nombre);
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE id <> ? AND (LOWER(usuario) = ? OR LOWER(nombre) = ?) LIMIT 1");
    $stmt->execute([$usuarioId, $nombreLower, $nombreLower]);
    $dup = $stmt->fetch();
    if ($dup) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'error' => 'Nombre ya en uso'
        ]);
        exit;
    }

    $stmt = $conn->prepare('UPDATE usuarios SET nombre = ? WHERE id = ?');
    $stmt->execute([$nombre, $usuarioId]);

    try {
        $stmt = $conn->prepare('SELECT id, usuario, email, nombre, rol, activo FROM usuarios WHERE id = ?');
        $stmt->execute([$usuarioId]);
        $user = $stmt->fetch();
    } catch (PDOException $exception) {
        if ($exception->getCode() !== '42S22') {
            throw $exception;
        }
        $stmt = $conn->prepare('SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?');
        $stmt->execute([$usuarioId]);
        $user = $stmt->fetch();
        if ($user) {
            $user['email'] = null;
        }
    }

    echo json_encode([
        'success' => true,
        'usuario' => $user,
    ]);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
