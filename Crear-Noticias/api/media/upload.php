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
    $conn = $database->getConnection();

    // Validar token
    $stmt = $conn->prepare("SELECT usuario_id FROM sesiones WHERE token = ? AND expira_en > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido o expirado']);
        exit;
    }

    if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Archivo no proporcionado']);
        exit;
    }

    $file = $_FILES['file'];
    $tmp = $file['tmp_name'];
    $origName = $file['name'] ?? 'file';
    $mime = $file['type'] ?? '';

    // Inferir MIME si falta
    if (!$mime && function_exists('finfo_open')) {
        $fi = finfo_open(FILEINFO_MIME_TYPE);
        if ($fi) {
            $mime = finfo_file($fi, $tmp) ?: '';
            finfo_close($fi);
        }
    }

    $isImage = (strpos($mime, 'image/') === 0);
    $isVideo = (strpos($mime, 'video/') === 0);

    if (!$isImage && !$isVideo) {
        http_response_code(400);
        echo json_encode(['error' => 'Tipo de archivo no permitido']);
        exit;
    }

    // Tamaños máximos
    $maxBytes = $isVideo ? (50 * 1024 * 1024) : (10 * 1024 * 1024);
    if (isset($file['size']) && $file['size'] > $maxBytes) {
        http_response_code(413);
        echo json_encode(['error' => 'Archivo demasiado grande']);
        exit;
    }

    $baseDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'media';
    if (!is_dir($baseDir)) {
        @mkdir($baseDir, 0777, true);
    }

    // Extensión
    $ext = '';
    $byName = pathinfo($origName, PATHINFO_EXTENSION);
    if ($byName) {
        $ext = strtolower($byName);
    } else {
        $map = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'video/mp4' => 'mp4',
            'video/webm' => 'webm',
            'video/ogg' => 'ogv',
        ];
        if (isset($map[$mime])) $ext = $map[$mime];
    }

    if ($ext === '') {
        $ext = $isVideo ? 'mp4' : 'jpg';
    }

    $safeExt = preg_replace('/[^a-z0-9]/i', '', $ext);
    if ($safeExt === '') $safeExt = $isVideo ? 'mp4' : 'jpg';

    $filename = bin2hex(random_bytes(16)) . '.' . $safeExt;
    $destPath = $baseDir . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($tmp, $destPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo guardar el archivo']);
        exit;
    }

    $url = '/Crear-Noticias/uploads/media/' . $filename;

    echo json_encode([
        'success' => true,
        'url' => $url,
        'type' => $isVideo ? 'video' : 'image',
        'name' => $origName,
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $e->getMessage()]);
}
?>
