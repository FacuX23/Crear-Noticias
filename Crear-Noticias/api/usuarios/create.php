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

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['usuario']) || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Usuario, correo y contraseña son requeridos']);
        exit;
    }

    $usuario = trim($data['usuario']);
    $email = strtolower(trim($data['email']));
    $password = $data['password'];
    $rol = isset($data['rol']) ? trim($data['rol']) : 'alumno';
    $ciclo_lectivo = $data['ciclo_lectivo'] ?? null;

    if ($usuario === '' || $email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Usuario, correo y contraseña son requeridos']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Correo inválido']);
        exit;
    }

    if ($rol === '') {
        $rol = 'alumno';
    }

    $rolLower = strtolower($rol);
    if ($rolLower !== 'alumno' && $rolLower !== 'profesor' && $rolLower !== 'director') {
        http_response_code(400);
        echo json_encode(['error' => 'Rol inválido']);
        exit;
    }

    if ($ciclo_lectivo === null || $ciclo_lectivo === '') {
        $ciclo_lectivo = (int)date('Y');
    } else {
        $ciclo_lectivo = (int)$ciclo_lectivo;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO usuarios (usuario, email, password_hash, rol, activo, ciclo_lectivo) VALUES (?, ?, ?, ?, 1, ?)");
    $stmt->execute([$usuario, $email, $hash, $rolLower, $ciclo_lectivo]);

    echo json_encode([
        'success' => true,
        'message' => 'Usuario creado correctamente',
    ]);

} catch(PDOException $exception) {
    if ($exception->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['error' => 'El usuario o correo ya existe']);
        exit;
    }

    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
