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

    $usuario = strtolower($session['usuario'] ?? '');
    $rol = strtolower($session['rol'] ?? '');
    if ($usuario !== 'director' && $rol !== 'director') {
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }

    try {
        $stmt = $conn->prepare("SELECT id, usuario, email, rol, activo, ciclo_lectivo, created_at FROM usuarios ORDER BY usuario ASC");
        $stmt->execute();
        $usuarios = $stmt->fetchAll();
    } catch(PDOException $exception) {
        if ($exception->getCode() !== '42S22') {
            throw $exception;
        }
        $stmt = $conn->prepare("SELECT id, usuario, rol, activo, ciclo_lectivo, created_at FROM usuarios ORDER BY usuario ASC");
        $stmt->execute();
        $usuarios = $stmt->fetchAll();
        foreach ($usuarios as &$u) {
            $u['email'] = null;
        }
        unset($u);
    }

    echo json_encode([
        'success' => true,
        'data' => $usuarios,
    ]);

} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
