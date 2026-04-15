<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once 'config/database.php';
function send_json($data, int $status = 200): void { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE); exit; }
function table_exists(PDO $pdo, string $table): bool { try { $st = $pdo->prepare("SHOW TABLES LIKE ?"); $st->execute([$table]); return (bool)$st->fetchColumn(); } catch (Throwable $e) { return false; } }
try {
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $action = $data['action'] ?? '';
    $store_id = (int)($data['store_id'] ?? 0);
    if ($store_id <= 0) throw new Exception('ID da loja não fornecido.');
    if ($action === 'save_bank_account') {
      if (!table_exists($pdo, 'wallet_bank_accounts')) throw new Exception('Tabela wallet_bank_accounts não encontrada. Rode o SQL de ajustes.');
      $pdo->prepare("INSERT INTO wallet_bank_accounts (store_id, bank_name, agency, account_number, account_type, pix_key_type, pix_key, holder_name, holder_document, updated_at) VALUES (?,?,?,?,?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE bank_name=VALUES(bank_name), agency=VALUES(agency), account_number=VALUES(account_number), account_type=VALUES(account_type), pix_key_type=VALUES(pix_key_type), pix_key=VALUES(pix_key), holder_name=VALUES(holder_name), holder_document=VALUES(holder_document), updated_at=NOW()")->execute([$store_id,$data['bank_name'] ?? null,$data['agency'] ?? null,$data['account_number'] ?? null,$data['account_type'] ?? 'corrente',$data['pix_key_type'] ?? null,$data['pix_key'] ?? null,$data['holder_name'] ?? null,$data['holder_document'] ?? null]);
      send_json(['success'=>true,'message'=>'Dados de saque atualizados.']);
    }
    if ($action === 'request_withdrawal') {
      if (!table_exists($pdo, 'wallet_withdrawals')) throw new Exception('Tabela wallet_withdrawals não encontrada. Rode o SQL de ajustes.');
      $amount = (float)($data['amount'] ?? 0);
      if ($amount <= 0) throw new Exception('Valor inválido para saque.');
      $stmt = $pdo->prepare("SELECT SUM(total_amount) FROM orders WHERE LOWER(COALESCE(status,''))='paid' AND store_id=? AND (tipo IS NULL OR LOWER(tipo) <> 'sub')");
      $stmt->execute([$store_id]); $available = (float)($stmt->fetchColumn() ?: 0);
      $stmt = $pdo->prepare("SELECT SUM(amount) FROM wallet_withdrawals WHERE store_id=? AND status IN ('pending','approved')");
      $stmt->execute([$store_id]); $used = (float)($stmt->fetchColumn() ?: 0);
      $balance = max(0, $available - $used);
      if ($amount > $balance) throw new Exception('Saldo insuficiente para saque.');
      $pdo->prepare("INSERT INTO wallet_withdrawals (store_id, amount, status, requested_at, notes) VALUES (?,?, 'pending', NOW(), ?)")->execute([$store_id,$amount,$data['notes'] ?? null]);
      send_json(['success'=>true,'message'=>'Saque solicitado com sucesso.']);
    }

    if ($action === 'cancel_withdrawal') {
      if (!table_exists($pdo, 'wallet_withdrawals')) throw new Exception('Tabela wallet_withdrawals não encontrada. Rode o SQL de ajustes.');
      $withdrawal_id = (int)($data['withdrawal_id'] ?? 0);
      if ($withdrawal_id <= 0) throw new Exception('Saque inválido.');
      $stmt = $pdo->prepare("SELECT status FROM wallet_withdrawals WHERE id=? AND store_id=? LIMIT 1");
      $stmt->execute([$withdrawal_id, $store_id]);
      $status = $stmt->fetchColumn();
      if (!$status) throw new Exception('Saque não encontrado.');
      if ($status !== 'pending') throw new Exception('Somente saques pendentes podem ser cancelados.');
      $pdo->prepare("UPDATE wallet_withdrawals SET status='canceled', canceled_at=NOW() WHERE id=? AND store_id=?")->execute([$withdrawal_id, $store_id]);
      send_json(['success'=>true,'message'=>'Saque cancelado com sucesso.']);
    }
    send_json(['success'=>false,'error'=>'Ação inválida'], 400);
  }

  $store_id = isset($_GET['store_id']) ? (int)$_GET['store_id'] : 0;
  if ($store_id <= 0) throw new Exception('ID da loja não fornecido.');
  $normalFilter = "store_id = ? AND (tipo IS NULL OR LOWER(tipo) <> 'sub')";
  $stmt = $pdo->prepare("SELECT SUM(total_amount) FROM orders WHERE LOWER(COALESCE(status,'')) = 'paid' AND $normalFilter"); $stmt->execute([$store_id]); $grossPaid = (float)($stmt->fetchColumn() ?: 0);
  $stmt = $pdo->prepare("SELECT SUM(total_amount) FROM orders WHERE LOWER(COALESCE(status,'')) = 'pending' AND $normalFilter"); $stmt->execute([$store_id]); $pending = (float)($stmt->fetchColumn() ?: 0);
  $withdrawnPending = 0.0; $withdrawnApproved = 0.0; $withdrawals = [];
  if (table_exists($pdo,'wallet_withdrawals')) {
    $stmt = $pdo->prepare("SELECT * FROM wallet_withdrawals WHERE store_id=? ORDER BY requested_at DESC, id DESC"); $stmt->execute([$store_id]); $withdrawals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($withdrawals as $w) { if ($w['status']==='pending') $withdrawnPending += (float)$w['amount']; if ($w['status']==='approved') $withdrawnApproved += (float)$w['amount']; }
  }
  $availableBalance = max(0, $grossPaid - $withdrawnPending - $withdrawnApproved);
  $pendingBalance = $pending + $withdrawnPending;
  $totalReceived = max(0, $grossPaid - $withdrawnApproved);
  $stmt = $pdo->prepare("SELECT id, total_amount as amount, CONCAT('Pedido ORD-000', id) as description, status, created_at as date FROM orders WHERE LOWER(COALESCE(status,'')) IN ('paid','pending') AND $normalFilter ORDER BY created_at DESC"); $stmt->execute([$store_id]); $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
  foreach ($withdrawals as $w) {
    $transactions[] = ['id'=>'withdraw-'.$w['id'],'withdrawal_id'=>(int)$w['id'],'amount'=>$w['amount'],'description'=>$w['status']==='canceled' ? 'Saque cancelado' : 'Saque solicitado','status'=>$w['status']==='approved' ? 'paid' : $w['status'],'date'=>$w['requested_at']];
  }
  usort($transactions, fn($a,$b)=>strcmp((string)$b['date'], (string)$a['date']));
  $bankAccount = null;
  if (table_exists($pdo,'wallet_bank_accounts')) { $stmt = $pdo->prepare("SELECT * FROM wallet_bank_accounts WHERE store_id=? LIMIT 1"); $stmt->execute([$store_id]); $bankAccount = $stmt->fetch(PDO::FETCH_ASSOC) ?: null; }
  send_json(['success'=>true,'availableBalance'=>$availableBalance,'pendingBalance'=>$pendingBalance,'totalReceived'=>$totalReceived,'transactions'=>$transactions,'bankAccount'=>$bankAccount,'withdrawals'=>$withdrawals]);
} catch (Throwable $e) { send_json(['success'=>false,'error'=>$e->getMessage()], 500); }
