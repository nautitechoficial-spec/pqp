<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(200); exit; }
require_once 'config/database.php';

try {
    $subdomain = strtolower(trim((string)($_GET['subdomain'] ?? '')));
    $subdomain = preg_replace('/[^a-z0-9-]/', '-', $subdomain);
    $subdomain = preg_replace('/-+/', '-', $subdomain);
    $subdomain = trim($subdomain, '-');

    if ($subdomain === '' || strlen($subdomain) < 3) {
        echo json_encode(['success' => true, 'available' => false, 'message' => 'Subdomínio inválido']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM stores WHERE LOWER(subdomain) = LOWER(?) LIMIT 1");
    $stmt->execute([$subdomain]);
    $exists = (bool)$stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'available' => !$exists,
        'subdomain' => $subdomain
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage(), 'available' => false]);
}
