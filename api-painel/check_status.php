<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once 'config/database.php';
require_once 'config/billing_helpers.php';

try {
    $store_id = $_GET['store_id'] ?? 0;
    if (!$store_id) throw new Exception("Store ID required");

    try { mbg_apply_subscription_maintenance($pdo, (int)$store_id); } catch (Throwable $e) {}
    $stmt = $pdo->prepare("SELECT active, COALESCE(suspended,0) AS suspended FROM stores WHERE id = ?");
    $stmt->execute([$store_id]);
    $store = $stmt->fetch();

    if (!$store) throw new Exception("Store not found");

    echo json_encode([
        'success' => true,
        'active' => (int)$store['active'],
        'suspended' => (int)($store['suspended'] ?? 0)
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
