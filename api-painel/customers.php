<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once 'config/database.php';
try {
    $method = $_SERVER['REQUEST_METHOD'];
    $store_id = isset($_GET['store_id']) ? (int)$_GET['store_id'] : 0;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $statusFilter = isset($_GET['status']) ? trim($_GET['status']) : 'all';
    if ($store_id <= 0 && $method === 'GET') throw new Exception('store_id obrigatório');
    if ($method === 'GET') {
        $stats = [];
        foreach (['total'=>"COUNT(*)", 'active'=>"SUM(status='active')", 'inactive'=>"SUM(status='inactive')"] as $k=>$expr) {
            $stmt = $pdo->prepare("SELECT {$expr} FROM customers WHERE store_id = ?"); $stmt->execute([$store_id]); $stats[$k] = (int)$stmt->fetchColumn();
        }
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM customers WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND store_id = ?"); $stmt->execute([$store_id]); $stats['new30days'] = (int)$stmt->fetchColumn();
        $query = "SELECT c.*, c.cpf AS cpf_cnpj, c.cpf AS document, COUNT(o.id) as total_orders, SUM(CASE WHEN o.status = 'paid' THEN o.total_amount ELSE 0 END) as total_spent, MAX(o.created_at) as last_purchase FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE c.store_id = :store_id";
        if ($statusFilter !== 'all') $query .= " AND c.status = :status";
        if ($search !== '') $query .= " AND (c.name LIKE :search OR c.email LIKE :search OR c.phone LIKE :search OR c.whatsapp LIKE :search)";
        $query .= " GROUP BY c.id ORDER BY c.created_at DESC";
        $stmt = $pdo->prepare($query);
        $stmt->bindValue(':store_id', $store_id, PDO::PARAM_INT);
        if ($statusFilter !== 'all') $stmt->bindValue(':status', $statusFilter);
        if ($search !== '') $stmt->bindValue(':search', "%{$search}%");
        $stmt->execute();
        echo json_encode(['stats'=>$stats,'customers'=>$stmt->fetchAll(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE); exit;
    }
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    $action = $data['action'] ?? 'status';
    if ($action === 'create') {
        $store_id = (int)($data['store_id'] ?? 0);
        if ($store_id <= 0) throw new Exception('store_id obrigatório');
        $name = trim((string)($data['name'] ?? ''));
        if ($name === '') throw new Exception('Nome do cliente é obrigatório.');
        $phone = trim((string)($data['phone'] ?? ''));
        $cpf = preg_replace('/\D+/', '', (string)($data['cpf_cnpj'] ?? ($data['document'] ?? '')));
        if ($cpf === '') $cpf = substr((string)time() . str_pad((string)random_int(1, 9999), 4, '0', STR_PAD_LEFT), 0, 14);
        $email = trim((string)($data['email'] ?? ''));
        if ($email === '') $email = 'cliente' . time() . random_int(100,999) . '@cliente.local';
        $password = password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT);
        $status = ($data['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';
        $stmt = $pdo->prepare("INSERT INTO customers (store_id,name,email,password,phone,whatsapp,cpf,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())");
        $stmt->execute([$store_id, $name, $email, $password, $phone ?: null, $phone ?: null, $cpf, $status]);
        echo json_encode(['success'=>true,'id'=>$pdo->lastInsertId()], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE); exit;
    }
    if (!isset($data['id'])) throw new Exception('ID do cliente não fornecido');
    if ($action === 'edit') {
        $phone = trim((string)($data['phone'] ?? ''));
        $cpf = preg_replace('/\D+/', '', (string)($data['cpf_cnpj'] ?? ($data['document'] ?? ($data['cpf'] ?? ''))));
        if ($cpf === '') $cpf = preg_replace('/\D+/', '', (string)($data['cpf'] ?? ''));
        if ($cpf === '') throw new Exception('CPF/CNPJ do cliente é obrigatório.');
        $stmt = $pdo->prepare("UPDATE customers SET name = ?, email = ?, phone = ?, whatsapp = ?, cpf = ?, status = ?, updated_at=NOW() WHERE id = ? AND store_id = ?");
        $stmt->execute([$data['name'], $data['email'], $phone ?: null, $phone ?: null, $cpf, $data['status'], $data['id'], (int)($data['store_id'] ?? 0)]);
    } else {
        $stmt = $pdo->prepare("UPDATE customers SET status = ?, updated_at=NOW() WHERE id = ?");
        $stmt->execute([$data['status'], $data['id']]);
    }
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
}
