<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once 'config/database.php';
function send_json($data, int $status=200): void { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE); exit; }
function column_exists(PDO $pdo, string $table, string $col): bool { try { $s=$pdo->prepare('SHOW COLUMNS FROM `'.$table.'` LIKE ?'); $s->execute([$col]); return (bool)$s->fetch(PDO::FETCH_ASSOC); } catch (Throwable $e) { return false; } }
try {
  $action = $_GET['action'] ?? 'invoices';
  $store_id = isset($_GET['store_id']) ? (int)$_GET['store_id'] : 0;
  if ($store_id <= 0) throw new Exception('Store ID is required');

  if ($action === 'invoices') {
    
    $cols = [];
    foreach (['id','created_at','updated_at','status','total_amount','tipo'] as $c) { $cols[] = $c; }
    $orderCols = [];
    try { $r = $pdo->query("SHOW COLUMNS FROM orders"); foreach ($r->fetchAll(PDO::FETCH_ASSOC) as $col) { $orderCols[] = $col['Field']; } } catch (Throwable $e) {}
    if (in_array('pix_qr_code', $orderCols, true)) { $cols[] = 'pix_qr_code'; }
    elseif (in_array('pix_image', $orderCols, true)) { $cols[] = 'pix_image AS pix_qr_code'; }
    elseif (in_array('pix_qr', $orderCols, true)) { $cols[] = 'pix_qr AS pix_qr_code'; }
    if (in_array('pix_copy_paste', $orderCols, true)) { $cols[] = 'pix_copy_paste'; }
    elseif (in_array('pix_payload', $orderCols, true)) { $cols[] = 'pix_payload AS pix_copy_paste'; }
    $sql = "SELECT " . implode(', ', $cols) . " FROM orders WHERE store_id = ? AND LOWER(COALESCE(tipo,'')) = 'sub' ORDER BY created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$store_id]);
    send_json($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  if ($action === 'invoice_details') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) throw new Exception('Invoice ID is required');

    $whereTipo = column_exists($pdo, 'orders', 'tipo') ? " AND LOWER(COALESCE(tipo,'')) = 'sub'" : '';
    $st = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND store_id = ?" . $whereTipo . " LIMIT 1");
    $st->execute([$id, $store_id]);
    $invoice = $st->fetch(PDO::FETCH_ASSOC);
    if (!$invoice && $whereTipo) { $st = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND store_id = ? LIMIT 1"); $st->execute([$id, $store_id]); $invoice = $st->fetch(PDO::FETCH_ASSOC); }
    if (!$invoice) send_json(['success'=>false,'error'=>'Invoice not found'], 404);

    // aliases de pix (compatibilidade de colunas)
    if (!isset($invoice['pix_qr_code']) || !$invoice['pix_qr_code']) $invoice['pix_qr_code'] = $invoice['pix_image'] ?? ($invoice['pix_qr'] ?? null);
    if (!isset($invoice['pix_copy_paste']) || !$invoice['pix_copy_paste']) $invoice['pix_copy_paste'] = $invoice['pix_payload'] ?? null;

    try {
      $s = $pdo->prepare("SELECT name, subdomain, plan_id FROM stores WHERE id = ? LIMIT 1");
      $s->execute([$store_id]);
      if ($store = $s->fetch(PDO::FETCH_ASSOC)) {
        $invoice['store_name'] = $store['name'] ?? null;
        $invoice['subdomain'] = $store['subdomain'] ?? null;
        if (!empty($store['plan_id'])) {
          try {
            $p = $pdo->prepare("SELECT * FROM plans WHERE id = ? LIMIT 1");
            $p->execute([(int)$store['plan_id']]);
            if ($pr = $p->fetch(PDO::FETCH_ASSOC)) $invoice['plan_name'] = $pr['display_name'] ?? $pr['name'] ?? $pr['slug'] ?? 'Plano';
          } catch (Throwable $e) {}
        }
      }
    } catch (Throwable $e) {}

    try {
      // tenta coluna isAdmin; se não existir, pega primeiro cliente da loja
      try {
        $c = $pdo->prepare("SELECT * FROM customers WHERE store_id = ? AND isAdmin = 1 LIMIT 1");
        $c->execute([$store_id]);
      } catch (Throwable $e) {
        $c = $pdo->prepare("SELECT * FROM customers WHERE store_id = ? ORDER BY id ASC LIMIT 1");
        $c->execute([$store_id]);
      }
      if ($customer = $c->fetch(PDO::FETCH_ASSOC)) {
        $invoice['customer_name'] = $customer['name'] ?? null;
        $invoice['customer_email'] = $customer['email'] ?? null;
        $invoice['cpf_cnpj'] = $customer['cpf_cnpj'] ?? ($customer['cpf'] ?? null);
      }
    } catch (Throwable $e) {}

    send_json($invoice);
  }

  send_json(['success'=>false,'error'=>'Ação inválida'], 400);
} catch (Throwable $e) {
  send_json(['success'=>false,'error'=>$e->getMessage()], 500);
}
