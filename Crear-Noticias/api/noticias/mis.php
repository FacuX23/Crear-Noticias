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

// Verificar autenticación (obligatoria)
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

    // Limpieza automática: eliminar noticias vencidas (fecha_expiracion < hoy)
    try {
        $conn->exec("DELETE FROM noticias WHERE fecha_expiracion IS NOT NULL AND fecha_expiracion < CURDATE()");
    } catch (PDOException $exception) {
        // noop
    }

    // Verificar token y obtener usuario
    $stmt = $conn->prepare("\n        SELECT s.usuario_id, u.rol\n        FROM sesiones s\n        JOIN usuarios u ON s.usuario_id = u.id\n        WHERE s.token = ? AND s.expira_en > NOW()\n    ");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido o expirado']);
        exit;
    }

    $usuario_id = $session['usuario_id'];
    $rol = strtolower(trim((string)($session['rol'] ?? '')));
    $is_admin = ($rol === 'profesor' || $rol === 'director');

    if ($is_admin) {
        $stmt = $conn->prepare("
            SELECT n.id, n.titulo, n.contenido, n.media_items, n.created_date, n.created_at, n.fecha_expiracion, n.activa,
                   COALESCE(u.nombre, u.usuario) as autor_nombre, u.rol as autor_rol
            FROM noticias n
            JOIN usuarios u ON n.autor_id = u.id
            WHERE (n.fecha_expiracion IS NULL OR n.fecha_expiracion >= CURDATE())
            ORDER BY n.created_at DESC, n.id DESC
        ");
        $stmt->execute();
    } else {
        $stmt = $conn->prepare("
            SELECT n.id, n.titulo, n.contenido, n.media_items, n.created_date, n.created_at, n.fecha_expiracion, n.activa,
                   COALESCE(u.nombre, u.usuario) as autor_nombre, u.rol as autor_rol
            FROM noticias n
            JOIN usuarios u ON n.autor_id = u.id
            WHERE n.autor_id = ? AND (n.fecha_expiracion IS NULL OR n.fecha_expiracion >= CURDATE())
            ORDER BY n.created_at DESC, n.id DESC
        ");
        $stmt->execute([$usuario_id]);
    }

    $noticias = $stmt->fetchAll();

    // Formatear respuesta
    $result = [];
    foreach ($noticias as $noticia) {
        $media_items = [];
        if ($noticia['media_items']) {
            $media_items = json_decode($noticia['media_items'], true) ?: [];
        }

        $created_at = $noticia['created_at'] ?? null;
        $hora_publicacion = null;
        if ($created_at) {
            $hora_publicacion = date('H:i', strtotime($created_at));
        }

        $result[] = [
            'id' => $noticia['id'],
            'titulo' => $noticia['titulo'],
            'contenido' => $noticia['contenido'],
            'descripcion' => $noticia['contenido'],
            'media_items' => $media_items,
            'imagen' => null,
            'imagen_url' => null,
            'created_date' => $noticia['created_date'],
            'created_at' => $created_at,
            'fecha_publicacion' => $noticia['created_date'],
            'hora_publicacion' => $hora_publicacion,
            'fecha_expiracion' => $noticia['fecha_expiracion'],
            'activa' => (bool)$noticia['activa'],
            'activo' => (bool)$noticia['activa'],
            'autor' => [
                'nombre' => $noticia['autor_nombre'],
                'rol' => $noticia['autor_rol']
            ]
        ];
    }

    echo json_encode($result);

} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $exception->getMessage()]);
}
?>
