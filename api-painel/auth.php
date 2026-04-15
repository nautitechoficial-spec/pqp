<?php
/**
 * Endpoint para Autenticação com Verificação de Loja Ativa
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

require_once 'config/database.php';
require_once 'config/billing_helpers.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['email']) || !isset($data['password'])) {
        throw new Exception("Email e senha são obrigatórios.");
    }

    $email = $data['email'];
    $password = $data['password'];

    // 1. Buscar Usuário
    $stmt = $pdo->prepare("SELECT id, store_id, email, password, name FROM customers WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        throw new Exception("Usuário não encontrado.");
    }

    // 2. Verificar Senha
    if (!password_verify($password, $user['password']) && $password !== $user['password']) {
        throw new Exception("Senha incorreta.");
    }

    $store_id = $user['store_id'];
    try { mbg_apply_subscription_maintenance($pdo, (int)$store_id); } catch (Throwable $maintErr) {}

    // 3. Buscar Loja
    $stmt = $pdo->prepare("
        SELECT s.id, s.name, s.subdomain, s.active, COALESCE(s.suspended,0) AS suspended, s.plan_id, p.display_name as plan_name 
        FROM stores s 
        LEFT JOIN plans p ON s.plan_id = p.id 
        WHERE s.id = ?
    ");
    $stmt->execute([$store_id]);
    $store = $stmt->fetch();

    if (!$store) {
        throw new Exception("Loja não encontrada.");
    }

    // 4. Se a loja não estiver ativa, buscar pedido pendente
    if (!$store['active'] || !empty($store['suspended'])) {
        $stmt = $pdo->prepare("
            SELECT o.id, o.total_amount, o.pix_qr_code, o.pix_copy_paste, o.status, p.display_name as plan_name
            FROM orders o
            LEFT JOIN stores s ON o.store_id = s.id
            LEFT JOIN plans p ON s.plan_id = p.id
            WHERE o.store_id = ? AND LOWER(COALESCE(o.status,'')) = 'pending' AND LOWER(COALESCE(o.tipo,'')) = 'sub'
            AND NOT EXISTS (SELECT 1 FROM subscription_changes sc WHERE sc.store_id=o.store_id AND sc.order_id=o.id AND sc.status IN ('scheduled','applied'))
            ORDER BY o.id DESC LIMIT 1
        ");
        $stmt->execute([$store_id]);
        $pendingOrder = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'store_id' => $store['id'],
                'store_name' => $store['name'],
                'subdomain' => $store['subdomain'],
                'plan_id' => isset($store['plan_id']) ? (int)$store['plan_id'] : null,
                'plan_name' => $store['plan_name'],
                'store_active' => 0,
                'store_suspended' => (int)($store['suspended'] ?? 0),
                'pending_order' => $pendingOrder
            ]
        ]);
        exit;
    }

    // Sucesso - Loja Ativa
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'store_id' => $store['id'],
            'store_name' => $store['name'],
            'subdomain' => $store['subdomain'],
            'plan_id' => isset($store['plan_id']) ? (int)$store['plan_id'] : null,
                'plan_name' => $store['plan_name'],
            'store_active' => 1,
            'store_suspended' => (int)($store['suspended'] ?? 0)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
