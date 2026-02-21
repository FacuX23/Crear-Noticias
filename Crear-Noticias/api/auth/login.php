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

// Obtener datos del POST
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Correo y contraseña son requeridos']);
    exit;
}

$email = strtolower(trim($data['email']));
$password = $data['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Correo inválido']);
    exit;
}

try {
    $database = new Database();
    $database->createTables();
    $conn = $database->conn;
    if (!$conn) {
        $conn = $database->getConnection();
    }
    
    // Buscar usuario por email
    try {
        $stmt = $conn->prepare("SELECT id, usuario, email, nombre, password_hash, rol, activo FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
    } catch(PDOException $exception) {
        if ($exception->getCode() !== '42S22') {
            throw $exception;
        }
        // Si la columna email aún no existe, no se puede autenticar por correo
        http_response_code(500);
        echo json_encode(['error' => 'La base de datos no tiene la columna email. Ejecutá createTables() o agregá la columna email en usuarios.']);
        exit;
    }
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario o contraseña incorrectos']);
        exit;
    }
    
    if (!$user['activo']) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario inactivo']);
        exit;
    }
    
    // Verificar contraseña
    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario o contraseña incorrectos']);
        exit;
    }
    
    // Generar token
    $token = bin2hex(random_bytes(32));
    $expira_en = date('Y-m-d H:i:s', strtotime('+3 days'));
    
    // Limpiar sesiones anteriores del usuario
    $stmt = $conn->prepare("DELETE FROM sesiones WHERE usuario_id = ?");
    $stmt->execute([$user['id']]);
    
    // Guardar nueva sesión
    $stmt = $conn->prepare("INSERT INTO sesiones (usuario_id, token, expira_en) VALUES (?, ?, ?)");
    $stmt->execute([$user['id'], $token, $expira_en]);
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'token' => $token,
        'usuario' => [
            'id' => $user['id'],
            'usuario' => $user['usuario'],
            'email' => $user['email'],
            'nombre' => $user['nombre'],
            'rol' => $user['rol']
        ],
        'expira_en' => $expira_en
    ]);
    
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
